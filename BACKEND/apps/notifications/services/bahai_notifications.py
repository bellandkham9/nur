from datetime import date, datetime, time, timedelta

from django.conf import settings
from django.utils import timezone

from apps.bahai_calendar.services.events import (
    FEAST,
    HOLY_DAY,
    get_all_events,
)

from ..models import Notification


# ============================================================
# CONFIGURATION
# ============================================================

EVENT_SOURCE = "bahai_calendar"

DAYS_BEFORE = 1

# Heure à laquelle la notification "demain" sera envoyée.
DEFAULT_NOTIFICATION_TIME = time(8, 0)


# ============================================================
# CODES STABLES
# ============================================================

HOLY_DAY_CODES = {
    "Naw-Rúz": "HOLY_DAY_NAW_RUZ",
    "1er jour de Ridván": "HOLY_DAY_FIRST_RIDVAN",
    "9e jour de Ridván": "HOLY_DAY_NINTH_RIDVAN",
    "12e jour de Ridván": "HOLY_DAY_TWELFTH_RIDVAN",
    "Déclaration du Báb": "HOLY_DAY_DECLARATION_BAB",
    "Ascension de Bahá'u'lláh": "HOLY_DAY_ASCENSION_BAHAULLAH",
    "Martyre du Báb": "HOLY_DAY_MARTYRDOM_BAB",
    "Naissance du Báb": "HOLY_DAY_BIRTH_BAB",
    "Naissance de Bahá'u'lláh": "HOLY_DAY_BIRTH_BAHAULLAH",
    "Jour de l'Alliance": "HOLY_DAY_COVENANT",
    "Ascension de 'Abdu'l-Bahá": "HOLY_DAY_ASCENSION_ABDUL_BAHA",
}


# ============================================================
# OUTILS
# ============================================================

def get_event_code(event: dict) -> str:
    """
    Retourne un identifiant stable pour un événement bahá'í.
    """

    event_type = event.get("event_type")
    name = event.get("name", "")

    if event_type == HOLY_DAY:
        return HOLY_DAY_CODES.get(
            name,
            f"HOLY_DAY_{name.upper().replace(' ', '_')}",
        )

    if event_type == FEAST:
        # Les noms sont par exemple :
        # Fête de Bahá
        # Fête de Jalál
        return f"FEAST_{name.replace('Fête de ', '').upper().replace(' ', '_')}"

    return event.get("code", event_type or "BAHAI_EVENT")


def build_notification_content(
    event: dict,
    notification_date: date,
) -> tuple[str, str]:
    """
    Construit le titre et le message selon
    la proximité de l'événement.
    """

    event_name = event["name"]
    event_type = event["event_type"]
    description = event.get("description", "")
    icon = event.get("icon", "📅")

    today = date.today()

    if notification_date == today:
        prefix = "Aujourd'hui"

    elif notification_date == today + timedelta(days=1):
        prefix = "Demain"

    else:
        days = (notification_date - today).days

        if days > 1:
            prefix = f"Dans {days} jours"
        else:
            prefix = "À venir"

    if event_type == HOLY_DAY:

        title = f"{icon} {prefix} : {event_name}"

        message = description

        if event.get("work_suspension"):
            message += (
                " Jour de suspension du travail."
            )

    else:

        title = f"{icon} {prefix} : {event_name}"

        message = description

    return title, message


def make_scheduled_datetime(
    target_date: date,
) -> datetime:
    """
    Crée une date/heure timezone-aware.
    """

    naive_datetime = datetime.combine(
        target_date,
        DEFAULT_NOTIFICATION_TIME,
    )

    return timezone.make_aware(
        naive_datetime,
        timezone.get_current_timezone(),
    )


# ============================================================
# CRÉATION D'UNE NOTIFICATION
# ============================================================

def create_bahai_notification(
    user,
    event: dict,
    scheduled_for: datetime,
    notification_date: date,
) -> Notification:
    """
    Crée une notification bahá'íe si elle n'existe pas déjà.
    """

    event_code = get_event_code(event)

    title, message = build_notification_content(
        event,
        notification_date,
    )

    notification, created = Notification.objects.get_or_create(
        user=user,
        event_source=EVENT_SOURCE,
        event_code=event_code,
        scheduled_for=scheduled_for,
        defaults={
            "title": title,
            "message": message,
            "event_id": None,
            "status": Notification.Status.PENDING,
        },
    )

    return notification


# ============================================================
# PLANIFICATION POUR UN UTILISATEUR
# ============================================================

def schedule_bahai_notifications_for_user(
    user,
    year: int | None = None,
) -> list[Notification]:
    """
    Programme les notifications des événements bahá'ís
    pour un utilisateur.

    Pour chaque événement :
        - notification 1 jour avant
        - notification le jour même
    """

    if year is None:
        year = date.today().year

    events = get_all_events(year)

    notifications: list[Notification] = []

    for event in events:

        event_date = date.fromisoformat(
            event["date"]
        )

        # ----------------------------------------------------
        # Notification J-1
        # ----------------------------------------------------

        day_before = event_date - timedelta(
            days=DAYS_BEFORE
        )

        scheduled_for = make_scheduled_datetime(
            day_before
        )

        # On ne programme pas les notifications
        # déjà passées.
        if scheduled_for >= timezone.now():

            notification = create_bahai_notification(
                user=user,
                event=event,
                scheduled_for=scheduled_for,
                notification_date=event_date,
            )

            notifications.append(notification)

        # ----------------------------------------------------
        # Notification Jour J
        # ----------------------------------------------------

        scheduled_for = make_scheduled_datetime(
            event_date
        )

        if scheduled_for >= timezone.now():

            notification = create_bahai_notification(
                user=user,
                event=event,
                scheduled_for=scheduled_for,
                notification_date=event_date,
            )

            notifications.append(notification)

    return notifications


# ============================================================
# TOUS LES UTILISATEURS
# ============================================================

def schedule_bahai_notifications_for_all_users(
    year: int | None = None,
) -> int:
    """
    Programme les notifications bahá'íes
    pour tous les utilisateurs actifs.
    """

    User = settings.AUTH_USER_MODEL

    from django.contrib.auth import get_user_model

    UserModel = get_user_model()

    users = UserModel.objects.filter(
        is_active=True,
    )

    count = 0

    for user in users:

        notifications = schedule_bahai_notifications_for_user(
            user=user,
            year=year,
        )

        count += len(notifications)

    return count