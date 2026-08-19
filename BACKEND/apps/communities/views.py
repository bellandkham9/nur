from django.utils import timezone

from rest_framework import serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.accounts.models import Role

from .models import Community, CommunityMembership
from .serializers import (
    CommunitySerializer,
    CommunityMembershipSerializer,
)


class CommunityViewSet(viewsets.ModelViewSet):
    """
    Gestion des communautés.

    GET     /api/communities/
    POST    /api/communities/
    GET     /api/communities/<id>/
    PATCH   /api/communities/<id>/
    DELETE  /api/communities/<id>/

    GET     /api/communities/my/
    GET     /api/communities/<id>/members/
    """

    queryset = Community.objects.all().order_by(
        "country",
        "city",
        "name",
    )

    serializer_class = CommunitySerializer
    permission_classes = [IsAuthenticated]

    # ==================================================
    # MES COMMUNAUTÉS
    # ==================================================

    @action(
        detail=False,
        methods=["get"],
        url_path="my",
    )
    def my_communities(self, request):
        """
        Retourne les communautés dont
        l'utilisateur connecté est membre.
        """

        communities = (
            Community.objects
            .filter(
                memberships__user=request.user
            )
            .distinct()
            .order_by(
                "country",
                "city",
                "name",
            )
        )

        serializer = self.get_serializer(
            communities,
            many=True,
        )

        return Response(serializer.data)

    # ==================================================
    # MEMBRES D'UNE COMMUNAUTÉ
    # ==================================================

    @action(
        detail=True,
        methods=["get"],
        url_path="members",
    )
    def members(self, request, pk=None):
        """
        Retourne les membres d'une communauté.
        """

        community = self.get_object()

        memberships = (
            CommunityMembership.objects
            .filter(
                community=community
            )
            .select_related(
                "user",
                "community",
                "role",
            )
            .order_by(
                "start_date",
                "id",
            )
        )

        serializer = CommunityMembershipSerializer(
            memberships,
            many=True,
        )

        return Response(serializer.data)


class CommunityMembershipViewSet(viewsets.ModelViewSet):
    """
    Gestion des adhésions aux communautés.

    GET     /api/communities/memberships/
    POST    /api/communities/memberships/
    GET     /api/communities/memberships/<id>/
    DELETE  /api/communities/memberships/<id>/

    GET     /api/communities/memberships/my/
    POST    /api/communities/memberships/leave/
    """

    serializer_class = CommunityMembershipSerializer
    permission_classes = [IsAuthenticated]

    # ==================================================
    # QUERYSET
    # ==================================================

    def get_queryset(self):
        """
        Un utilisateur ne peut voir que
        ses propres adhésions.
        """

        return (
            CommunityMembership.objects
            .filter(
                user=self.request.user
            )
            .select_related(
                "user",
                "community",
                "role",
            )
            .order_by(
                "-start_date",
                "-id",
            )
        )

    # ==================================================
    # CRÉATION
    # ==================================================

    def perform_create(self, serializer):
        """
        Création d'une adhésion.

        Tout nouvel adhérent reçoit automatiquement
        le rôle MEMBER.
        """

        member_role = Role.objects.filter(
            code="MEMBER"
        ).first()

        if not member_role:
            raise serializers.ValidationError(
                {
                    "role": (
                        "Le rôle MEMBER n'est pas configuré "
                        "dans le système."
                    )
                }
            )

        serializer.save(
            user=self.request.user,
            role=member_role,
            start_date=timezone.localdate(),
        )

    # ==================================================
    # MES ADHÉSIONS
    # ==================================================

    @action(
        detail=False,
        methods=["get"],
        url_path="my",
    )
    def my_memberships(self, request):
        """
        Retourne les adhésions
        de l'utilisateur connecté.
        """

        memberships = self.get_queryset()

        serializer = self.get_serializer(
            memberships,
            many=True,
        )

        return Response(serializer.data)

    # ==================================================
    # QUITTER UNE COMMUNAUTÉ
    # ==================================================

    @action(
        detail=False,
        methods=["post"],
        url_path="leave",
    )
    def leave(self, request):
        """
        Permet à l'utilisateur connecté
        de quitter une communauté.

        Body :

        {
            "community": 1
        }
        """

        community_id = request.data.get(
            "community"
        )

        if not community_id:
            return Response(
                {
                    "detail": (
                        "Le champ 'community' "
                        "est obligatoire."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        membership = (
            CommunityMembership.objects
            .filter(
                user=request.user,
                community_id=community_id,
            )
            .first()
        )

        if not membership:
            return Response(
                {
                    "detail": (
                        "Vous n'êtes pas membre "
                        "de cette communauté."
                    )
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        membership.delete()

        return Response(
            {
                "detail": (
                    "Vous avez quitté "
                    "la communauté."
                )
            },
            status=status.HTTP_200_OK,
        )