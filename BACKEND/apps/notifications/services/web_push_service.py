import json
import logging
from apps.accounts.models import UserPreferences
from django.conf import settings
from pywebpush import WebPushException, webpush

from apps.notifications.models import PushSubscription
from apps.notifications.services.notification_templates import (
    NotificationTemplates,
)

logger = logging.getLogger(__name__)


class WebPushService:
    """
    Service responsable de l'envoi des notifications Web Push.

    Flux :

        Django
            ↓
        WebPushService
            ↓
        pywebpush
            ↓
        Push Service du navigateur
            ↓
        Service Worker
            ↓
        Notification navigateur / téléphone
    """

    # ==========================================================
    # CONSTRUCTION DU PAYLOAD
    # ==========================================================

    @staticmethod
    def _build_payload(notification):
        """
        Construit le payload envoyé au Service Worker.

        Le type de notification détermine :
        - le template
        - l'icône
        - le badge
        - l'URL ouverte lors du clic
        """

        event_source = (
            notification.event_source or ""
        ).upper()

        # ======================================================
        # TEMPLATE
        # ======================================================

        if event_source == "FEAST":

            payload = NotificationTemplates.feast(
                notification.title,
                notification.message,
            )

        elif event_source == "HOLY_DAY":

            payload = NotificationTemplates.holy_day(
                notification.title,
                notification.message,
            )

        elif event_source == "MEETING":

            payload = NotificationTemplates.meeting(
                notification.title,
                notification.message,
            )

        elif event_source == "STUDY":

            payload = NotificationTemplates.study(
                notification.title,
                notification.message,
            )

        elif event_source == "DOCUMENT":

            payload = NotificationTemplates.document(
                notification.title,
                notification.message,
            )

        else:

            payload = NotificationTemplates.event(
                notification.title,
                notification.message,
            )

        # ======================================================
        # ROUTAGE
        # ======================================================

        if event_source in (
            "FEAST",
            "HOLY_DAY",
        ):
            url = "/calendar"

        elif event_source == "DAILY_REMINDER":
            payload = NotificationTemplates.daily_reminder(
                notification.title,
                notification.message,
            )
            url = "/daily-quotes"

        elif event_source == "MEETING":
            url = "/events"

        elif event_source == "DOCUMENT":
            url = "/documents"

        elif event_source in (
            "EVENT",
            "PERSONAL",
            "TEST",
        ):
            if notification.event_id:
                url = f"/events/{notification.event_id}"
            else:
                url = "/events"

        else:
            url = "/notifications"

        # ======================================================
        # PAYLOAD FINAL
        # ======================================================

        return {
            "type": payload.notification_type,

            "notification_id": notification.id,

            "event_id": notification.event_id,

            "event_source": notification.event_source,

            "title": payload.title,

            "message": payload.message,

            "body": payload.message,

            "icon": payload.icon,

            "badge": payload.badge,

            "url": url,

            "requireInteraction": (
                payload.require_interaction
            ),

            "vibrate": (
                payload.vibrate
                or [200, 100, 200]
            ),

            "scheduled_for": (
                notification
                .scheduled_for
                .isoformat()
            ),

            # Action affichée par les navigateurs
            # qui prennent en charge les actions
            # de notifications.
            "actions": [
                {
                    "action": "open",
                    "title": "Ouvrir",
                },
            ],
        }

    # ==========================================================
    # ENVOI WEB PUSH
    # ==========================================================

    @staticmethod
    def send(notification):
        """
        Envoie une notification à tous les navigateurs
        abonnés de l'utilisateur.

        Retourne le nombre d'envois réussis.
        """

         # ======================================================
        # PRÉFÉRENCES UTILISATEUR
        # ======================================================

        preferences = UserPreferences.objects.filter(
            user=notification.user
        ).first()

        if preferences and not preferences.push_notifications_enabled:

            logger.info(
                "🔕 Notifications Push désactivées "
                "pour l'utilisateur %s",
                notification.user_id,
            )

            return 0
        
        # ======================================================
        # VAPID
        # ======================================================

        if not settings.VAPID_PRIVATE_KEY:
            raise RuntimeError(
                "VAPID_PRIVATE_KEY n'est pas configurée."
            )

        if not settings.VAPID_EMAIL:
            raise RuntimeError(
                "VAPID_EMAIL n'est pas configurée."
            )

        # ======================================================
        # ABONNEMENTS
        # ======================================================

        subscriptions = (
            PushSubscription.objects
            .filter(user=notification.user)
        )

        if not subscriptions.exists():

            logger.warning(
                "⚠️ Aucun abonnement Web Push "
                "pour l'utilisateur %s",
                notification.user_id,
            )

            return 0

        # ======================================================
        # PAYLOAD
        # ======================================================

        # IMPORTANT :
        #
        # On utilise UNE SEULE méthode pour construire
        # le payload.
        #
        # C'est ici que sont déterminés :
        #
        # FEAST     → /calendar
        # HOLY_DAY  → /calendar
        # MEETING   → /events
        # DOCUMENT  → /documents
        # EVENT     → /events/<id>
        #
        payload = WebPushService._build_payload(
            notification
        )

        payload_json = json.dumps(
            payload,
            ensure_ascii=False,
        )

        logger.info(
            "📦 Payload notification #%s : %s",
            notification.id,
            payload,
        )

        # ======================================================
        # COMPTEUR
        # ======================================================

        success_count = 0

        # ======================================================
        # ENVOI À TOUS LES APPAREILS
        # ======================================================

        for subscription in subscriptions:

            subscription_info = {
                "endpoint": subscription.endpoint,
                "keys": {
                    "p256dh": subscription.p256dh,
                    "auth": subscription.auth,
                },
            }

            try:

                logger.info(
                    "📤 Envoi Web Push "
                    "notification #%s "
                    "→ subscription #%s",
                    notification.id,
                    subscription.id,
                )

                webpush(
                    subscription_info=subscription_info,
                    data=payload_json,
                    vapid_private_key=(
                        settings.VAPID_PRIVATE_KEY
                    ),
                    vapid_claims={
                        "sub": settings.VAPID_EMAIL,
                    },
                    ttl=60 * 60,
                )

                success_count += 1

                logger.info(
                    "✅ Web Push envoyé "
                    "notification #%s "
                    "→ subscription #%s",
                    notification.id,
                    subscription.id,
                )

            # ==================================================
            # ERREUR WEB PUSH
            # ==================================================

            except WebPushException as exc:

                logger.error(
                    "❌ Web Push échoué "
                    "subscription #%s : %s",
                    subscription.id,
                    exc,
                )

                # ----------------------------------------------
                # ABONNEMENT EXPIRÉ / INVALIDE
                # ----------------------------------------------

                if exc.response is not None:

                    status_code = (
                        exc.response.status_code
                    )

                    if status_code in (
                        404,
                        410,
                    ):

                        logger.warning(
                            "🗑️ Suppression abonnement "
                            "expiré #%s",
                            subscription.id,
                        )

                        subscription.delete()

            # ==================================================
            # ERREUR INATTENDUE
            # ==================================================

            except Exception as exc:

                logger.exception(
                    "❌ Erreur inattendue Web Push "
                    "subscription #%s : %s",
                    subscription.id,
                    exc,
                )

        return success_count