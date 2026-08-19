from django.db import models

# Create your models here.
from django.db import models


class CalendarEvent(models.Model):

    class EventType(models.TextChoices):
        HOLY_DAY = 'HOLY_DAY', 'Jour saint'
        FEAST = 'FEAST', 'Fête des 19 jours'
        AYYAM_I_HA = 'AYYAM_I_HA', 'Ayyám-i-Há'
        FAST = 'FAST', 'Période du Jeûne'
        NEW_YEAR = 'NEW_YEAR', 'Nouvel An bahá’í'
        OTHER = 'OTHER', 'Autre'

    name = models.CharField(
        max_length=255
    )

    event_type = models.CharField(
        max_length=30,
        choices=EventType.choices
    )

    date = models.DateField()

    end_date = models.DateField(
        blank=True,
        null=True
    )

    description = models.TextField(
        blank=True
    )

    is_holy_day = models.BooleanField(
        default=False
    )

    is_work_suspended = models.BooleanField(
        default=False
    )

    year = models.PositiveIntegerField()

    source = models.CharField(
        max_length=100,
        blank=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    class Meta:
        ordering = ['date']

        constraints = [
            models.UniqueConstraint(
                fields=[
                    'event_type',
                    'date',
                    'year',
                ],
                name='unique_bahai_calendar_event'
            )
        ]

    def __str__(self):
        return f'{self.name} — {self.date}'

