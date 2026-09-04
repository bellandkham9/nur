from django.core.management.base import BaseCommand

from apps.notifications.services.notification_processor import (
    NotificationProcessor,
)


class Command(BaseCommand):
    help = (
        "Traite les notifications PENDING dont "
        "scheduled_for est arrivé."
    )

    def handle(self, *args, **options):
        self.stdout.write(
            self.style.NOTICE(
                "Traitement des notifications..."
            )
        )

        result = (
            NotificationProcessor
            .process_due_notifications()
        )

        self.stdout.write(
            self.style.SUCCESS(
                "Traitement terminé."
            )
        )

        self.stdout.write(
            f"Trouvées   : {result['found']}"
        )

        self.stdout.write(
            f"Traitées   : {result['processed']}"
        )

        self.stdout.write(
            f"Envoyées   : {result['sent']}"
        )

        self.stdout.write(
            f"Échecs     : {result['failed']}"
        )