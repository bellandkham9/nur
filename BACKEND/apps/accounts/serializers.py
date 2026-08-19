from rest_framework import serializers

from .models import UserPreferences


class UserPreferencesSerializer(serializers.ModelSerializer):

    class Meta:
        model = UserPreferences
        fields = [
            "push_notifications_enabled",
            "event_reminders_enabled",
            "daily_reminder_enabled",
            "updated_at",
        ]
        read_only_fields = [
            "updated_at",
        ]