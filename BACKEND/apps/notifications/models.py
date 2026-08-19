from django.db import models
from django.conf import settings


class Notification(models.Model):
    """
    Notification générée à partir d'un événement.

    Une notification appartient obligatoirement
    à un utilisateur.

    Sources possibles :
    - événement personnel
    - événement extrait d'un document
    - événement du calendrier bahá'í
    - future citation quotidienne
    """

    class Status(models.TextChoices):
        PENDING = "PENDING", "En attente"
        SENT = "SENT", "Envoyée"
        READ = "READ", "Lue"
        CANCELLED = "CANCELLED", "Annulée"

    # ======================================================
    # UTILISATEUR
    # ======================================================

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
    )

    # ======================================================
    # CONTENU
    # ======================================================

    title = models.CharField(
        max_length=255,
    )

    message = models.TextField()

    # ======================================================
    # ÉVÉNEMENT SOURCE
    # ======================================================

    event_source = models.CharField(
        max_length=30,
        blank=True,
        default="",
    )

    event_id = models.PositiveIntegerField(
        null=True,
        blank=True,
    )

    event_code = models.CharField(
        max_length=100,
        blank=True,
        default="",
        db_index=True,
    )

    # ======================================================
    # PLANIFICATION
    # ======================================================

    scheduled_for = models.DateTimeField()

    # ======================================================
    # ÉTAT
    # ======================================================

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )

    # ======================================================
    # DATES
    # ======================================================

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    read_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    class Meta:
        ordering = ["scheduled_for", "id"]

        indexes = [
            models.Index(
                fields=["user", "status"],
            ),
            models.Index(
                fields=["scheduled_for", "status"],
            ),
            models.Index(
                fields=[
                    "user",
                    "event_source",
                    "event_code",
                ],
            ),
        ]

    def __str__(self):
        return self.title


class PushSubscription(models.Model):
    """
    Abonnement Web Push d'un utilisateur.

    Un utilisateur peut avoir plusieurs abonnements :
    - ordinateur
    - téléphone
    - tablette
    - plusieurs navigateurs
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="push_subscriptions",
    )

    endpoint = models.URLField(
        unique=True,
    )

    p256dh = models.TextField()

    auth = models.TextField()

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"PushSubscription - {self.user}"