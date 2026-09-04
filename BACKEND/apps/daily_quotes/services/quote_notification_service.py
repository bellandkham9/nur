from datetime import datetime, time

from django.contrib.auth.models import User
from django.utils import timezone

from apps.daily_quotes.models import DailyQuote
from apps.notifications.services.notification_engine import NotificationEngine


class QuoteNotificationService:
    """
    Service métier responsable de la planification des Paroles du jour.

    Architecture :

        Cron Job.org
              ↓
        /api/notifications/process/
              ↓
        generate_due_quotes()
              ↓
        NotificationEngine.schedule()
              ↓
        NotificationProcessor
              ↓
        WebPushService

    Ce service NE fait pas directement l'envoi Web Push.
    Il crée uniquement les notifications PENDING à travers
    NotificationEngine.
    """

    # =========================================================
    # CONFIGURATION
    # =========================================================

    MORNING_HOUR = 8
    MORNING_MINUTE = 0

    EVENING_HOUR = 20
    EVENING_MINUTE = 0

    EVENT_SOURCE = NotificationEngine.SOURCE_DAILY_QUOTE

    # =========================================================
    # GÉNÉRATION DEPUIS CRON
    # =========================================================

    @classmethod
    def generate_due_quotes(cls, now=None):
        """
        Génère les notifications Daily Quote qui doivent exister
        pour la journée courante.

        Cette méthode est appelée par le endpoint Cron :

            POST /api/notifications/process/

        Elle peut donc être exécutée toutes les minutes sans créer
        de doublons grâce à event_code.
        """

        if now is None:
            now = timezone.localtime()

        else:
            if timezone.is_naive(now):
                now = timezone.make_aware(
                    now,
                    timezone.get_current_timezone(),
                )

            now = timezone.localtime(now)

        current_date = now.date()

        generated = {
            "morning": 0,
            "evening": 0,
        }

        # -----------------------------------------------------
        # PAROLE DU MATIN
        # -----------------------------------------------------

        morning_time = time(
            cls.MORNING_HOUR,
            cls.MORNING_MINUTE,
        )

        if now.time() >= morning_time:

            quote = cls.get_quote(
                target_date=current_date,
                moment=DailyQuote.Moment.MORNING,
            )

            if quote:
                scheduled_for = cls._build_scheduled_datetime(
                    current_date,
                    cls.MORNING_HOUR,
                    cls.MORNING_MINUTE,
                )

                generated["morning"] = cls._schedule_quote(
                    quote=quote,
                    scheduled_for=scheduled_for,
                )

        # -----------------------------------------------------
        # PAROLE DU SOIR
        # -----------------------------------------------------

        evening_time = time(
            cls.EVENING_HOUR,
            cls.EVENING_MINUTE,
        )

        if now.time() >= evening_time:

            quote = cls.get_quote(
                target_date=current_date,
                moment=DailyQuote.Moment.EVENING,
            )

            if quote:
                scheduled_for = cls._build_scheduled_datetime(
                    current_date,
                    cls.EVENING_HOUR,
                    cls.EVENING_MINUTE,
                )

                generated["evening"] = cls._schedule_quote(
                    quote=quote,
                    scheduled_for=scheduled_for,
                )

        return generated

    # =========================================================
    # COMPATIBILITÉ ANCIENNES TÂCHES
    # =========================================================

    @classmethod
    def send_morning_quote(cls, target_date=None):
        """
        Compatibilité temporaire avec l'ancien système Celery.

        Cette méthode ne fait pas d'envoi direct.
        Elle planifie simplement la Parole du matin.
        """

        if target_date is None:
            target_date = timezone.localdate()

        quote = cls.get_quote(
            target_date=target_date,
            moment=DailyQuote.Moment.MORNING,
        )

        if not quote:
            return 0

        scheduled_for = cls._build_scheduled_datetime(
            target_date,
            cls.MORNING_HOUR,
            cls.MORNING_MINUTE,
        )

        return cls._schedule_quote(
            quote=quote,
            scheduled_for=scheduled_for,
        )

    @classmethod
    def send_evening_quote(cls, target_date=None):
        """
        Compatibilité temporaire avec l'ancien système Celery.

        Cette méthode ne fait pas d'envoi direct.
        Elle planifie simplement la Parole du soir.
        """

        if target_date is None:
            target_date = timezone.localdate()

        quote = cls.get_quote(
            target_date=target_date,
            moment=DailyQuote.Moment.EVENING,
        )

        if not quote:
            return 0

        scheduled_for = cls._build_scheduled_datetime(
            target_date,
            cls.EVENING_HOUR,
            cls.EVENING_MINUTE,
        )

        return cls._schedule_quote(
            quote=quote,
            scheduled_for=scheduled_for,
        )

    # =========================================================
    # RECHERCHE DU QUOTE
    # =========================================================

    @classmethod
    def get_quote(cls, target_date, moment):
        """
        Retourne la citation active correspondant à la date
        et au moment demandé.
        """

        return (
            DailyQuote.objects
            .filter(
                date=target_date,
                moment=moment,
                is_active=True,
                notification_enabled=True,
            )
            .order_by("id")
            .first()
        )

    # =========================================================
    # PLANIFICATION
    # =========================================================

    @classmethod
    def _schedule_quote(cls, quote, scheduled_for):
        """
        Crée ou met à jour les notifications pour tous les
        utilisateurs actifs concernés.

        IMPORTANT :
            NotificationEngine.schedule() utilise le paramètre
            `source`, et non `event_source`.
        """

        users = (
            User.objects
            .filter(is_active=True)
            .select_related("preferences")
        )

        event_code = cls._build_event_code(quote)

        title = cls._build_title(quote)
        message = quote.text

        scheduled_count = 0

        for user in users:

            try:
                preferences = user.preferences
            except Exception:
                preferences = None

            # Les notifications quotidiennes nécessitent
            # explicitement les préférences utilisateur.
            if preferences is None:
                continue

            # Interrupteur global
            if not preferences.push_notifications_enabled:
                continue

            # Préférence spécifique aux rappels quotidiens
            if not preferences.daily_reminder_enabled:
                continue

            notification = NotificationEngine.schedule(
                user=user,
                source=cls.EVENT_SOURCE,
                title=title,
                message=message,
                scheduled_for=scheduled_for,
                event_id=quote.id,
                event_code=event_code,
                update_pending=True,
            )

            if notification:
                scheduled_count += 1

        return scheduled_count

    # =========================================================
    # EVENT CODE
    # =========================================================

    @classmethod
    def _build_event_code(cls, quote):
        """
        Génère un identifiant stable et unique pour une citation.

        Exemple :

            DAILY_QUOTE_335_2026-09-04_MORNING
        """

        return (
            f"DAILY_QUOTE_"
            f"{quote.id}_"
            f"{quote.date.isoformat()}_"
            f"{quote.moment}"
        )

    # =========================================================
    # DATE / HEURE
    # =========================================================

    @classmethod
    def _build_scheduled_datetime(
        cls,
        target_date,
        hour,
        minute,
    ):
        """
        Construit un datetime timezone-aware dans le fuseau
        horaire Django configuré.

        Exemple :

            04/09/2026 08:00
        """

        naive_datetime = datetime.combine(
            target_date,
            time(hour, minute),
        )

        return timezone.make_aware(
            naive_datetime,
            timezone.get_current_timezone(),
        )

    # =========================================================
    # TITRE
    # =========================================================

    @staticmethod
    def _build_title(quote):
        """
        Construit le titre de la notification.
        """

        if quote.moment == DailyQuote.Moment.MORNING:
            return "🌅 Parole du matin"

        return "🌙 Parole du soir"

    # =========================================================
    # PAYLOAD
    # =========================================================

    @classmethod
    def build_payload(cls, quote):
        """
        Construit le payload utilisé si nécessaire par
        le système de notification.
        """

        return {
            "type": "DAILY_QUOTE",
            "title": cls._build_title(quote),
            "body": quote.text,
            "data": {
                "url": "/daily-quotes",
                "quote_id": quote.id,
                "date": quote.date.isoformat(),
                "moment": quote.moment,
            },
        }
