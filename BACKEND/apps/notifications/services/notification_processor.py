import logging

from django.db import transaction
from django.utils import timezone

from apps.notifications.models import Notification
from apps.notifications.services.web_push_service import (
    WebPushService,
)

logger = logging.getLogger(__name__)


class NotificationProcessor:
    """
    Processeur unique des notifications PENDING.

    Responsabilité :
        PENDING + scheduled_for <= maintenant
                    ↓
              WebPushService
                    ↓
               SENT / PENDING
    """

    @classmethod
    def process_due_notifications(cls):
        now = timezone.now()

        notifications = (
            Notification.objects
            .filter(
                status=Notification.Status.PENDING,
                scheduled_for__lte=now,
            )
            .select_related("user")
            .order_by("scheduled_for", "id")
        )

        found = notifications.count()
        processed = 0
        sent = 0
        failed = 0

        logger.info(
            "[NotificationProcessor] %s notification(s) à traiter.",
            found,
        )

        for notification in notifications.iterator():
            processed += 1

            try:
                with transaction.atomic():
                    current = (
                        Notification.objects
                        .select_for_update()
                        .get(
                            pk=notification.pk,
                        )
                    )

                    if current.status != Notification.Status.PENDING:
                        continue

                    if current.scheduled_for > timezone.now():
                        continue

                    success_count = WebPushService.send(
                        current
                    )

                    if success_count > 0:
                        current.status = (
                            Notification.Status.SENT
                        )
                        current.save(
                            update_fields=["status"]
                        )
                        sent += 1

                        logger.info(
                            "[NotificationProcessor] "
                            "Notification %s envoyée (%s abonnement(s)).",
                            current.id,
                            success_count,
                        )
                    else:
                        failed += 1

                        logger.warning(
                            "[NotificationProcessor] "
                            "Notification %s non envoyée.",
                            current.id,
                        )

            except Notification.DoesNotExist:
                continue

            except Exception:
                failed += 1

                logger.exception(
                    "[NotificationProcessor] "
                    "Erreur notification %s.",
                    notification.id,
                )

        return {
            "found": found,
            "processed": processed,
            "sent": sent,
            "failed": failed,
            "executed_at": timezone.now(),
        }