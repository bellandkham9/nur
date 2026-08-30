from django.db import models

# Create your models here.
from django.conf import settings
from django.db import models


class AnalyticsEvent(models.Model):

    class EventType(models.TextChoices):
        PAGE_VIEW = "PAGE_VIEW", "Vue de page"
        APP_OPEN = "APP_OPEN", "Ouverture application"

        QUIZ_START = "QUIZ_START", "Début quiz"
        QUIZ_COMPLETE = "QUIZ_COMPLETE", "Quiz terminé"

        DAILY_QUOTE_VIEW = (
            "DAILY_QUOTE_VIEW",
            "Citation consultée",
        )

        EVENT_VIEW = (
            "EVENT_VIEW",
            "Événement consulté",
        )

        NOTIFICATION_OPEN = (
            "NOTIFICATION_OPEN",
            "Notification ouverte",
        )

        OFFLINE = (
            "OFFLINE",
            "Passage hors ligne",
        )

        ONLINE = (
            "ONLINE",
            "Retour en ligne",
        )

        PWA_INSTALL = (
            "PWA_INSTALL",
            "Installation PWA",
        )

        CUSTOM = (
            "CUSTOM",
            "Événement personnalisé",
        )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="analytics_events",
    )

    event_type = models.CharField(
        max_length=50,
        choices=EventType.choices,
    )

    path = models.CharField(
        max_length=500,
        blank=True,
        default="",
    )

    metadata = models.JSONField(
        default=dict,
        blank=True,
    )

    session_id = models.CharField(
        max_length=100,
        blank=True,
        default="",
        db_index=True,
    )

    client_id = models.CharField(
        max_length=100,
        blank=True,
        default="",
        db_index=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.event_type} #{self.id}"