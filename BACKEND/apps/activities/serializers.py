from rest_framework import serializers
from django.utils import timezone
from .models import (
    Activity,
    ActivityParticipant,
    ActivityType,
)

from apps.communities.models import (
    Community,
    CommunityMembership,
)


# =========================================================
# TYPE D'ACTIVITÉ
# =========================================================

class ActivityTypeSerializer(serializers.ModelSerializer):

    class Meta:
        model = ActivityType

        fields = [
            "id",
            "name",
            "code",
            "description",
            "icon",
            "color",
            "requires_confirmation",
            "active",
        ]


# =========================================================
# COMMUNAUTÉ
# =========================================================

class ActivityCommunitySerializer(serializers.ModelSerializer):

    class Meta:
        model = Community

        fields = [
            "id",
            "name",
            "description",
            "country",
            "city",
            "address",
        ]


# =========================================================
# PARTICIPANT
# =========================================================

class ActivityParticipantSerializer(serializers.ModelSerializer):

    username = serializers.CharField(
        source="user.username",
        read_only=True,
    )

    user_email = serializers.EmailField(
        source="user.email",
        read_only=True,
    )

    class Meta:
        model = ActivityParticipant

        fields = [
            "id",
            "user",
            "username",
            "user_email",
            "status",
            "invited_at",
            "responded_at",
            "notes",
        ]


# =========================================================
# LISTE / DÉTAIL ACTIVITÉ
# =========================================================

class ActivitySerializer(serializers.ModelSerializer):

    activity_type = ActivityTypeSerializer(read_only=True)

    community = ActivityCommunitySerializer(read_only=True)

    organizer_username = serializers.CharField(
        source="organizer.username",
        read_only=True,
    )

    organizer_email = serializers.EmailField(
        source="organizer.email",
        read_only=True,
    )

    participants_count = serializers.IntegerField(
        source="participants.count",
        read_only=True,
    )

    my_participation_status = serializers.SerializerMethodField()

    is_organizer = serializers.SerializerMethodField()

    class Meta:
        model = Activity

        fields = [
            "id",
            "title",
            "description",

            "activity_type",
            "community",

            "organizer",
            "organizer_username",
            "organizer_email",

            "start_datetime",
            "end_datetime",

            "location_name",
            "address",
            "latitude",
            "longitude",

            "status",

            "is_online",
            "meeting_url",

            "max_participants",
            "requires_confirmation",

            "participants_count",

            "my_participation_status",
            "is_organizer",

            "created_at",
            "updated_at",
            "published_at",
        ]

        read_only_fields = [
            "id",
            "organizer",
            "status",
            "published_at",
            "created_at",
            "updated_at",
            "participants_count",
            "my_participation_status",
            "is_organizer",
        ]

    def get_my_participation_status(self, obj):

        request = self.context.get("request")

        if not request or not request.user.is_authenticated:
            return None

        participant = (
            obj.participants
            .filter(user=request.user)
            .first()
        )

        if not participant:
            return None

        return participant.status

    def get_is_organizer(self, obj):

        request = self.context.get("request")

        if not request or not request.user.is_authenticated:
            return False

        return obj.organizer_id == request.user.id
    
# =========================================================
# CRÉATION D'ACTIVITÉ
# =========================================================

class ActivityCreateSerializer(serializers.ModelSerializer):

    activity_type = serializers.PrimaryKeyRelatedField(
        queryset=ActivityType.objects.filter(
            active=True
        )
    )

    community = serializers.PrimaryKeyRelatedField(
        queryset=Community.objects.all().order_by("name")
    )

    class Meta:
        model = Activity

        fields = [
            "title",
            "description",

            "activity_type",
            "community",

            "start_datetime",
            "end_datetime",

            "location_name",
            "address",
            "latitude",
            "longitude",

            "is_online",
            "meeting_url",

            "max_participants",
            "requires_confirmation",
        ]

    def validate(self, attrs):

        request = self.context.get("request")

        if not request or not request.user.is_authenticated:
            raise serializers.ValidationError(
                "Authentification requise."
            )

        community = attrs["community"]

        # -------------------------------------------------
        # Vérifier que l'utilisateur est membre
        # -------------------------------------------------

        is_member = CommunityMembership.objects.filter(
            user=request.user,
            community=community,
            end_date__isnull=True,
        ).exists()

        if not is_member:
            raise serializers.ValidationError({
                "community": (
                    "Vous devez être membre de cette "
                    "communauté pour créer une activité."
                )
            })

        # -------------------------------------------------
        # Cohérence des dates
        # -------------------------------------------------

        start = attrs.get("start_datetime")
        end = attrs.get("end_datetime")

        if end and start and end <= start:
            raise serializers.ValidationError({
                "end_datetime": (
                    "La date de fin doit être postérieure "
                    "à la date de début."
                )
            })

        # -------------------------------------------------
        # Activité en ligne
        # -------------------------------------------------

        is_online = attrs.get("is_online", False)
        meeting_url = attrs.get("meeting_url", "")

        if is_online and not meeting_url:
            raise serializers.ValidationError({
                "meeting_url": (
                    "Une URL de réunion est requise "
                    "pour une activité en ligne."
                )
            })

        # -------------------------------------------------
        # Activité physique
        # -------------------------------------------------

        if not is_online and not attrs.get("location_name"):
            # Pas bloquant : on laisse l'utilisateur
            # éventuellement renseigner seulement l'adresse.
            pass

        return attrs

    def create(self, validated_data):

        request = self.context["request"]

        activity = Activity.objects.create(
            organizer=request.user,
            status=Activity.Status.PUBLISHED,
            published_at=timezone.now(),
            **validated_data,
        )

        return activity
# =========================================================
# OPTIONS DU FORMULAIRE
# =========================================================

class ActivityOptionsSerializer(serializers.Serializer):

    types = ActivityTypeSerializer(
        many=True,
        read_only=True,
    )

    communities = ActivityCommunitySerializer(
        many=True,
        read_only=True,
    )

