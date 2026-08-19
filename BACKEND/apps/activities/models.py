from django.db import models

# Create your models here.
from django.contrib.auth.models import User
from django.db import models

from apps.communities.models import Community


class ActivityType(models.Model):

    name = models.CharField(
        max_length=100,
        unique=True
    )

    code = models.CharField(
        max_length=50,
        unique=True
    )

    description = models.TextField(
        blank=True
    )

    icon = models.CharField(
        max_length=50,
        blank=True
    )

    color = models.CharField(
        max_length=20,
        blank=True
    )

    requires_confirmation = models.BooleanField(
        default=False
    )

    active = models.BooleanField(
        default=True
    )

    def __str__(self):
        return self.name


class Activity(models.Model):

    class Status(models.TextChoices):
        DRAFT = 'DRAFT', 'Brouillon'
        PENDING = 'PENDING', 'En attente'
        PUBLISHED = 'PUBLISHED', 'Publiée'
        CANCELLED = 'CANCELLED', 'Annulée'
        COMPLETED = 'COMPLETED', 'Terminée'

    title = models.CharField(
        max_length=255
    )

    description = models.TextField(
        blank=True
    )

    activity_type = models.ForeignKey(
        ActivityType,
        on_delete=models.PROTECT,
        related_name='activities'
    )

    community = models.ForeignKey(
        Community,
        on_delete=models.CASCADE,
        related_name='activities'
    )

    start_datetime = models.DateTimeField()

    end_datetime = models.DateTimeField(
        blank=True,
        null=True
    )

    location_name = models.CharField(
        max_length=255,
        blank=True
    )

    address = models.CharField(
        max_length=500,
        blank=True
    )

    latitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        blank=True,
        null=True
    )

    longitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        blank=True,
        null=True
    )

    organizer = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name='organized_activities'
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT
    )

    is_online = models.BooleanField(
        default=False
    )

    meeting_url = models.URLField(
        blank=True
    )

    max_participants = models.PositiveIntegerField(
        blank=True,
        null=True
    )

    requires_confirmation = models.BooleanField(
        default=False
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    published_at = models.DateTimeField(
        blank=True,
        null=True
    )

    def __str__(self):
        return self.title

    class Meta:
        ordering = ['start_datetime']

class ActivityParticipant(models.Model):

    class Status(models.TextChoices):
        INVITED = 'INVITED', 'Invité'
        ACCEPTED = 'ACCEPTED', 'Accepté'
        DECLINED = 'DECLINED', 'Refusé'
        ATTENDED = 'ATTENDED', 'Présent'
        ABSENT = 'ABSENT', 'Absent'

    activity = models.ForeignKey(
        Activity,
        on_delete=models.CASCADE,
        related_name='participants'
    )

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='activity_participations'
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.INVITED
    )

    invited_at = models.DateTimeField(
        auto_now_add=True
    )

    responded_at = models.DateTimeField(
        blank=True,
        null=True
    )

    notes = models.TextField(
        blank=True
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['activity', 'user'],
                name='unique_activity_participant'
            )
        ]

    def __str__(self):
        return f'{self.user.username} - {self.activity.title}'