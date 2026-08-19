from rest_framework import serializers

from .models import DailyQuote


class DailyQuoteSerializer(serializers.ModelSerializer):

    moment_label = serializers.CharField(
        source="get_moment_display",
        read_only=True,
    )

    class Meta:
        model = DailyQuote

        fields = [
            "id",
            "date",
            "moment",
            "moment_label",
            "text",
            "author",
            "source",
            "source_reference",
            "is_active",
            "notification_enabled",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]