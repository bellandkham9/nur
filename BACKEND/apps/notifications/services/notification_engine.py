from datetime import datetime, timedelta

from django.contrib.auth.models import User
from django.db import transaction
from django.utils import timezone

from apps.accounts.models import UserPreferences
from apps.notifications.models import Notification


class NotificationEngine:
    """
    Moteur central de planification des notifications.

    Responsabilités :
        - vérifier les préférences utilisateur ;
        - calculer les dates d'envoi ;
        - éviter les doublons ;
        - créer les notifications PENDING ;
        - mettre à jour les notifications existantes ;
        - annuler les notifications devenues inutiles.

    IMPORTANT :
        Ce moteur NE fait jamais l'envoi Web Push.

        NotificationEngine
            ↓
        Notification(PENDING)
            ↓
        process_notifications
            ↓
        WebPushService
    """

    # ============================================================
    # SOURCES
    # ============================================================

    SOURCE_ACTIVITY = "ACTIVITY"
    SOURCE_EVENT = "EVENT"
    SOURCE_DAILY_QUOTE = "DAILY_QUOTE"
    SOURCE_DAILY_REMINDER = "DAILY_REMINDER"
    SOURCE_FEAST = "FEAST"
    SOURCE_HOLY_DAY = "HOLY_DAY"

    EVENT_SOURCES = {
        SOURCE_EVENT,
        "PERSONAL",
        "MEETING",
        "STUDY",
    }

    DAILY_SOURCES = {
        SOURCE_DAILY_QUOTE,
        SOURCE_DAILY_REMINDER,
    }

    # ============================================================
    # PRÉFÉRENCES
    # ============================================================

    @classmethod
    def is_enabled(cls, user, source):
        """
        Détermine si l'utilisateur peut recevoir une notification
        provenant de cette source.
        """

        if not user:
            return False

        preferences = (
            UserPreferences.objects
            .filter(user=user)
            .first()
        )

        # --------------------------------------------------------
        # Aucun profil de préférences :
        # on applique les valeurs métier par défaut.
        # --------------------------------------------------------

        if preferences is None:

            if source in cls.DAILY_SOURCES:
                return False

            return True

        # --------------------------------------------------------
        # Interrupteur global
        # --------------------------------------------------------

        if not preferences.push_notifications_enabled:
            return False

        # --------------------------------------------------------
        # Événements / activités
        # --------------------------------------------------------

        if (
            source == cls.SOURCE_ACTIVITY
            or source in cls.EVENT_SOURCES
        ):
            return preferences.event_reminders_enabled

        # --------------------------------------------------------
        # DailyQuote / DailyReminder
        # --------------------------------------------------------

        if source in cls.DAILY_SOURCES:
            return preferences.daily_reminder_enabled

        # --------------------------------------------------------
        # Fêtes / jours saints / autres notifications
        # --------------------------------------------------------

        return True

    # ============================================================
    # NORMALISATION DATETIME
    # ============================================================

    @staticmethod
    def normalize_datetime(value):
        """
        Rend un datetime timezone-aware.
        """

        if value is None:
            return None

        if timezone.is_naive(value):
            return timezone.make_aware(
                value,
                timezone.get_current_timezone(),
            )

        return value

    # ============================================================
    # SMART REMINDER
    # ============================================================

    @classmethod
    def get_smart_reminder_minutes(cls, event_datetime):
        """
        Calcule le délai optimal avant un événement.

        Cette logique reprend celle de l'ancien NotificationService.
        """

        event_datetime = cls.normalize_datetime(event_datetime)

        if event_datetime is None:
            return None

        now = timezone.now()

        remaining = event_datetime - now

        if remaining.total_seconds() <= 0:
            return None

        if remaining > timedelta(days=7):
            return 24 * 60

        if remaining > timedelta(days=1):
            return 3 * 60

        if remaining > timedelta(hours=6):
            return 60

        if remaining > timedelta(hours=2):
            return 30

        if remaining > timedelta(minutes=30):
            return 10

        if remaining > timedelta(minutes=10):
            return 5

        if remaining > timedelta(minutes=5):
            return 3

        if remaining > timedelta(minutes=2):
            return 1

        return 0

    # ============================================================
    # CALCUL DATE DE NOTIFICATION
    # ============================================================

    @classmethod
    def calculate_scheduled_for(
        cls,
        event_datetime,
        reminder_minutes=None,
    ):
        """
        Calcule scheduled_for.

        Si reminder_minutes n'est pas fourni,
        utilise le smart reminder.
        """

        event_datetime = cls.normalize_datetime(event_datetime)

        if event_datetime is None:
            return None

        if reminder_minutes is None:
            reminder_minutes = (
                cls.get_smart_reminder_minutes(
                    event_datetime
                )
            )

        if reminder_minutes is None:
            return None

        scheduled_for = (
            event_datetime
            - timedelta(minutes=reminder_minutes)
        )

        # Un rappel qui aurait dû partir dans le passé
        # devient immédiatement disponible.
        now = timezone.now()

        if scheduled_for < now:
            scheduled_for = now

        return scheduled_for

    # ============================================================
    # FORMATAGE
    # ============================================================

    @staticmethod
    def format_reminder_delay(minutes):
        """
        Produit un texte lisible en français.
        """

        if minutes is None:
            return ""

        if minutes == 0:
            return "maintenant"

        if minutes == 1:
            return "1 minute"

        if minutes < 60:
            return f"{minutes} minutes"

        hours = minutes // 60

        if hours == 1:
            return "1 heure"

        if hours < 24:
            return f"{hours} heures"

        days = hours // 24

        if days == 1:
            return "1 jour"

        return f"{days} jours"

    # ============================================================
    # IDENTITÉ / DÉDUPLICATION
    # ============================================================

    @classmethod
    def find_existing(
        cls,
        user,
        source,
        event_id=None,
        event_code=None,
    ):
        """
        Recherche une notification existante à partir de son identité métier.

        Priorité :
            1. event_code
            2. event_id + source

        Les notifications CANCELLED sont ignorées.
        """

        queryset = Notification.objects.filter(
            user=user,
            event_source=source,
        ).exclude(
            status=Notification.Status.CANCELLED
        )

        # --------------------------------------------------------
        # Identité métier forte
        # --------------------------------------------------------

        if event_code:
            return (
                queryset
                .filter(event_code=event_code)
                .order_by("-id")
                .first()
            )

        # --------------------------------------------------------
        # Compatibilité avec les anciennes notifications
        # --------------------------------------------------------

        if event_id is not None:
            return (
                queryset
                .filter(event_id=event_id)
                .order_by("-id")
                .first()
            )

        return None


    # ============================================================
    # PLANIFICATION CENTRALE
    # ============================================================

    @classmethod
    @transaction.atomic
    def schedule(
        cls,
        *,
        user,
        source,
        title,
        message,
        scheduled_for,
        event_id=None,
        event_code="",
        update_pending=True,
    ):
        """
        Primitive centrale de création d'une notification.

        Aucun envoi Web Push ici.
        """

        if not user:
            return None

        if not cls.is_enabled(user, source):
            return None

        scheduled_for = cls.normalize_datetime(
            scheduled_for
        )

        if scheduled_for is None:
            return None

        existing = cls.find_existing(
            user=user,
            source=source,
            event_id=event_id,
            event_code=event_code,
        )

        if existing:

            if (
                existing.status == Notification.Status.PENDING
                and update_pending
            ):
                existing.title = title
                existing.message = message
                existing.scheduled_for = scheduled_for

                if event_code:
                    existing.event_code = event_code

                existing.save(
                    update_fields=[
                        "title",
                        "message",
                        "scheduled_for",
                        "event_code",
                    ]
                )

            return existing

        return Notification.objects.create(
            user=user,
            title=title,
            message=message,
            event_source=source,
            event_id=event_id,
            event_code=event_code or "",
            scheduled_for=scheduled_for,
            status=Notification.Status.PENDING,
        )
    # ============================================================
    # ANNULATION
    # ============================================================

    @classmethod
    @transaction.atomic
    def cancel(
        cls,
        *,
        user=None,
        source=None,
        event_id=None,
    ):
        """
        Annule les notifications PENDING correspondantes.

        On ne supprime pas la trace historique.
        """

        queryset = Notification.objects.filter(
            status=Notification.Status.PENDING,
        )

        if user is not None:
            queryset = queryset.filter(user=user)

        if source is not None:
            queryset = queryset.filter(
                event_source=source
            )

        if event_id is not None:
            queryset = queryset.filter(
                event_id=event_id
            )

        return queryset.update(
            status=Notification.Status.CANCELLED
        )

    # ============================================================
    # SYNCHRONISATION
    # ============================================================

    @classmethod
    def sync(
        cls,
        *,
        user,
        source,
        title,
        message,
        scheduled_for,
        event_id=None,
        event_code="",
    ):
        """
        Synchronise une notification métier.
        """

        if not cls.is_enabled(user, source):

            cls.cancel(
                user=user,
                source=source,
                event_id=event_id,
            )

            return None

        return cls.schedule(
            user=user,
            source=source,
            title=title,
            message=message,
            scheduled_for=scheduled_for,
            event_id=event_id,
            event_code=event_code,
        )