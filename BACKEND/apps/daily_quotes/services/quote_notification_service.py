from datetime import date

from django.contrib.auth import get_user_model
from django.db import IntegrityError
from django.utils import timezone

from apps.accounts.models import UserPreferences
from apps.daily_quotes.models import DailyQuote
from apps.notifications.models import Notification
from apps.notifications.services.web_push_service import WebPushService


User = get_user_model()


class QuoteNotificationService:
    """
    Service de gestion des notifications des Paroles du jour.

    Une DailyQuote est globale.

    Le service :

        1. récupère la citation du jour ;
        2. récupère les utilisateurs concernés ;
        3. crée une Notification pour chaque utilisateur ;
        4. transmet la notification au WebPushService.

    Flux :

        DailyQuote
             ↓
        Utilisateurs
             ↓
        Notification
             ↓
        WebPushService
             ↓
        Web Push
             ↓
        Service Worker
             ↓
        📱 Notification PWA
    """

    EVENT_SOURCE = "DAILY_REMINDER"

    # ==========================================================
    # PAROLE DU MATIN
    # ==========================================================

    @classmethod
    def send_morning_quote(
        cls,
        target_date: date | None = None,
    ) -> int:
        """
        Envoie la Parole du matin.

        Si target_date n'est pas fourni, la date locale
        actuelle est utilisée.

        Retourne le nombre total de Push effectivement envoyés.
        """

        if target_date is None:
            target_date = timezone.localdate()

        quote = cls.get_quote(
            moment=DailyQuote.Moment.MORNING,
            target_date=target_date,
        )

        if quote is None:
            return 0

        return cls._send_quote(quote)

    # ==========================================================
    # PAROLE DU SOIR
    # ==========================================================

    @classmethod
    def send_evening_quote(
        cls,
        target_date: date | None = None,
    ) -> int:
        """
        Envoie la Parole du soir.

        Si target_date n'est pas fourni, la date locale
        actuelle est utilisée.

        Retourne le nombre total de Push effectivement envoyés.
        """

        if target_date is None:
            target_date = timezone.localdate()

        quote = cls.get_quote(
            moment=DailyQuote.Moment.EVENING,
            target_date=target_date,
        )

        if quote is None:
            return 0

        return cls._send_quote(quote)

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

        Exemple :

            get_quote(MORNING)
            get_quote(EVENING)
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
    # ENVOI D'UNE CITATION
    # ==========================================================

    @classmethod
    def _send_quote(
        cls,
        quote: DailyQuote,
    ) -> int:
        """
        Crée une Notification pour chaque utilisateur disposant
        des notifications Push activées et d'au moins un
        abonnement Web Push.

        Puis transmet chaque Notification au WebPushService.

        Retourne le nombre total de Push réussis.
        """

        # ------------------------------------------------------
        # UTILISATEURS ACTIFS AVEC UN ABONNEMENT PUSH
        # ------------------------------------------------------

        users = (
            User.objects
            .filter(
                is_active=True,
                push_subscriptions__isnull=False,
            )
            .distinct()
        )

        # ------------------------------------------------------
        # UTILISATEURS AYANT ACTIVÉ LES NOTIFICATIONS
        # ------------------------------------------------------

        preferences = UserPreferences.objects.filter(
            user__in=users,
            push_notifications_enabled=True,
        )

        user_ids = preferences.values_list(
            "user_id",
            flat=True,
        )

        users = users.filter(
            id__in=user_ids,
        )

        # ------------------------------------------------------
        # COMPTEUR
        # ------------------------------------------------------

        total_sent = 0

        # ------------------------------------------------------
        # ENVOI À CHAQUE UTILISATEUR
        # ------------------------------------------------------

        for user in users:

            # --------------------------------------------------
            # ÉVITER LES DOUBLONS
            # --------------------------------------------------

            already_exists = Notification.objects.filter(
                user=user,
                event_source=cls.EVENT_SOURCE,
                title=cls._build_title(quote.moment),
                message=quote.text.strip(),
                scheduled_for__date=quote.date,
            ).exists()

            if already_exists:
                continue

            # --------------------------------------------------
            # CRÉATION DE LA NOTIFICATION
            # --------------------------------------------------

            notification = Notification.objects.create(
                user=user,
                title=cls._build_title(
                    quote.moment
                ),
                message=quote.text.strip(),
                event_source=cls.EVENT_SOURCE,
                event_id=None,
                scheduled_for=timezone.now(),
                status=Notification.Status.PENDING,
            )

            # --------------------------------------------------
            # WEB PUSH
            # --------------------------------------------------

            try:
                sent = WebPushService.send(
                    notification
                )

            except Exception:
                # La notification reste PENDING si l'envoi
                # rencontre une erreur inattendue.
                raise

            # --------------------------------------------------
            # MISE À JOUR DU STATUT
            # --------------------------------------------------

            if sent > 0:

                notification.status = (
                    Notification.Status.SENT
                )

                notification.save(
                    update_fields=["status"]
                )

                total_sent += sent

        return total_sent

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
    # CONSTRUCTION DU PAYLOAD DAILY QUOTE
    # ==========================================================

    @staticmethod
    def build_payload(
        quote: DailyQuote,
    ) -> dict:
        """
        Construit un payload spécifique à une DailyQuote.

        Cette méthode est utile pour les tests/API.

        L'envoi Web Push réel passe cependant par
        WebPushService._build_payload(), afin de conserver
        un seul point de construction du payload Push.
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