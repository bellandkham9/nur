from celery import shared_task

from apps.notifications.services.notification_processor import (
    NotificationProcessor,
)


@shared_task
def generate_bahai_notifications_task():
    """
    Génère les notifications bahá'í à venir.

    Cette tâche crée les Notification PENDING.
    Elle n'envoie aucun push.
    """

    from apps.notifications.services.notification_service import (
        BahaiNotificationService,
    )

    created = (
        BahaiNotificationService
        .generate_upcoming_notifications()
    )

    return {
        "created": created,
    }


@shared_task
def process_notifications_task():
    """
    Tâche Celery officielle de traitement des notifications.
    """

    return (
        NotificationProcessor
        .process_due_notifications()
    )