from celery import shared_task
from django.utils import timezone

from apps.notifications.models import Notification
from apps.notifications.services.notification_service import (
    BahaiNotificationService,
)
from apps.notifications.services.web_push_service import (
    WebPushService,
)


# ============================================================
# GÉNÉRATION DES NOTIFICATIONS BAHÁ'ÍES
# ============================================================

@shared_task
def generate_bahai_notifications_task():
    """
    Génère les notifications à venir pour les événements
    du calendrier bahá'í.

    Cette tâche ne fait PAS l'envoi Push.

    Elle crée simplement les objets Notification
    avec le statut PENDING.
    """

    try:

        created = (
            BahaiNotificationService
            .generate_upcoming_notifications()
        )

        return {
            "created": created,
            "executed_at": timezone.now().isoformat(),
        }

    except Exception as exc:

        print(
            "❌ Erreur génération notifications "
            f"bahá'íes : {exc}"
        )

        raise


# ============================================================
# ENVOI DES NOTIFICATIONS
# ============================================================

@shared_task
def process_notifications_task():
    """
    Recherche les notifications PENDING dont la date
    d'envoi est atteinte puis les envoie via Web Push.
    """

    now = timezone.now()

    notifications = (
        Notification.objects
        .filter(
            status=Notification.Status.PENDING,
            scheduled_for__lte=now,
        )
        .select_related("user")
        .order_by("scheduled_for")
    )

    processed = 0

    for notification in notifications:

        try:

            sent_count = WebPushService.send(
                notification
            )

            if sent_count > 0:

                notification.status = (
                    Notification.Status.SENT
                )

                notification.save(
                    update_fields=["status"]
                )

                processed += 1

        except Exception as exc:

            print(
                f"❌ Erreur notification "
                f"{notification.id}: {exc}"
            )

    return {
        "found": notifications.count(),
        "processed": processed,
        "executed_at": now.isoformat(),
    }