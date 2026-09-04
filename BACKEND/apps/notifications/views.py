from django.conf import settings
from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.daily_quotes.services.quote_notification_service import (
    QuoteNotificationService,
)

from apps.notifications.models import (
    Notification,
    PushSubscription,
)

from apps.notifications.serializers import (
    NotificationSerializer,
    PushSubscriptionSerializer,
)

from apps.notifications.services.notification_processor import (
    NotificationProcessor,
)


# ==========================================================
# NOTIFICATIONS UTILISATEUR
# ==========================================================

class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API utilisateur des notifications.

    La création des notifications est interdite via l'API.
    Les notifications sont créées par les services métier
    via NotificationEngine.
    """

    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (
            Notification.objects
            .filter(
                user=self.request.user,
            )
            .order_by(
                "scheduled_for",
                "id",
            )
        )

    @action(
        detail=True,
        methods=["post"],
        url_path="read",
    )
    def mark_as_read(self, request, pk=None):
        notification = self.get_object()

        if notification.status != Notification.Status.READ:
            notification.status = Notification.Status.READ
            notification.read_at = timezone.now()

            notification.save(
                update_fields=[
                    "status",
                    "read_at",
                ]
            )

        return Response(
            NotificationSerializer(
                notification,
                context={"request": request},
            ).data
        )

    @action(
        detail=False,
        methods=["post"],
        url_path="read-all",
    )
    def mark_all_as_read(self, request):
        updated = (
            Notification.objects
            .filter(
                user=request.user,
            )
            .exclude(
                status=Notification.Status.READ,
            )
            .update(
                status=Notification.Status.READ,
                read_at=timezone.now(),
            )
        )

        return Response(
            {
                "success": True,
                "updated": updated,
            }
        )

    @action(
        detail=True,
        methods=["post"],
        url_path="cancel",
    )
    def cancel(self, request, pk=None):
        notification = self.get_object()

        if notification.status == Notification.Status.PENDING:
            notification.status = Notification.Status.CANCELLED

            notification.save(
                update_fields=[
                    "status",
                ]
            )

        return Response(
            NotificationSerializer(
                notification,
                context={"request": request},
            ).data
        )


# ==========================================================
# PUSH SUBSCRIPTIONS
# ==========================================================

class PushSubscriptionViewSet(viewsets.ModelViewSet):
    """
    Gestion des abonnements Web Push de l'utilisateur.
    """

    serializer_class = PushSubscriptionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return PushSubscription.objects.filter(
            user=self.request.user
        )

    def perform_create(self, serializer):
        serializer.save(
            user=self.request.user
        )

    @action(
        detail=False,
        methods=["post"],
        url_path="subscribe",
    )
    def subscribe(self, request):
        endpoint = request.data.get("endpoint")
        p256dh = request.data.get("p256dh")
        auth = request.data.get("auth")

        if not endpoint:
            return Response(
                {
                    "detail": "endpoint est obligatoire."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not p256dh or not auth:
            return Response(
                {
                    "detail": (
                        "p256dh et auth sont obligatoires."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        subscription, created = (
            PushSubscription.objects.update_or_create(
                endpoint=endpoint,
                defaults={
                    "user": request.user,
                    "p256dh": p256dh,
                    "auth": auth,
                },
            )
        )

        return Response(
            {
                "success": True,
                "created": created,
                "id": subscription.id,
            },
            status=(
                status.HTTP_201_CREATED
                if created
                else status.HTTP_200_OK
            ),
        )

    @action(
        detail=False,
        methods=["post"],
        url_path="unsubscribe",
    )
    def unsubscribe(self, request):
        endpoint = request.data.get("endpoint")

        if not endpoint:
            return Response(
                {
                    "detail": "endpoint est obligatoire."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        deleted, _ = (
            PushSubscription.objects
            .filter(
                user=request.user,
                endpoint=endpoint,
            )
            .delete()
        )

        return Response(
            {
                "success": True,
                "deleted": deleted,
            }
        )


# ==========================================================
# CRON JOB
# ==========================================================

@csrf_exempt
def process_notifications_cron(request):
    """
    Endpoint principal appelé par cron-job.org.

    Responsabilités :

    1. Générer les Daily Quotes qui sont dues.
    2. Traiter les notifications PENDING dont
       scheduled_for <= maintenant.
    """

    if request.method != "POST":
        return JsonResponse(
            {
                "detail": "Méthode POST uniquement."
            },
            status=405,
        )

    # ------------------------------------------------------
    # AUTHENTIFICATION CRON
    # ------------------------------------------------------

    expected_secret = getattr(
        settings,
        "CRON_SECRET",
        None,
    )

    provided_secret = request.headers.get(
        "X-Cron-Secret"
    )

    if (
        not expected_secret
        or provided_secret != expected_secret
    ):
        return JsonResponse(
            {
                "detail": "Unauthorized."
            },
            status=401,
        )

    # ------------------------------------------------------
    # 1. GÉNÉRATION DAILY QUOTES
    # ------------------------------------------------------

    daily_quotes_result = (
        QuoteNotificationService
        .generate_due_quotes()
    )

    # ------------------------------------------------------
    # 2. TRAITEMENT NOTIFICATIONS DUES
    # ------------------------------------------------------

    notifications_result = (
        NotificationProcessor
        .process_due_notifications()
    )

    # ------------------------------------------------------
    # RÉPONSE
    # ------------------------------------------------------

    return JsonResponse(
        {
            "success": True,
            "daily_quotes": daily_quotes_result,
            "notifications": notifications_result,
        }
    )


# ==========================================================
# TRAITEMENT INTERNE
# ==========================================================

@csrf_exempt
def process_notifications_internal(request):
    """
    Endpoint interne de traitement.

    Utilise NOTIFICATION_PROCESS_SECRET.
    """

    if request.method != "POST":
        return JsonResponse(
            {
                "detail": "Méthode POST uniquement."
            },
            status=405,
        )

    expected_secret = getattr(
        settings,
        "NOTIFICATION_PROCESS_SECRET",
        None,
    )

    provided_secret = request.headers.get(
        "X-Notification-Secret"
    )

    if (
        not expected_secret
        or provided_secret != expected_secret
    ):
        return JsonResponse(
            {
                "detail": "Unauthorized."
            },
            status=401,
        )

    result = (
        NotificationProcessor
        .process_due_notifications()
    )

    return JsonResponse(
        {
            "success": True,
            "result": result,
        }
    )