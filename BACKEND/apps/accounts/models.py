from django.contrib.auth.models import User
from django.db import models


class Permission(models.Model):

    code = models.CharField(
        max_length=100,
        unique=True
    )

    name = models.CharField(
        max_length=150
    )

    description = models.TextField(
        blank=True
    )

    def __str__(self):
        return self.name


class Role(models.Model):

    code = models.CharField(
        max_length=50,
        unique=True
    )

    name = models.CharField(
        max_length=100
    )

    description = models.TextField(
        blank=True
    )

    permissions = models.ManyToManyField(
        Permission,
        through='RolePermission',
        related_name='roles'
    )

    def __str__(self):
        return self.name


class RolePermission(models.Model):

    role = models.ForeignKey(
        Role,
        on_delete=models.CASCADE,
        related_name='role_permissions'
    )

    permission = models.ForeignKey(
        Permission,
        on_delete=models.CASCADE,
        related_name='role_permissions'
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['role', 'permission'],
                name='unique_role_permission'
            )
        ]

    def __str__(self):
        return f'{self.role.name} → {self.permission.name}'


class Profile(models.Model):

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='profile'
    )

    display_name = models.CharField(
        max_length=150,
        blank=True
    )

    photo = models.ImageField(
        upload_to='profiles/',
        blank=True,
        null=True
    )

    language = models.CharField(
        max_length=10,
        default='fr'
    )

    timezone = models.CharField(
        max_length=50,
        default='Africa/Brazzaville'
    )

    country = models.CharField(
        max_length=100,
        blank=True
    )

    birth_date = models.DateField(
        blank=True,
        null=True
    )

    role = models.ForeignKey(
        Role,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='profiles'
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    def __str__(self):
        return self.display_name or self.user.username

    
class UserPreferences(models.Model):
    """
    Préférences de l'utilisateur connecté.
    """

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="preferences",
    )

    # Notifications Push
    push_notifications_enabled = models.BooleanField(
        default=True,
    )

    # Rappels liés aux événements
    event_reminders_enabled = models.BooleanField(
        default=True,
    )

    # Rappel spirituel quotidien
    daily_reminder_enabled = models.BooleanField(
        default=False,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    def __str__(self):
        return f"Préférences de {self.user.username}"