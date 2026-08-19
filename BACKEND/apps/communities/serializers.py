from rest_framework import serializers

from .models import Community, CommunityMembership
from rest_framework import serializers

from .models import Community, CommunityMembership

class CommunitySerializer(serializers.ModelSerializer):

    class Meta:
        model = Community

        fields = [
            "id",
            "name",
            "description",
            "country",
            "city",
            "address",
            "latitude",
            "longitude",
            "timezone",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "created_at",
        "updated_at",
      ]



class CommunitySerializer(serializers.ModelSerializer):

    class Meta:
        model = Community

        fields = [
            "id",
            "name",
            "description",
            "country",
            "city",
            "address",
            "latitude",
            "longitude",
            "timezone",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]


class CommunityMembershipSerializer(serializers.ModelSerializer):

    username = serializers.CharField(
        source="user.username",
        read_only=True,
    )

    user_email = serializers.EmailField(
        source="user.email",
        read_only=True,
    )

    community_name = serializers.CharField(
        source="community.name",
        read_only=True,
    )

    role_name = serializers.CharField(
        source="role.name",
        read_only=True,
    )

    class Meta:
        model = CommunityMembership

        fields = [
            "id",
            "user",
            "username",
            "user_email",
            "community",
            "community_name",
            "role",
            "role_name",
            "start_date",
            "end_date",
            "created_at",
        ]

        read_only_fields = [
            "id",
            "user",
            "username",
            "user_email",
            "community_name",
            "role",
            "role_name",
            "start_date",
            "created_at",
        ]

    def validate(self, attrs):
        """
        Empêche un utilisateur d'être
        inscrit deux fois dans la même communauté.
        """

        request = self.context.get("request")

        if not request or not request.user.is_authenticated:
            return attrs

        community = attrs.get("community")

        if community is None:
            return attrs

        exists = CommunityMembership.objects.filter(
            user=request.user,
            community=community,
        ).exists()

        if exists:
            raise serializers.ValidationError({
                "community": (
                    "Vous êtes déjà membre "
                    "de cette communauté."
                )
            })

        return attrs

