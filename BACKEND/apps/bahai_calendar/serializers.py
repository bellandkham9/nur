from rest_framework import serializers


# ============================================================
# DATE BAHÁ'ÍE
# ============================================================

class BahaiDateSerializer(serializers.Serializer):

    year = serializers.IntegerField()

    month = serializers.IntegerField()

    day = serializers.IntegerField()

    month_name = serializers.CharField()

    month_meaning = serializers.CharField()


# ============================================================
# JOUR DU CALENDRIER
# ============================================================

class CalendarDaySerializer(serializers.Serializer):

    gregorian_date = serializers.DateField()

    bahai_date = BahaiDateSerializer()

    event = serializers.DictField(
        allow_null=True,
        required=False,
    )


# ============================================================
# ÉVÉNEMENT BAHÁ'Í
# ============================================================

class BahaiEventSerializer(serializers.Serializer):

    code = serializers.CharField()

    name = serializers.CharField()

    date = serializers.DateField()

    event_type = serializers.CharField()

    description = serializers.CharField(
        allow_blank=True,
        required=False,
    )

    icon = serializers.CharField(
        allow_blank=True,
        required=False,
    )

    is_holy_day = serializers.BooleanField()

    work_suspension = serializers.BooleanField()