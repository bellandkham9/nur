from django.core.management.base import BaseCommand

from apps.notifications.models import PushSubscription


class Command(BaseCommand):

    help = "Affiche les abonnements Web Push actuellement enregistrés."

    def handle(self, *args, **options):

        subscriptions = PushSubscription.objects.all()

        count = subscriptions.count()

        self.stdout.write(
            f"📋 {count} abonnement(s) Web Push enregistré(s)."
        )

        if count == 0:
            self.stdout.write(
                self.style.SUCCESS(
                    "✅ Aucun abonnement à nettoyer."
                )
            )
            return

        for subscription in subscriptions:

            self.stdout.write(
                f"   #{subscription.id} "
                f"→ utilisateur {subscription.user_id} "
                f"→ {subscription.endpoint[:80]}..."
            )

        self.stdout.write(
            self.style.SUCCESS(
                "✅ Vérification terminée."
            )
        )