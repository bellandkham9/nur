from django.db import models

# Create your models here.
from django.contrib.auth.models import User
from django.db import models


class Community(models.Model):

    name = models.CharField(
        max_length=200
    )

    description = models.TextField(
        blank=True
    )

    country = models.CharField(
        max_length=100
    )

    city = models.CharField(
        max_length=100
    )

    address = models.CharField(
        max_length=255,
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

    timezone = models.CharField(
        max_length=50,
        default='Africa/Brazzaville'
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    def __str__(self):
        return self.name

class CommunityMembership(models.Model):

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='community_memberships'
    )

    community = models.ForeignKey(
        Community,
        on_delete=models.CASCADE,
        related_name='memberships'
    )

    role = models.ForeignKey(
        'accounts.Role',
        on_delete=models.PROTECT,
        related_name='community_memberships'
    )

    start_date = models.DateField()

    end_date = models.DateField(
        blank=True,
        null=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return (
            f'{self.user.username} - '
            f'{self.community.name} - '
            f'{self.role.name}'
        )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'community'],
                name='unique_user_community_membership'
            )
        ]