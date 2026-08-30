from rest_framework import serializers

from .models import AnalyticsEvent


class AnalyticsEventSerializer(serializers.ModelSerializer):

    class Meta:
        model = AnalyticsEvent

        fields = (
            "id",
            "event_type",
            "path",
            "metadata",
            "session_id",
            "client_id",
            "created_at",
        )

        read_only_fields = (
            "id",
            "created_at",
        )

    def validate_event_type(self, value):
        valid_types = {
            choice[0]
            for choice in AnalyticsEvent.EventType.choices
        }

        if value not in valid_types:
            raise serializers.ValidationError(
                "Type d'événement analytics invalide."
            )

        return value