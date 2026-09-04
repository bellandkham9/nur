from datetime import timedelta

from django.contrib.auth.models import User
from django.utils import timezone

from apps.notifications.models import Notification
from apps.notifications.services.notification_engine import (
    NotificationEngine,
)


class BahaiNotificationService:
    """
    Orchestration des notifications liées au calendrier bahá'í.
    """

    DEFAULT_HOUR = 7
    DEFAULT_MINUTE = 0
    DAYS_AHEAD = 30

    @staticmethod
    def get_users():
        return User.objects.filter(
            is_active=True,
            preferences__push_notifications_enabled=True,
        ).distinct()

    @classmethod
    def build_scheduled_datetime(cls, event_date):
        tz = timezone.get_current_timezone()

        value = event_date

        if hasattr(value, "date"):
            value = value.date()

        naive = timezone.datetime.combine(
            value,
            timezone.datetime.min.time().replace(
                hour=cls.DEFAULT_HOUR,
                minute=cls.DEFAULT_MINUTE,
            ),
        )

        return timezone.make_aware(
            naive,
            timezone=tz,
        )

    @staticmethod
    def build_title(event):
        event_type = str(
            getattr(event, "event_type", "")
        ).upper()

        if event_type == "HOLY_DAY":
            return f"Jour saint : {event.name}"

        return f"Fête bahá'íe : {event.name}"

    @staticmethod
    def build_message(event):
        return (
            f"{event.name} aura lieu le "
            f"{event.date.strftime('%d/%m/%Y')}."
        )

    @classmethod
    def create_notification_for_event(
        cls,
        user,
        event,
    ):
        event_date = getattr(event, "date", None)

        if not event_date:
            return None

        event_type = str(
            getattr(event, "event_type", "")
        ).upper()

        if event_type == "HOLY_DAY":
            source = NotificationEngine.SOURCE_HOLY_DAY
        else:
            source = NotificationEngine.SOURCE_FEAST

        event_code = (
            f"{source}_{getattr(event, 'id', None)}_"
            f"{event_date.isoformat()}"
        )

        scheduled_for = cls.build_scheduled_datetime(
            event_date
        )

        if scheduled_for < timezone.now():
            return None

        return NotificationEngine.schedule(
            user=user,
            source=source,
            title=cls.build_title(event),
            message=cls.build_message(event),
            scheduled_for=scheduled_for,
            event_id=getattr(event, "id", None),
            event_code=event_code,
        )

    @classmethod
    def generate_upcoming_notifications(cls):
        from apps.notifications.services.bahai_calendar_service import (
            get_all_events,
        )

        today = timezone.localdate()
        end_date = today + timedelta(days=cls.DAYS_AHEAD)

        events = get_all_events(
            start_date=today,
            end_date=end_date,
        )

        users = cls.get_users()

        created = 0

        for user in users:
            for event in events:
                notification = cls.create_notification_for_event(
                    user,
                    event,
                )

                if notification:
                    created += 1

        return created


class NotificationService:
    """
    Services métier pour les rappels d'événements,
    activités et rappels quotidiens.

    La création réelle est toujours déléguée
    à NotificationEngine.
    """

    # =========================================================
    # RAPPELS
    # =========================================================

    @staticmethod
    def get_smart_reminder_minutes(event_datetime):
        return NotificationEngine.get_smart_reminder_minutes(
            event_datetime
        )

    @staticmethod
    def format_reminder_delay(minutes):
        return NotificationEngine.format_reminder_delay(
            minutes
        )

    @staticmethod
    def reminders_enabled(user):
        if not user:
            return False

        try:
            preferences = user.preferences
        except Exception:
            return True

        return (
            preferences.push_notifications_enabled
            and preferences.event_reminders_enabled
        )

    # =========================================================
    # EVENT
    # =========================================================

    @classmethod
    def create_event_reminder(cls, event):
        if not event:
            return None

        user = getattr(event, "user", None)

        if not user:
            user = getattr(event, "created_by", None)

        if not user:
            return None

        if not cls.reminders_enabled(user):
            return None

        event_datetime = getattr(
            event,
            "start_datetime",
            None,
        )

        if not event_datetime:
            event_datetime = getattr(
                event,
                "date",
                None,
            )

        if not event_datetime:
            return None

        event_datetime = NotificationEngine.normalize_datetime(
            event_datetime
        )

        reminder_minutes = (
            NotificationEngine.get_smart_reminder_minutes(
                event_datetime
            )
        )

        if reminder_minutes is None:
            return None

        scheduled_for = (
            NotificationEngine.calculate_scheduled_for(
                event_datetime,
                reminder_minutes,
            )
        )

        if scheduled_for is None:
            return None

        source = getattr(
            event,
            "notification_source",
            NotificationEngine.SOURCE_EVENT,
        )

        event_code = (
            f"{source}_{event.id}"
        )

        title = getattr(
            event,
            "notification_title",
            None,
        ) or getattr(
            event,
            "title",
            "Rappel",
        )

        message = getattr(
            event,
            "notification_message",
            None,
        ) or (
            f"Rappel pour l'événement "
            f"« {getattr(event, 'title', 'événement')} »."
        )

        return NotificationEngine.schedule(
            user=user,
            source=source,
            title=title,
            message=message,
            scheduled_for=scheduled_for,
            event_id=event.id,
            event_code=event_code,
        )

    @classmethod
    def sync_event_reminder(cls, event):
        if not event:
            return None

        user = getattr(event, "user", None)

        if not user:
            user = getattr(event, "created_by", None)

        if not user:
            return None

        source = getattr(
            event,
            "notification_source",
            NotificationEngine.SOURCE_EVENT,
        )

        event_code = f"{source}_{event.id}"

        if not cls.reminders_enabled(user):
            NotificationEngine.cancel(
                user=user,
                source=source,
                event_id=event.id,
                event_code=event_code,
            )
            return None

        return cls.create_event_reminder(event)

    # =========================================================
    # ACTIVITIES
    # =========================================================

    @classmethod
    def sync_activity_reminders(cls, activity):
        if not activity:
            return []

        if getattr(activity, "status", None) == "CANCELLED":
            users = []

            organizer = getattr(
                activity,
                "organizer",
                None,
            )

            if organizer:
                users.append(organizer)

            try:
                participants = activity.participants.filter(
                    status="ACCEPTED"
                )

                users.extend(
                    participant.user
                    for participant in participants
                    if participant.user
                )
            except Exception:
                pass

            for user in users:
                NotificationEngine.cancel(
                    user=user,
                    source=NotificationEngine.SOURCE_ACTIVITY,
                    event_id=activity.id,
                    event_code=f"ACTIVITY_{activity.id}",
                )

            return []

        if getattr(activity, "status", None) != "PUBLISHED":
            return []

        start_datetime = getattr(
            activity,
            "start_datetime",
            None,
        )

        if not start_datetime:
            return []

        users = {}

        organizer = getattr(
            activity,
            "organizer",
            None,
        )

        if organizer:
            users[organizer.id] = organizer

        try:
            participants = activity.participants.filter(
                status="ACCEPTED"
            )

            for participant in participants:
                if participant.user:
                    users[participant.user.id] = (
                        participant.user
                    )
        except Exception:
            pass

        notifications = []

        for user in users.values():
            notification = cls.create_activity_reminder(
                activity,
                user,
            )

            if notification:
                notifications.append(notification)

        return notifications

    @classmethod
    def create_activity_reminder(
        cls,
        activity,
        user,
    ):
        if not activity or not user:
            return None

        if not cls.reminders_enabled(user):
            return None

        start_datetime = getattr(
            activity,
            "start_datetime",
            None,
        )

        if not start_datetime:
            return None

        reminder_minutes = (
            NotificationEngine.get_smart_reminder_minutes(
                start_datetime
            )
        )

        if reminder_minutes is None:
            return None

        scheduled_for = (
            NotificationEngine.calculate_scheduled_for(
                start_datetime,
                reminder_minutes,
            )
        )

        if scheduled_for is None:
            return None

        title = (
            getattr(
                activity,
                "title",
                None,
            )
            or "Rappel d'activité"
        )

        message = (
            f"L'activité « {title} » "
            f"commence "
            f"{NotificationEngine.format_reminder_delay(reminder_minutes)}."
        )

        return NotificationEngine.schedule(
            user=user,
            source=NotificationEngine.SOURCE_ACTIVITY,
            title=f"📅 {title}",
            message=message,
            scheduled_for=scheduled_for,
            event_id=activity.id,
            event_code=f"ACTIVITY_{activity.id}",
        )

    # =========================================================
    # DAILY REMINDER
    # =========================================================

    @classmethod
    def create_daily_reminder(cls, user):
        if not user:
            return None

        try:
            preferences = user.preferences
        except Exception:
            return None

        if not (
            preferences.push_notifications_enabled
            and preferences.daily_reminder_enabled
        ):
            return None

        now = timezone.localtime()

        scheduled_for = now.replace(
            hour=8,
            minute=0,
            second=0,
            microsecond=0,
        )

        if scheduled_for <= now:
            scheduled_for += timedelta(days=1)

        return NotificationEngine.schedule(
            user=user,
            source=NotificationEngine.SOURCE_DAILY_REMINDER,
            title="🌅 Votre rappel quotidien",
            message="Prenez quelques instants pour votre moment spirituel.",
            scheduled_for=scheduled_for,
            event_code=(
                f"DAILY_REMINDER_"
                f"{scheduled_for.date().isoformat()}"
            ),
        )

    # =========================================================
    # BATCH
    # =========================================================

    @classmethod
    def create_reminders_for_events(cls, events):
        notifications = []

        for event in events:
            notification = cls.create_event_reminder(event)

            if notification:
                notifications.append(notification)

        return notifications