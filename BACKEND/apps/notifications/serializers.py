from rest_framework import serializers

from .models import Notification, PushSubscription


# ==========================================================
# NOTIFICATION
# ==========================================================

class NotificationSerializer(
    serializers.ModelSerializer
):
    """
    Sérialiseur des notifications.
    """

    status_display = serializers.CharField(
        source="get_status_display",
        read_only=True,
    )

    class Meta:
        model = Notification

        fields = [
            "id",
            "user",
            "title",
            "message",
            "event_source",
            "event_id",
            "scheduled_for",
            "status",
            "status_display",
            "created_at",
            "read_at",
        ]

        read_only_fields = [
            "id",
            "user",
            "status_display",
            "created_at",
            "read_at",
        ]


# ==========================================================
# PUSH SUBSCRIPTION
# ==========================================================

class PushSubscriptionSerializer(
    serializers.ModelSerializer
):
    """
    Sérialiseur d'un abonnement Web Push.
    """

    class Meta:
        model = PushSubscription

        fields = [
            "id",
            "user",
            "endpoint",
            "p256dh",
            "auth",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "user",
            "created_at",
            "updated_at",
        ]

    def validate_endpoint(self, value):
        """
        Vérifie que l'endpoint Push n'est pas vide.
        """

        if not value or not value.strip():
            raise serializers.ValidationError(
                "L'endpoint Push est obligatoire."
            )

        return value.strip()