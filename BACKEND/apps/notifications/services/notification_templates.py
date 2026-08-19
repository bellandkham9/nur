from dataclasses import dataclass
from typing import Optional


@dataclass
class NotificationPayload:
    """
    Payload visuel d'une notification.
    """

    title: str
    message: str
    notification_type: str

    icon: str = "/icons/badge.png"
    badge: str = "/icons/badge.png"

    url: str = "/"

    require_interaction: bool = False

    vibrate: Optional[list[int]] = None


class NotificationTemplates:
    """
    Templates visuels des notifications Bahá'í Companion.
    """

    DEFAULT_VIBRATION = [200, 100, 200]

    # ==========================================================
    # FÊTE DE 19 JOURS
    # ==========================================================

    @classmethod
    def feast(
        cls,
        title: str,
        message: str,
        url: str = "/calendar",
    ):
        return NotificationPayload(
            title=f"🌿 {title}",
            message=message,
            notification_type="FEAST",
            icon="/icons/feast.png",
            badge="/icons/badge.png",
            url=url,
            require_interaction=True,
            vibrate=cls.DEFAULT_VIBRATION,
        )

    # ==========================================================
    # JOUR SAINT
    # ==========================================================

    @classmethod
    def holy_day(
        cls,
        title: str,
        message: str,
        url: str = "/calendar",
    ):
        return NotificationPayload(
            title=f"🕊️ {title}",
            message=message,
            notification_type="HOLY_DAY",
            icon="/icons/holy-day.png",
            badge="/icons/badge.png",
            url=url,
            require_interaction=True,
            vibrate=cls.DEFAULT_VIBRATION,
        )

    # ==========================================================
    # RÉUNION
    # ==========================================================


    @staticmethod
    def daily_reminder(title, message):
        return NotificationPayload(
            notification_type="DAILY_REMINDER",
            title=title or "Votre moment spirituel 🌅",
            message=(
                message
                or "Prenez un moment pour la prière, "
                "la méditation ou la lecture des Écrits sacrés."
            ),
            icon="/icons/notification.png",
            badge="/icons/notification.png",
            require_interaction=False,
            vibrate=[200, 100, 200],
        )

    @classmethod
    def meeting(
        cls,
        title: str,
        message: str,
        url: str = "/events",
    ):
        return NotificationPayload(
            title=f"🤝 {title}",
            message=message,
            notification_type="MEETING",
            icon="/icons/meeting.png",
            badge="/icons/badge.png",
            url=url,
            require_interaction=True,
            vibrate=cls.DEFAULT_VIBRATION,
        )

    # ==========================================================
    # ÉTUDE
    # ==========================================================

    @classmethod
    def study(
        cls,
        title: str,
        message: str,
        url: str = "/events",
    ):
        return NotificationPayload(
            title=f"📖 {title}",
            message=message,
            notification_type="STUDY",
            icon="/icons/study.png",
            badge="/icons/badge.png",
            url=url,
            require_interaction=False,
            vibrate=cls.DEFAULT_VIBRATION,
        )

    # ==========================================================
    # ÉVÉNEMENT
    # ==========================================================

    @classmethod
    def event(
        cls,
        title: str,
        message: str,
        url: str = "/events",
    ):
        return NotificationPayload(
            title=f"📅 {title}",
            message=message,
            notification_type="EVENT",
            icon="/icons/event.png",
            badge="/icons/badge.png",
            url=url,
            require_interaction=True,
            vibrate=cls.DEFAULT_VIBRATION,
        )

    # ==========================================================
    # DOCUMENT
    # ==========================================================

    @classmethod
    def document(
        cls,
        title: str,
        message: str,
        url: str = "/documents",
    ):
        return NotificationPayload(
            title=f"📄 {title}",
            message=message,
            notification_type="DOCUMENT",
            icon="/icons/document.png",
            badge="/icons/badge.png",
            url=url,
            require_interaction=False,
            vibrate=cls.DEFAULT_VIBRATION,
        )