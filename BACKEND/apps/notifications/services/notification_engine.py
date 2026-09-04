from datetime import datetime, timedelta

from django.contrib.auth.models import User
from django.db import transaction
from django.utils import timezone

from apps.accounts.models import UserPreferences
from apps.notifications.models import Notification


class NotificationEngine:
    """
    Moteur central de création, synchronisation et annulation
    des notifications.

    Règle fondamentale :
        Les services métier ne doivent pas créer directement
        Notification.objects.create().

        Ils doivent passer par NotificationEngine.
    """

    # =========================================================
    # SOURCES OFFICIELLES
    # =========================================================

    SOURCE_ACTIVITY = "ACTIVITY"
    SOURCE_EVENT = "EVENT"
    SOURCE_DAILY_QUOTE = "DAILY_QUOTE"
    SOURCE_DAILY_REMINDER = "DAILY_REMINDER"
    SOURCE_FEAST = "FEAST"
    SOURCE_HOLY_DAY = "HOLY_DAY"

    SOURCE_PERSONAL = "PERSONAL"
    SOURCE_MEETING = "MEETING"
    SOURCE_STUDY = "STUDY"

    EVENT_SOURCES = {
        SOURCE_EVENT,
        SOURCE_PERSONAL,
        SOURCE_MEETING,
        SOURCE_STUDY,
        SOURCE_ACTIVITY,
    }

    DAILY_SOURCES = {
        SOURCE_DAILY_QUOTE,
        SOURCE_DAILY_REMINDER,
    }

    # =========================================================
    # PRÉFÉRENCES
    # =========================================================

    @classmethod
    def is_enabled(cls, user, source):
        """
        Détermine si les notifications d'une source sont autorisées.
        """

        if not user:
            return False

        try:
            preferences = user.preferences
        except UserPreferences.DoesNotExist:
            preferences = None

        if preferences is None:
            # Pour les notifications quotidiennes, on exige
            # explicitement des préférences.
            if source in cls.DAILY_SOURCES:
                return False

            return True

        # Interrupteur global
        if not preferences.push_notifications_enabled:
            return False

        # Notifications liées aux événements
        if source in cls.EVENT_SOURCES:
            return preferences.event_reminders_enabled

        # Notifications quotidiennes
        if source in cls.DAILY_SOURCES:
            return preferences.daily_reminder_enabled

        return True

    # =========================================================
    # NORMALISATION DATETIME
    # =========================================================

    @staticmethod
    def normalize_datetime(value):
        """
        Retourne un datetime timezone-aware.
        """

        if value is None:
            return None

        if timezone.is_naive(value):
            return timezone.make_aware(
                value,
                timezone.get_current_timezone(),
            )

        return value

    # =========================================================
    # RAPPEL INTELLIGENT
    # =========================================================

    @staticmethod
    def get_smart_reminder_minutes(event_datetime):
        """
        Calcule automatiquement le délai du rappel.

        Retourne :
            int     nombre de minutes
            0       immédiatement
            None    événement déjà passé
        """

        event_datetime = NotificationEngine.normalize_datetime(
            event_datetime
        )

        if event_datetime is None:
            return None

        now = timezone.now()

        if event_datetime <= now:
            return None

        delta = event_datetime - now
        total_seconds = delta.total_seconds()
        total_minutes = total_seconds / 60

        if total_minutes > 7 * 24 * 60:
            return 24 * 60

        if total_minutes > 24 * 60:
            return 3 * 60

        if total_minutes > 6 * 60:
            return 60

        if total_minutes > 2 * 60:
            return 30

        if total_minutes > 30:
            return 10

        if total_minutes > 10:
            return 5

        if total_minutes > 5:
            return 3

        if total_minutes > 2:
            return 1

        return 0

    # =========================================================
    # DATE DE PLANIFICATION
    # =========================================================

    @classmethod
    def calculate_scheduled_for(
        cls,
        event_datetime,
        reminder_minutes=None,
    ):
        """
        Calcule la date/heure effective d'envoi.
        """

        event_datetime = cls.normalize_datetime(event_datetime)

        if event_datetime is None:
            return None

        if reminder_minutes is None:
            reminder_minutes = cls.get_smart_reminder_minutes(
                event_datetime
            )

        if reminder_minutes is None:
            return None

        scheduled_for = (
            event_datetime
            - timedelta(minutes=reminder_minutes)
        )

        now = timezone.now()

        if scheduled_for < now:
            scheduled_for = now

        return scheduled_for

    # =========================================================
    # FORMATAGE
    # =========================================================

    @staticmethod
    def format_reminder_delay(minutes):
        if minutes is None:
            return ""

        if minutes == 0:
            return "maintenant"

        if minutes < 60:
            return f"dans {minutes} min"

        if minutes % (24 * 60) == 0:
            days = minutes // (24 * 60)
            return f"dans {days} jour{'s' if days > 1 else ''}"

        if minutes % 60 == 0:
            hours = minutes // 60
            return f"dans {hours} heure{'s' if hours > 1 else ''}"

        hours = minutes // 60
        remaining = minutes % 60

        if hours:
            return f"dans {hours}h{remaining:02d}"

        return f"dans {remaining} min"

    # =========================================================
    # RECHERCHE D'UNE NOTIFICATION EXISTANTE
    # =========================================================

    @classmethod
    def find_existing(
        cls,
        user,
        source,
        event_id=None,
        event_code=None,
    ):
        """
        Recherche une notification active correspondant
        à la même occurrence métier.

        Les notifications CANCELLED ne sont pas réutilisées.
        """

        queryset = Notification.objects.filter(
            user=user,
            event_source=source,
        ).exclude(
            status=Notification.Status.CANCELLED
        )

        if event_code:
            return queryset.filter(
                event_code=event_code
            ).order_by("-id").first()

        if event_id is not None:
            return queryset.filter(
                event_id=event_id
            ).order_by("-id").first()

        return None

    # =========================================================
    # PLANIFICATION CENTRALE
    # =========================================================

    @classmethod
    @transaction.atomic
    def schedule(
        cls,
        user,
        source,
        title,
        message,
        scheduled_for,
        event_id=None,
        event_code=None,
        update_pending=True,
    ):
        """
        Point d'entrée central pour créer une notification.

        Aucun service métier ne doit appeler directement :
            Notification.objects.create()

        Il doit appeler cette méthode.
        """

        if not user:
            return None

        if not source:
            raise ValueError("La source de notification est obligatoire.")

        if not title:
            raise ValueError("Le titre de notification est obligatoire.")

        if not message:
            raise ValueError("Le message de notification est obligatoire.")

        scheduled_for = cls.normalize_datetime(scheduled_for)

        if scheduled_for is None:
            raise ValueError(
                "scheduled_for est obligatoire."
            )

        if not cls.is_enabled(user, source):
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

                if event_id is not None:
                    existing.event_id = event_id

                if event_code:
                    existing.event_code = event_code

                existing.save(
                    update_fields=[
                        "title",
                        "message",
                        "scheduled_for",
                        "event_id",
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
            event_code=event_code,
            scheduled_for=scheduled_for,
            status=Notification.Status.PENDING,
        )

    # =========================================================
    # SYNCHRONISATION
    # =========================================================

    @classmethod
    def sync(
        cls,
        user,
        source,
        title,
        message,
        scheduled_for,
        event_id=None,
        event_code=None,
    ):
        """
        Synchronise une notification avec son objet métier.

        Si les notifications sont désactivées :
            notification PENDING → CANCELLED
        """

        if not user:
            return None

        if not cls.is_enabled(user, source):
            if event_code:
                Notification.objects.filter(
                    user=user,
                    event_source=source,
                    event_code=event_code,
                    status=Notification.Status.PENDING,
                ).update(
                    status=Notification.Status.CANCELLED
                )

            elif event_id is not None:
                Notification.objects.filter(
                    user=user,
                    event_source=source,
                    event_id=event_id,
                    status=Notification.Status.PENDING,
                ).update(
                    status=Notification.Status.CANCELLED
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
            update_pending=True,
        )

    # =========================================================
    # ANNULATION
    # =========================================================

    @classmethod
    def cancel(
        cls,
        user,
        source,
        event_id=None,
        event_code=None,
    ):
        """
        Annule uniquement les notifications PENDING
        correspondant à l'objet métier.
        """

        queryset = Notification.objects.filter(
            user=user,
            event_source=source,
            status=Notification.Status.PENDING,
        )

        if event_code:
            queryset = queryset.filter(
                event_code=event_code
            )
        elif event_id is not None:
            queryset = queryset.filter(
                event_id=event_id
            )
        else:
            return 0

        updated = queryset.update(
            status=Notification.Status.CANCELLED
        )

        return updated