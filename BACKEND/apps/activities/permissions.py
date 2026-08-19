from rest_framework.permissions import BasePermission

from apps.communities.models import CommunityMember


class IsCommunityMember(BasePermission):
    """
    Autorise uniquement les membres de la communauté
    concernée par l'activité.
    """

    def has_permission(self, request, view):

        if not request.user.is_authenticated:
            return False

        community_id = (
            request.data.get("community")
            or request.query_params.get("community")
        )

        if not community_id:
            return True

        return CommunityMember.objects.filter(
            community_id=community_id,
            user=request.user,
            end_date__isnull=True,
        ).exists()


class IsActivityOrganizer(BasePermission):
    """
    Seul l'organisateur peut modifier ou supprimer
    son activité.
    """

    def has_object_permission(
        self,
        request,
        view,
        obj,
    ):
        return obj.organizer == request.user