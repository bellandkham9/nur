from celery import shared_task

from apps.daily_quotes.services.quote_notification_service import (
    QuoteNotificationService,
)


# ==========================================================
# PAROLE DU MATIN
# ==========================================================

@shared_task(
    name="daily_quotes.send_morning_quote",
)
def send_morning_quote_task():
    """
    Envoie automatiquement la Parole du matin.

    Cette tâche est appelée par Celery Beat à 08:00.
    """

    sent_count = (
        QuoteNotificationService.send_morning_quote()
    )

    return {
        "moment": "MORNING",
        "sent": sent_count,
    }


# ==========================================================
# PAROLE DU SOIR
# ==========================================================

@shared_task(
    name="daily_quotes.send_evening_quote",
)
def send_evening_quote_task():
    """
    Envoie automatiquement la Parole du soir.

    Cette tâche est appelée par Celery Beat à 20:00.
    """

    sent_count = (
        QuoteNotificationService.send_evening_quote()
    )

    return {
        "moment": "EVENING",
        "sent": sent_count,
    }