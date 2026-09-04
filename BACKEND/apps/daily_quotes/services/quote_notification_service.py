from datetime import date

from django.contrib.auth import get_user_model
from django.utils import timezone

from apps.daily_quotes.models import DailyQuote
from apps.notifications.models import Notification
from apps.notifications.services.notification_engine import (
    NotificationEngine,
)


User = get_user_model()


class QuoteNotificationService:
    """
    Service métier des notifications des Paroles du jour.

    Responsabilités :

        1. récupérer la citation du jour ;
        2. déterminer les utilisateurs actifs ;
        3. demander au NotificationEngine de programmer
           une notification pour chaque utilisateur.

    IMPORTANT :

        Ce service NE crée plus directement de Notification.

        Ce service NE fait plus d'envoi Web Push.

    Flux :

        DailyQuote
             ↓
        QuoteNotificationService
             ↓
        NotificationEngine
             ↓
        Notification(PENDING)
             ↓
        process_notifications
             ↓
        WebPushService
             ↓
        Web Push
    """

    EVENT_SOURCE = NotificationEngine.SOURCE_DAILY_QUOTE

    # ==========================================================
    # PAROLE DU MATIN
    # ==========================================================

    @classmethod
    def send_morning_quote(
        cls,
        target_date: date | None = None,
    ) -> int:
        """
        Programme la Parole du matin.

        Le nom de cette méthode est conservé pour rester
        compatible avec le scheduler actuel.

        IMPORTANT :
        elle ne fait plus directement de Push.

        Retourne le nombre de notifications programmées.
        """

        if target_date is None:
            target_date = timezone.localdate()

        quote = cls.get_quote(
            moment=DailyQuote.Moment.MORNING,
            target_date=target_date,
        )

        if quote is None:
            return 0

        return cls._schedule_quote(quote)

    # ==========================================================
    # PAROLE DU SOIR
    # ==========================================================

    @classmethod
    def send_evening_quote(
        cls,
        target_date: date | None = None,
    ) -> int:
        """
        Programme la Parole du soir.

        Le nom de cette méthode est conservé pour rester
        compatible avec le scheduler actuel.

        IMPORTANT :
        elle ne fait plus directement de Push.

        Retourne le nombre de notifications programmées.
        """

        if target_date is None:
            target_date = timezone.localdate()

        quote = cls.get_quote(
            moment=DailyQuote.Moment.EVENING,
            target_date=target_date,
        )

        if quote is None:
            return 0

        return cls._schedule_quote(quote)

    # ==========================================================
    # RÉCUPÉRATION DE LA CITATION
    # ==========================================================

    @staticmethod
    def get_quote(
        moment: str,
        target_date: date | None = None,
    ) -> DailyQuote | None:
        """
        Retourne la citation active correspondant à une date
        et à un moment précis.
        """

        if target_date is None:
            target_date = timezone.localdate()

        return (
            DailyQuote.objects
            .filter(
                date=target_date,
                moment=moment,
                is_active=True,
                notification_enabled=True,
            )
            .first()
        )

    # ==========================================================
    # PROGRAMMATION DE LA CITATION
    # ==========================================================

    @classmethod
    def _schedule_quote(
        cls,
        quote: DailyQuote,
    ) -> int:
        """
        Programme une notification DailyQuote pour chaque
        utilisateur actif.

        Cette méthode ne fait aucun Web Push.

        Le NotificationEngine :
            - vérifie les préférences ;
            - gère l'identité ;
            - évite les doublons ;
            - crée/met à jour la Notification ;
            - laisse la notification en PENDING.

        Le nombre retourné correspond au nombre de notifications
        programmées ou déjà existantes et réutilisées.
        """

        users = (
            User.objects
            .filter(is_active=True)
            .distinct()
        )

        # ------------------------------------------------------
        # TITRE / MESSAGE
        # ------------------------------------------------------

        title = cls._build_title(
            quote.moment
        )

        message = quote.text.strip()

        # ------------------------------------------------------
        # IDENTITÉ MÉTIER
        # ------------------------------------------------------

        event_code = cls._build_event_code(
            quote
        )

        # ------------------------------------------------------
        # PROGRAMMATION
        # ------------------------------------------------------

        scheduled_for = timezone.now()

        total_scheduled = 0

        for user in users:

            notification = NotificationEngine.schedule(
                user=user,
                source=cls.EVENT_SOURCE,
                title=title,
                message=message,
                scheduled_for=scheduled_for,
                event_id=quote.id,
                event_code=event_code,
            )

            if notification is not None:
                total_scheduled += 1

        return total_scheduled

    # ==========================================================
    # IDENTITÉ DAILY QUOTE
    # ==========================================================

    @staticmethod
    def _build_event_code(
        quote: DailyQuote,
    ) -> str:
        """
        Construit l'identité métier unique d'une DailyQuote.

        Exemple :

            DAILY_QUOTE_42_2026-09-04_MORNING

        Cela permet de distinguer :
            - une citation ;
            - sa date ;
            - son moment.
        """

        return (
            f"DAILY_QUOTE_"
            f"{quote.id}_"
            f"{quote.date.isoformat()}_"
            f"{quote.moment}"
        )

    # ==========================================================
    # CONSTRUCTION DU TITRE
    # ==========================================================

    @staticmethod
    def _build_title(
        moment: str,
    ) -> str:
        """
        Retourne le titre de la notification.
        """

        if moment == DailyQuote.Moment.MORNING:
            return "🌅 Parole du matin"

        return "🌙 Parole du soir"

    # ==========================================================
    # CONSTRUCTION DU PAYLOAD
    # ==========================================================

    @staticmethod
    def build_payload(
        quote: DailyQuote,
    ) -> dict:
        """
        Construit le payload logique d'une DailyQuote.

        Cette méthode est conservée pour les tests/API.

        Le véritable envoi Web Push reste de la responsabilité
        du WebPushService.
        """

        title = QuoteNotificationService._build_title(
            quote.moment
        )

        return {
            "type": "DAILY_QUOTE",
            "notification_type": "DAILY_QUOTE",
            "title": title,
            "body": quote.text,
            "data": {
                "url": "/daily-quotes",
                "quote_id": quote.id,
                "date": quote.date.isoformat(),
                "moment": quote.moment,
            },
        }