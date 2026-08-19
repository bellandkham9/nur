from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from apps.notifications.models import Notification
from apps.notifications.services.web_push_service import WebPushService


class Command(BaseCommand):

    help = (
        "Traite les notifications dont la date "
        "de programmation est arrivée."
    )

    def handle(self, *args, **options):

        now = timezone.now()

        self.stdout.write(
            self.style.NOTICE(
                f"🔎 Recherche des notifications "
                f"à traiter à {now}"
            )
        )

        notifications = (
            Notification.objects
            .filter(
                status=Notification.Status.PENDING,
                scheduled_for__lte=now,
            )
            .select_related("user")
            .order_by("scheduled_for")
        )

        count = notifications.count()

        if count == 0:

            self.stdout.write(
                self.style.SUCCESS(
                    "✅ Aucune notification à traiter."
                )
            )

            return

        self.stdout.write(
            f"📋 {count} notification(s) à traiter."
        )

        processed = 0
        errors = 0

        for notification in notifications:

            try:

                with transaction.atomic():

                    notification.refresh_from_db()

                    if (
                        notification.status
                        != Notification.Status.PENDING
                    ):
                        continue

                    self.stdout.write("")

                    self.stdout.write(
                        f"🔔 Notification #{notification.id}"
                    )

                    self.stdout.write(
                        f"   → {notification.title}"
                    )

                    self.stdout.write(
                        f"   → {notification.message}"
                    )

                    self.stdout.write(
                        f"   → utilisateur : "
                        f"{notification.user_id}"
                    )

                    # ==========================================
                    # ENVOI WEB PUSH
                    # ==========================================

                    sent_count = WebPushService.send(
                        notification
                    )

                    # ==========================================
                    # SUCCÈS
                    # ==========================================

                    if sent_count > 0:

                        notification.status = (
                            Notification.Status.SENT
                        )

                        notification.save(
                            update_fields=["status"]
                        )

                        processed += 1

                        self.stdout.write(
                            self.style.SUCCESS(
                                f"   ✅ Envoyée à "
                                f"{sent_count} appareil(s)."
                            )
                        )

                    else:

                        self.stdout.write(
                            self.style.WARNING(
                                "   ⚠️ Aucun abonnement "
                                "Web Push actif."
                            )
                        )

            except Exception as exc:

                errors += 1

                self.stdout.write(
                    self.style.ERROR(
                        f"❌ Erreur notification "
                        f"#{notification.id} : {exc}"
                    )
                )

        # ==============================================
        # RÉSUMÉ
        # ==============================================

        self.stdout.write("")

        self.stdout.write(
            self.style.SUCCESS(
                f"✅ {processed} notification(s) "
                f"envoyée(s)."
            )
        )

        if errors:

            self.stdout.write(
                self.style.ERROR(
                    f"❌ {errors} erreur(s)."
                )
            )