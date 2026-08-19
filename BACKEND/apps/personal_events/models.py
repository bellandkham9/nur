from django.db import models
from django.conf import settings

class PersonalEvent(models.Model):
    """
    Événement personnel créé par l'utilisateur.
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="personal_events",
    )
    
    EVENT_TYPES = [
        ("MEETING", "Réunion"),
        ("ACTIVITY", "Activité"),
        ("DEVOTIONAL", "Réunion de prière"),
        ("STUDY", "Cercle d'étude"),
        ("FEAST", "Fête des Dix-Neuf Jours"),
        ("HOLY_DAY", "Jour saint"),
        ("OTHER", "Autre"),
    ]

    title = models.CharField(
        max_length=200
    )

    description = models.TextField(
        blank=True
    )

    event_type = models.CharField(
        max_length=30,
        choices=EVENT_TYPES,
        default="OTHER"
    )
    source_detected_event = models.OneToOneField(
        "document_imports.DetectedEvent",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="personal_event",
    )
    date = models.DateField()

    start_time = models.TimeField(
        null=True,
        blank=True
    )

    end_time = models.TimeField(
        null=True,
        blank=True
    )

    location = models.CharField(
        max_length=255,
        blank=True
    )

    responsible = models.CharField(
        max_length=200,
        blank=True
    )

    reminder_enabled = models.BooleanField(
        default=True
    )

    reminder_minutes = models.PositiveIntegerField(
        default=30
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    class Meta:
        ordering = ["date", "start_time"]

    def __str__(self):
        return self.title