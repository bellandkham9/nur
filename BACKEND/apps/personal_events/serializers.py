from rest_framework import serializers

from .models import PersonalEvent


class PersonalEventSerializer(serializers.ModelSerializer):
    """
    Sérialiseur des événements personnels.
    """

    event_type_display = serializers.CharField(
        source="get_event_type_display",
        read_only=True,
    )

    class Meta:
        model = PersonalEvent

        fields = [
            "id",
            "title",
            "description",
            "event_type",
            "event_type_display",
            "date",
            "start_time",
            "end_time",
            "location",
            "responsible",
            "reminder_enabled",
            "reminder_minutes",
            "source_detected_event",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "user",
            "event_type_display",
            "created_at",
            "updated_at",
        ]