from datetime import datetime, timedelta

from django.utils import timezone

from apps.accounts.models import UserPreferences
from apps.activities.models import ActivityParticipant
from apps.notifications.models import Notification




from datetime import datetime, time, timedelta

from django.utils import timezone

from apps.notifications.models import Notification
from apps.bahai_calendar.services.events import (
    FEAST,
    HOLY_DAY,
    get_all_events,
)


class BahaiNotificationService:
    """
    Génère les notifications liées aux événements
    du calendrier bahá'í.
    """

    # ==========================================================
    # PARAMÈTRES
    # ==========================================================

    DEFAULT_HOUR = 7
    DEFAULT_MINUTE = 0

    # Nombre de jours à l'avance pour créer les notifications.
    DAYS_AHEAD = 30

    # ==========================================================
    # UTILISATEURS
    # ==========================================================

    @staticmethod
    def get_users():
        """
        Retourne les utilisateurs pour lesquels les notifications
        Push sont activées.
        """

        from django.contrib.auth import get_user_model
        from apps.accounts.models import UserPreferences

        User = get_user_model()

        return User.objects.filter(
            preferences__push_notifications_enabled=True
        )

    # ==========================================================
    # DATE DE NOTIFICATION
    # ==========================================================

    @classmethod
    def build_scheduled_datetime(cls, event_date):
        """
        Construit la date/heure d'envoi.

        Pour l'instant :
            événement → notification à 07:00 le jour même.
        """

        naive_datetime = datetime.combine(
            event_date,
            time(
                cls.DEFAULT_HOUR,
                cls.DEFAULT_MINUTE,
            ),
        )

        return timezone.make_aware(
            naive_datetime,
            timezone.get_current_timezone(),
        )

    # ==========================================================
    # CONTENU
    # ==========================================================

    @staticmethod
    def build_title(event):
        """
        Construit le titre de la notification.
        """

        if event["event_type"] == FEAST:
            return f"🕊️ {event['name']}"

        if event["event_type"] == HOLY_DAY:
            return f"🌟 {event['name']}"

        return event["name"]

    @staticmethod
    def build_message(event):
        """
        Construit le message de la notification.
        """

        if event["event_type"] == FEAST:

            return (
                f"Aujourd'hui : {event['name']}. "
                f"{event['description']}"
            )

        if event["event_type"] == HOLY_DAY:

            message = (
                f"Aujourd'hui : {event['name']}. "
                f"{event['description']}"
            )

            if event.get("work_suspension"):
                message += (
                    " Le travail est suspendu "
                    "pour cette journée."
                )

            return message

        return event["description"]

    # ==========================================================
    # CRÉATION
    # ==========================================================

    @classmethod
    def create_notification_for_event(
        cls,
        user,
        event,
    ):
        """
        Crée une notification pour un événement donné.

        Retourne :
            Notification
            ou None si elle existe déjà.
        """

        event_date = datetime.fromisoformat(
            event["date"]
        ).date()

        scheduled_for = cls.build_scheduled_datetime(
            event_date
        )

        # ------------------------------------------------------
        # Éviter les doublons
        # ------------------------------------------------------

        existing = Notification.objects.filter(
            user=user,
            event_source=event["event_type"],
            scheduled_for=scheduled_for,
            title=cls.build_title(event),
        ).first()

        if existing:
            return None

        # ------------------------------------------------------
        # Création
        # ------------------------------------------------------

        notification = Notification.objects.create(
            user=user,

            title=cls.build_title(
                event
            ),

            message=cls.build_message(
                event
            ),

            event_source=event["event_type"],

            # Les événements bahá'ís ne sont pas des objets
            # Django possédant un ID.
            event_id=None,

            scheduled_for=scheduled_for,

            status=Notification.Status.PENDING,
        )

        return notification

    # ==========================================================
    # GÉNÉRATION
    # ==========================================================

    @classmethod
    def generate_upcoming_notifications(cls):
        """
        Génère les notifications des événements bahá'ís
        à venir pour tous les utilisateurs concernés.

        La fenêtre couvre :
            aujourd'hui → + DAYS_AHEAD jours.
        """

        today = timezone.localdate()

        end_date = today + timedelta(
            days=cls.DAYS_AHEAD
        )

        events = []

        for year in range(
            today.year,
            end_date.year + 1,
        ):
            events.extend(
                get_all_events(year)
            )

        # ------------------------------------------------------
        # Filtrage de la période
        # ------------------------------------------------------

        events = [
            event
            for event in events
            if today
            <= datetime.fromisoformat(
                event["date"]
            ).date()
            <= end_date
        ]

        # ------------------------------------------------------
        # Utilisateurs
        # ------------------------------------------------------

        users = cls.get_users()

        created_count = 0

        # ------------------------------------------------------
        # Création
        # ------------------------------------------------------

        for user in users:

            for event in events:

                notification = (
                    cls.create_notification_for_event(
                        user,
                        event,
                    )
                )

                if notification:
                    created_count += 1

        return created_count
    
class NotificationService:
    """
    Service central de gestion des notifications.

    Le service détermine automatiquement le meilleur moment
    pour rappeler l'utilisateur.

    Le frontend n'a pas besoin de fournir :
        - reminder_minutes
        - 5 minutes
        - 10 minutes
        - 30 minutes
        - etc.

    Le backend décide automatiquement.
    """

    # ==========================================================
    # MOTEUR DE RAPPEL INTELLIGENT
    # ==========================================================

    @staticmethod
    def get_smart_reminder_minutes(event_datetime):
        """
        Détermine automatiquement le délai de rappel.

        Le résultat dépend du temps restant avant l'événement.

        Exemples :

            événement dans 3 jours
                → rappel 3 heures avant

            événement dans 8 heures
                → rappel 1 heure avant

            événement dans 3 heures
                → rappel 30 minutes avant

            événement dans 45 minutes
                → rappel 10 minutes avant

            événement dans 20 minutes
                → rappel 5 minutes avant

            événement dans 8 minutes
                → rappel 3 minutes avant

            événement dans 4 minutes
                → rappel 1 minute avant

            événement dans moins de 2 minutes
                → rappel immédiat
        """

        if not event_datetime:
            return None

        now = timezone.now()

        if timezone.is_naive(event_datetime):
            event_datetime = timezone.make_aware(
                event_datetime,
                timezone.get_current_timezone(),
            )

        seconds_until_event = (
            event_datetime - now
        ).total_seconds()

        # ------------------------------------------------------
        # ÉVÉNEMENT DÉJÀ PASSÉ
        # ------------------------------------------------------

        if seconds_until_event <= 0:
            return None

        minutes_until_event = (
            seconds_until_event / 60
        )

        # ------------------------------------------------------
        # PLUS DE 7 JOURS
        # ------------------------------------------------------

        if minutes_until_event > 7 * 24 * 60:
            return 24 * 60

        # ------------------------------------------------------
        # ENTRE 1 ET 7 JOURS
        # ------------------------------------------------------

        if minutes_until_event > 24 * 60:
            return 3 * 60

        # ------------------------------------------------------
        # ENTRE 6H ET 24H
        # ------------------------------------------------------

        if minutes_until_event > 6 * 60:
            return 60

        # ------------------------------------------------------
        # ENTRE 2H ET 6H
        # ------------------------------------------------------

        if minutes_until_event > 2 * 60:
            return 30

        # ------------------------------------------------------
        # ENTRE 30 MIN ET 2H
        # ------------------------------------------------------

        if minutes_until_event > 30:
            return 10

        # ------------------------------------------------------
        # ENTRE 10 ET 30 MIN
        # ------------------------------------------------------

        if minutes_until_event > 10:
            return 5

        # ------------------------------------------------------
        # ENTRE 5 ET 10 MIN
        # ------------------------------------------------------

        if minutes_until_event > 5:
            return 3

        # ------------------------------------------------------
        # ENTRE 2 ET 5 MIN
        # ------------------------------------------------------

        if minutes_until_event > 2:
            return 1

        # ------------------------------------------------------
        # MOINS DE 2 MINUTES
        # ------------------------------------------------------
        #
        # Un rappel classique serait déjà trop tardif.
        #
        # On utilise donc 0 minute :
        # notification immédiate.
        # ------------------------------------------------------

        return 0

    # ==========================================================
    # FORMATAGE DU DÉLAI
    # ==========================================================

    @staticmethod
    def format_reminder_delay(minutes):
        """
        Transforme un nombre de minutes en texte naturel.
        """

        if minutes is None:
            return "bientôt"

        minutes = int(minutes)

        if minutes <= 0:
            return "maintenant"

        if minutes < 60:

            if minutes == 1:
                return "1 minute"

            return f"{minutes} minutes"

        hours = minutes // 60
        remaining_minutes = minutes % 60

        if hours == 1:

            if remaining_minutes:
                return (
                    f"1 heure et "
                    f"{remaining_minutes} minutes"
                )

            return "1 heure"

        if remaining_minutes:

            return (
                f"{hours} heures et "
                f"{remaining_minutes} minutes"
            )

        return f"{hours} heures"

    # ==========================================================
    # PRÉFÉRENCES
    # ==========================================================

    @staticmethod
    def reminders_enabled(user):
        """
        Vérifie si l'utilisateur accepte les rappels
        d'événements.
        """

        if not user:
            return False

        preferences = (
            UserPreferences.objects
            .filter(user=user)
            .first()
        )

        if not preferences:
            return True

        return getattr(
            preferences,
            "event_reminders_enabled",
            True,
        )

    # ==========================================================
    # CRÉATION D'UN RAPPEL D'ÉVÉNEMENT
    # ==========================================================

    @staticmethod
    def create_event_reminder(event):
        """
        Crée un rappel pour un événement normalisé.

        Cette méthode conserve la compatibilité avec
        EventService.

        Si reminder_minutes est fourni explicitement,
        il peut encore être utilisé pour les événements
        génériques.

        Les activités utilisent quant à elles le moteur
        intelligent.
        """

        reminder_enabled = event.get(
            "reminder_enabled",
            True,
        )

        if not reminder_enabled:
            return None

        event_id = event.get("id")
        event_source = event.get("source")
        title = event.get(
            "title",
            "Événement",
        )
        user = event.get("user")

        if not user:
            raise ValueError(
                "Impossible de créer la notification : "
                "aucun utilisateur associé à l'événement."
            )

        if not event_id:
            return None

        if not event_source:
            return None

        if not NotificationService.reminders_enabled(
            user
        ):
            return None

        event_date = event.get("date")

        if not event_date:
            return None

        start_time = event.get("start_time")

        if not start_time:
            start_time = datetime.min.time()

        event_datetime = datetime.combine(
            event_date,
            start_time,
        )

        if timezone.is_naive(event_datetime):
            event_datetime = timezone.make_aware(
                event_datetime,
                timezone.get_current_timezone(),
            )

        # ------------------------------------------------------
        # RAPPEL INTELLIGENT
        # ------------------------------------------------------

        reminder_minutes = (
            NotificationService
            .get_smart_reminder_minutes(
                event_datetime
            )
        )

        if reminder_minutes is None:
            return None

        scheduled_for = (
            event_datetime
            - timedelta(
                minutes=reminder_minutes
            )
        )

        now = timezone.now()

        # ------------------------------------------------------
        # RAPPEL DÉJÀ PASSÉ
        # ------------------------------------------------------

        if scheduled_for < now:
            scheduled_for = now

        # ------------------------------------------------------
        # DOUBLON
        # ------------------------------------------------------

        existing_notification = (
            Notification.objects.filter(
                user=user,
                event_source=event_source,
                event_id=event_id,
                status__in=[
                    Notification.Status.PENDING,
                    Notification.Status.SENT,
                    Notification.Status.READ,
                ],
            )
            .first()
        )

        if existing_notification:

            if (
                existing_notification.status
                == Notification.Status.PENDING
            ):
                existing_notification.title = (
                    f"Rappel : {title}"
                )

                existing_notification.message = (
                    f"L'événement « {title} » "
                    f"commence dans "
                    f"{NotificationService.format_reminder_delay(
                        reminder_minutes
                    )}."
                )

                existing_notification.scheduled_for = (
                    scheduled_for
                )

                existing_notification.save(
                    update_fields=[
                        "title",
                        "message",
                        "scheduled_for",
                    ]
                )

            return existing_notification

        # ------------------------------------------------------
        # CRÉATION
        # ------------------------------------------------------

        return Notification.objects.create(
            user=user,
            title=f"Rappel : {title}",
            message=(
                f"L'événement « {title} » "
                f"commence dans "
                f"{NotificationService.format_reminder_delay(
                    reminder_minutes
                )}."
            ),
            event_source=event_source,
            event_id=event_id,
            scheduled_for=scheduled_for,
            status=Notification.Status.PENDING,
        )

    # ==========================================================
    # SYNCHRONISATION D'UN ÉVÉNEMENT
    # ==========================================================

    @staticmethod
    def sync_event_reminder(event):
        """
        Synchronise le rappel d'un événement.
        """

        event_id = event.get("id")
        event_source = event.get("source")
        user = event.get("user")

        if not event_id or not event_source or not user:
            return None

        reminder_enabled = event.get(
            "reminder_enabled",
            True,
        )

        if not reminder_enabled:

            Notification.objects.filter(
                user=user,
                event_id=event_id,
                event_source=event_source,
                status=Notification.Status.PENDING,
            ).update(
                status=Notification.Status.CANCELLED
            )

            return None

        event_date = event.get("date")

        if not event_date:
            return None

        start_time = event.get("start_time")

        if not start_time:
            start_time = datetime.min.time()

        event_datetime = datetime.combine(
            event_date,
            start_time,
        )

        if timezone.is_naive(event_datetime):
            event_datetime = timezone.make_aware(
                event_datetime,
                timezone.get_current_timezone(),
            )

        reminder_minutes = (
            NotificationService
            .get_smart_reminder_minutes(
                event_datetime
            )
        )

        if reminder_minutes is None:
            return None

        scheduled_for = (
            event_datetime
            - timedelta(
                minutes=reminder_minutes
            )
        )

        now = timezone.now()

        if scheduled_for < now:
            scheduled_for = now

        existing_notifications = (
            Notification.objects.filter(
                user=user,
                event_id=event_id,
                event_source=event_source,
            )
            .exclude(
                status=Notification.Status.CANCELLED
            )
            .order_by("id")
        )

        pending_notification = (
            existing_notifications
            .filter(
                status=Notification.Status.PENDING
            )
            .first()
        )

        if pending_notification:

            pending_notification.title = (
                f"Rappel : "
                f"{event.get('title', 'Événement')}"
            )

            pending_notification.message = (
                f"L'événement « "
                f"{event.get('title', 'Événement')} » "
                f"commence dans "
                f"{NotificationService.format_reminder_delay(
                    reminder_minutes
                )}."
            )

            pending_notification.scheduled_for = (
                scheduled_for
            )

            pending_notification.save(
                update_fields=[
                    "title",
                    "message",
                    "scheduled_for",
                ]
            )

            existing_notifications.filter(
                status=Notification.Status.PENDING
            ).exclude(
                id=pending_notification.id
            ).update(
                status=Notification.Status.CANCELLED
            )

            return pending_notification

        return Notification.objects.create(
            user=user,
            title=(
                f"Rappel : "
                f"{event.get('title', 'Événement')}"
            ),
            message=(
                f"L'événement « "
                f"{event.get('title', 'Événement')} » "
                f"commence dans "
                f"{NotificationService.format_reminder_delay(
                    reminder_minutes
                )}."
            ),
            event_source=event_source,
            event_id=event_id,
            scheduled_for=scheduled_for,
            status=Notification.Status.PENDING,
        )

    # ==========================================================
    # RAPPELS D'ACTIVITÉS
    # ==========================================================

    @staticmethod
    def sync_activity_reminders(activity):
        """
        Synchronise les rappels d'une activité.

        Notifications destinées à :

        - l'organisateur
        - tous les participants ACCEPTED
        """

        if not activity:
            return []

        # ------------------------------------------------------
        # ACTIVITÉ ANNULÉE
        # ------------------------------------------------------

        if activity.status == activity.Status.CANCELLED:

            Notification.objects.filter(
                event_source="ACTIVITY",
                event_id=activity.id,
                status=Notification.Status.PENDING,
            ).update(
                status=Notification.Status.CANCELLED
            )

            return []

        # ------------------------------------------------------
        # ACTIVITÉ PUBLIÉE
        # ------------------------------------------------------

        if activity.status != activity.Status.PUBLISHED:
            return []

        # ------------------------------------------------------
        # DATE
        # ------------------------------------------------------

        if not activity.start_datetime:
            return []

        # ------------------------------------------------------
        # UTILISATEURS
        # ------------------------------------------------------

        users = {}

        # Organisateur
        if activity.organizer_id:
            users[
                activity.organizer_id
            ] = activity.organizer

        # Participants ACCEPTED
        participants = (
            activity.participants
            .filter(
                status=ActivityParticipant.Status.ACCEPTED
            )
            .select_related("user")
        )

        for participant in participants:

            if participant.user_id:
                users[
                    participant.user_id
                ] = participant.user

        # ------------------------------------------------------
        # RAPPELS
        # ------------------------------------------------------

        notifications = []

        for user in users.values():

            notification = (
                NotificationService
                .create_activity_reminder(
                    activity=activity,
                    user=user,
                )
            )

            if notification:
                notifications.append(
                    notification
                )

        return notifications

    # ==========================================================
    # CRÉATION D'UN RAPPEL D'ACTIVITÉ
    # ==========================================================

    @staticmethod
    def create_activity_reminder(
        activity,
        user,
    ):
        """
        Crée automatiquement un rappel intelligent
        pour une activité.

        Aucun reminder_minutes n'est nécessaire.
        """

        if not activity or not user:
            return None

        # ------------------------------------------------------
        # ANNULÉE
        # ------------------------------------------------------

        if activity.status == activity.Status.CANCELLED:
            return None

        # ------------------------------------------------------
        # NON PUBLIÉE
        # ------------------------------------------------------

        if activity.status != activity.Status.PUBLISHED:
            return None

        # ------------------------------------------------------
        # DATE
        # ------------------------------------------------------

        event_datetime = activity.start_datetime

        if not event_datetime:
            return None

        if timezone.is_naive(event_datetime):
            event_datetime = timezone.make_aware(
                event_datetime,
                timezone.get_current_timezone(),
            )

        # ------------------------------------------------------
        # PRÉFÉRENCES
        # ------------------------------------------------------

        if not NotificationService.reminders_enabled(
            user
        ):
            return None

        # ------------------------------------------------------
        # CALCUL INTELLIGENT
        # ------------------------------------------------------

        reminder_minutes = (
            NotificationService
            .get_smart_reminder_minutes(
                event_datetime
            )
        )

        if reminder_minutes is None:
            return None

        scheduled_for = (
            event_datetime
            - timedelta(
                minutes=reminder_minutes
            )
        )

        now = timezone.now()

        # ------------------------------------------------------
        # SI LE RAPPEL EST DÉJÀ PASSÉ
        #
        # On le transforme en rappel immédiat.
        # ------------------------------------------------------

        if scheduled_for < now:
            scheduled_for = now

        # ------------------------------------------------------
        # DOUBLON
        # ------------------------------------------------------

        existing_notification = (
            Notification.objects
            .filter(
                user=user,
                event_source="ACTIVITY",
                event_id=activity.id,
                status__in=[
                    Notification.Status.PENDING,
                    Notification.Status.SENT,
                    Notification.Status.READ,
                ],
            )
            .first()
        )

        if existing_notification:

            # Une notification PENDING peut être recalculée
            if (
                existing_notification.status
                == Notification.Status.PENDING
            ):

                existing_notification.title = (
                    f"Rappel : {activity.title}"
                )

                existing_notification.message = (
                    f"L'activité « "
                    f"{activity.title} » "
                    f"commence dans "
                    f"{NotificationService.format_reminder_delay(
                        reminder_minutes
                    )}."
                )

                existing_notification.scheduled_for = (
                    scheduled_for
                )

                existing_notification.save(
                    update_fields=[
                        "title",
                        "message",
                        "scheduled_for",
                    ]
                )

            return existing_notification

        # ------------------------------------------------------
        # CRÉATION
        # ------------------------------------------------------

        return Notification.objects.create(
            user=user,

            title=f"Rappel : {activity.title}",

            message=(
                f"L'activité « "
                f"{activity.title} » "
                f"commence dans "
                f"{NotificationService.format_reminder_delay(
                    reminder_minutes
                )}."
            ),

            event_source="ACTIVITY",
            event_id=activity.id,

            scheduled_for=scheduled_for,

            status=Notification.Status.PENDING,
        )

    # ==========================================================
    # RAPPEL QUOTIDIEN
    # ==========================================================

    @staticmethod
    def create_daily_reminder(user):
        """
        Crée le rappel quotidien.
        """

        if not user:
            return None

        preferences = (
            UserPreferences.objects
            .filter(user=user)
            .first()
        )

        if (
            preferences
            and not preferences.daily_reminder_enabled
        ):
            return None

        now = timezone.now()

        scheduled_for = now.replace(
            hour=8,
            minute=0,
            second=0,
            microsecond=0,
        )

        if scheduled_for <= now:
            scheduled_for += timedelta(
                days=1
            )

        existing_notification = (
            Notification.objects.filter(
                user=user,
                event_source="DAILY_REMINDER",
                scheduled_for=scheduled_for,
                status__in=[
                    Notification.Status.PENDING,
                    Notification.Status.SENT,
                    Notification.Status.READ,
                ],
            )
            .first()
        )

        if existing_notification:
            return existing_notification

        return Notification.objects.create(
            user=user,
            title="Votre moment spirituel 🌅",
            message=(
                "Prenez un moment pour la prière, "
                "la méditation ou la lecture "
                "des Écrits sacrés."
            ),
            event_source="DAILY_REMINDER",
            event_id=None,
            scheduled_for=scheduled_for,
            status=Notification.Status.PENDING,
        )

    # ==========================================================
    # RAPPELS POUR PLUSIEURS ÉVÉNEMENTS
    # ==========================================================

    @staticmethod
    def create_reminders_for_events(events):
        """
        Crée ou synchronise les rappels de plusieurs événements.
        """

        notifications = []

        for event in events:

            notification = (
                NotificationService
                .create_event_reminder(event)
            )

            if notification:
                notifications.append(
                    notification
                )

        return notifications