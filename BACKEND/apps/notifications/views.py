from django.utils import timezone

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.conf import settings
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .tasks import process_notifications_task


from .models import Notification, PushSubscription
from .serializers import (
    NotificationSerializer,
    PushSubscriptionSerializer,
)


# ==========================================================
# NOTIFICATIONS
# ==========================================================

class NotificationViewSet(viewsets.ModelViewSet):
    """
    API de gestion des notifications
    de l'utilisateur connecté.
    """

    serializer_class = NotificationSerializer

    permission_classes = [
        IsAuthenticated,
    ]

    # ======================================================
    # QUERYSET
    # ======================================================

    def get_queryset(self):
        """
        Retourne uniquement les notifications
        appartenant à l'utilisateur connecté.
        """

        return (
            Notification.objects
            .filter(
                user=self.request.user
            )
            .order_by(
                "scheduled_for",
                "id",
            )
        )

    # ======================================================
    # CRÉATION
    # ======================================================

    def perform_create(self, serializer):
        """
        Associe automatiquement la notification
        à l'utilisateur connecté.
        """

        serializer.save(
            user=self.request.user
        )

    # ======================================================
    # MARQUER UNE NOTIFICATION COMME LUE
    # ======================================================

    @action(
        detail=True,
        methods=["post"],
        url_path="read",
    )
    def mark_as_read(self, request, pk=None):
        """
        Marque une notification comme lue.
        """

        notification = self.get_object()

        notification.status = (
            Notification.Status.READ
        )

        notification.read_at = timezone.now()

        notification.save(
            update_fields=[
                "status",
                "read_at",
            ]
        )

        return Response(
            NotificationSerializer(
                notification
            ).data,
            status=status.HTTP_200_OK,
        )

    # ======================================================
    # MARQUER TOUTES COMME LUES
    # ======================================================

    @action(
        detail=False,
        methods=["post"],
        url_path="read-all",
    )
    def mark_all_as_read(self, request):
        """
        Marque toutes les notifications
        de l'utilisateur comme lues.
        """

        now = timezone.now()

        updated_count = (
            Notification.objects
            .filter(
                user=request.user
            )
            .exclude(
                status=Notification.Status.READ
            )
            .update(
                status=Notification.Status.READ,
                read_at=now,
            )
        )

        return Response(
            {
                "success": True,
                "updated_count": updated_count,
                "message": (
                    f"{updated_count} "
                    f"notification(s) "
                    f"marquée(s) comme lue(s)."
                ),
            },
            status=status.HTTP_200_OK,
        )

    # ======================================================
    # ANNULER
    # ======================================================

    @action(
        detail=True,
        methods=["post"],
        url_path="cancel",
    )
    def cancel(self, request, pk=None):
        """
        Annule une notification.
        """

        notification = self.get_object()

        notification.status = (
            Notification.Status.CANCELLED
        )

        notification.save(
            update_fields=[
                "status",
            ]
        )

        return Response(
            NotificationSerializer(
                notification
            ).data,
            status=status.HTTP_200_OK,
        )


# ==========================================================
# PUSH SUBSCRIPTIONS
# ==========================================================

class PushSubscriptionViewSet(viewsets.ModelViewSet):
    """
    API de gestion des abonnements Web Push.
    """

    serializer_class = PushSubscriptionSerializer

    permission_classes = [
        IsAuthenticated,
    ]

    # ======================================================
    # QUERYSET
    # ======================================================

    def get_queryset(self):
        """
        Retourne uniquement les abonnements
        de l'utilisateur connecté.
        """

        return (
            PushSubscription.objects
            .filter(
                user=self.request.user
            )
            .order_by(
                "-created_at"
            )
        )

    # ======================================================
    # CRÉATION
    # ======================================================

    def perform_create(self, serializer):
        """
        Associe automatiquement l'abonnement
        à l'utilisateur connecté.
        """

        serializer.save(
            user=self.request.user
        )

    # ======================================================
    # SUBSCRIBE
    # ======================================================

    @action(
        detail=False,
        methods=["post"],
        url_path="subscribe",
    )
    def subscribe(self, request):
        """
        Crée ou met à jour un abonnement Push.

        Payload :

        {
            "endpoint": "...",
            "p256dh": "...",
            "auth": "..."
        }
        """

        endpoint = request.data.get(
            "endpoint"
        )

        p256dh = request.data.get(
            "p256dh"
        )

        auth = request.data.get(
            "auth"
        )

        if not endpoint:
            return Response(
                {
                    "detail": (
                        "endpoint est obligatoire."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not p256dh:
            return Response(
                {
                    "detail": (
                        "p256dh est obligatoire."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not auth:
            return Response(
                {
                    "detail": (
                        "auth est obligatoire."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        subscription, created = (
            PushSubscription.objects
            .update_or_create(
                endpoint=endpoint,
                defaults={
                    "user": request.user,
                    "p256dh": p256dh,
                    "auth": auth,
                },
            )
        )

        serializer = self.get_serializer(
            subscription
        )

        return Response(
            {
                "created": created,
                "subscription": serializer.data,
            },
            status=(
                status.HTTP_201_CREATED
                if created
                else status.HTTP_200_OK
            ),
        )

    # ======================================================
    # UNSUBSCRIBE
    # ======================================================

    @action(
        detail=False,
        methods=["post"],
        url_path="unsubscribe",
    )
    def unsubscribe(self, request):
        """
        Supprime un abonnement Push.
        """

        endpoint = request.data.get(
            "endpoint"
        )

        if not endpoint:
            return Response(
                {
                    "detail": (
                        "endpoint est obligatoire."
                    )
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

        if deleted == 0:
            return Response(
                {
                    "detail": (
                        "Abonnement introuvable."
                    )
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response(
            {
                "detail": (
                    "Abonnement supprimé."
                )
            },
            status=status.HTTP_200_OK,
        )

    # ==========================================================
    # CRON — TRAITEMENT DES NOTIFICATIONS
    # ==========================================================

@api_view(["POST"])
@permission_classes([AllowAny])
def process_notifications_cron(request):
        """
        Endpoint appelé par cron-job.org.

        Le secret envoyé dans le header X-Cron-Secret
        permet d'empêcher les appels non autorisés.
        """

        cron_secret = request.headers.get("X-Cron-Secret")

        expected_secret = getattr(
            settings,
            "CRON_SECRET",
            "",
        )

        if not expected_secret:
            return Response(
                {
                    "success": False,
                    "detail": "CRON_SECRET non configuré.",
                },
                status=500,
            )

        if cron_secret != expected_secret:
            return Response(
                {
                    "success": False,
                    "detail": "Non autorisé.",
                },
                status=403,
            )

        result = process_notifications_task()

        return Response(
            {
                "success": True,
                "message": "Notifications traitées.",
                "result": result,
            },
            status=status.HTTP_200_OK,
        )    


# ============================================================
# TRAITEMENT AUTOMATIQUE DES NOTIFICATIONS
# ============================================================

@csrf_exempt
def process_notifications_internal(request):
    """
    Endpoint interne appelé par le scheduler externe.

    Il déclenche exactement le même moteur que :

        python manage.py process_notifications

    L'accès est protégé par X-Notification-Secret.
    """

    if request.method != "POST":
        return JsonResponse(
            {
                "success": False,
                "detail": "Méthode non autorisée.",
            },
            status=405,
        )

    secret = request.headers.get("X-Notification-Secret")

    expected_secret = getattr(
        settings,
        "NOTIFICATION_PROCESS_SECRET",
        None,
    )

    if not expected_secret:
        return JsonResponse(
            {
                "success": False,
                "detail": "Secret de traitement non configuré.",
            },
            status=500,
        )

    if not secret or secret != expected_secret:
        return JsonResponse(
            {
                "success": False,
                "detail": "Non autorisé.",
            },
            status=403,
        )

    try:
        from apps.notifications.management.commands.process_notifications import (
            Command,
        )

        Command().handle()

        return JsonResponse(
            {
                "success": True,
                "message": "Notifications traitées.",
            },
            status=200,
        )

    except Exception as exc:
        print(
            f"❌ Erreur traitement automatique "
            f"des notifications : {exc}"
        )

        return JsonResponse(
            {
                "success": False,
                "detail": "Erreur lors du traitement des notifications.",
            },
            status=500,
        )