from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from .models import PersonalEvent
from .serializers import PersonalEventSerializer

from apps.notifications.models import Notification
from apps.notifications.services.notification_service import (
    NotificationService,
)


class PersonalEventViewSet(viewsets.ModelViewSet):
    """
    API CRUD des événements personnels.

    GET     /api/personal-events/
    POST    /api/personal-events/
    GET     /api/personal-events/<id>/
    PUT     /api/personal-events/<id>/
    PATCH   /api/personal-events/<id>/
    DELETE  /api/personal-events/<id>/
    """

    serializer_class = PersonalEventSerializer
    permission_classes = [IsAuthenticated]

    # ==========================================================
    # LISTE
    # ==========================================================

    def get_queryset(self):
        """
        L'utilisateur ne voit que ses propres événements.
        """

        return (
            PersonalEvent.objects
            .filter(user=self.request.user)
            .order_by(
                "date",
                "start_time",
                "id",
            )
        )

    # ==========================================================
    # CRÉATION
    # ==========================================================

    def perform_create(self, serializer):
        """
        Crée l'événement et programme automatiquement
        son rappel si nécessaire.
        """

        event = serializer.save(
            user=self.request.user
        )

        self._sync_notification(event)

    # ==========================================================
    # MODIFICATION
    # ==========================================================

    def perform_update(self, serializer):
        """
        Modifie l'événement et synchronise son rappel.

        Important :
        une modification d'un événement ne doit pas créer
        une nouvelle notification si une notification existe
        déjà pour cet événement.
        """

        event = serializer.save()

        self._sync_notification(event)

    # ==========================================================
    # SYNCHRONISATION NOTIFICATION
    # ==========================================================
    def _sync_notification(self, event):
        """
        Synchronise la notification de rappel avec l'événement.

        Règles :

        1. rappel désactivé
        → suppression des notifications PENDING

        2. rappel activé + notification existante
        → mise à jour de la notification existante

        3. rappel activé + aucune notification
        → création d'une notification

        4. plusieurs notifications historiques
        → une seule notification active est conservée
        """

        from datetime import datetime, timedelta
        from django.utils import timezone

        # ======================================================
        # RECHERCHE DES NOTIFICATIONS DE CET ÉVÉNEMENT
        # ======================================================

        notifications = Notification.objects.filter(
            user=event.user,
            event_source="personal",
            event_id=event.id,
        ).order_by(
            "created_at",
            "id",
        )

        # ======================================================
        # RAPPEL DÉSACTIVÉ
        # ======================================================

        if not event.reminder_enabled:

            notifications.filter(
                status=Notification.Status.PENDING
            ).delete()

            return

        # ======================================================
        # CALCUL DE LA DATE DU RAPPEL
        # ======================================================

        start_time = event.start_time

        if not start_time:
            start_time = datetime.min.time()

        event_datetime = datetime.combine(
            event.date,
            start_time,
        )

        if timezone.is_naive(event_datetime):
            event_datetime = timezone.make_aware(
                event_datetime,
                timezone.get_current_timezone(),
            )

        try:
            reminder_minutes = int(
                event.reminder_minutes
            )
        except (
            TypeError,
            ValueError,
        ):
            reminder_minutes = 30

        reminder_minutes = max(
            0,
            reminder_minutes,
        )

        scheduled_for = (
            event_datetime
            - timedelta(
                minutes=reminder_minutes
            )
        )

        # ======================================================
        # CHERCHER LA NOTIFICATION EXISTANTE
        # ======================================================

        notification = notifications.filter(
            status__in=[
                Notification.Status.PENDING,
                Notification.Status.SENT,
                Notification.Status.READ,
            ]
        ).first()

        # ======================================================
        # AUCUNE NOTIFICATION
        # ======================================================

        if notification is None:

            NotificationService.create_event_reminder({
                "id": event.id,
                "source": "personal",
                "title": event.title,
                "description": event.description,
                "date": event.date,
                "start_time": event.start_time,
                "reminder_enabled": event.reminder_enabled,
                "reminder_minutes": event.reminder_minutes,
                "user": event.user,
            })

            return

        # ======================================================
        # MISE À JOUR DE LA NOTIFICATION EXISTANTE
        # ======================================================

        notification.title = (
            f"Rappel : {event.title}"
        )

        notification.message = (
            f"L'événement « {event.title} » "
            f"commence dans "
            f"{reminder_minutes} minutes."
        )

        notification.event_source = "personal"
        notification.event_id = event.id
        notification.scheduled_for = scheduled_for

        # ======================================================
        # RESET SI DÉJÀ ENVOYÉE OU LUE
        # ======================================================

        if notification.status in (
            Notification.Status.READ,
            Notification.Status.SENT,
        ):
            notification.status = (
                Notification.Status.PENDING
            )

            notification.read_at = None

        notification.save(
            update_fields=[
                "title",
                "message",
                "event_source",
                "event_id",
                "scheduled_for",
                "status",
                "read_at",
            ]
        )

        # ======================================================
        # NETTOYAGE DES DOUBLONS PENDING
        # ======================================================

        notifications.filter(
            status=Notification.Status.PENDING
        ).exclude(
            id=notification.id
        ).delete()