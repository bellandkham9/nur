from apps.communities.models import CommunityMembership


def user_can(user, permission_code, community=None):
    """
    Vérifie si un utilisateur possède une permission.

    Si une communauté est fournie, la permission
    est vérifiée dans le contexte de cette communauté.
    """

    if not user or not user.is_authenticated:
        return False

    # Superuser Django
    if user.is_superuser:
        return True

    try:
        profile = user.profile
    except Exception:
        return False

    # Pas de profil ou pas de rôle global
    if not profile.role:
        return False

    # Vérification globale
    has_permission = profile.role.permissions.filter(
        code=permission_code
    ).exists()

    if has_permission:
        return True

    # Si aucune communauté n'est précisée,
    # la permission globale suffit.
    if community is None:
        return False

    # Vérification du rôle dans la communauté
    membership = CommunityMembership.objects.filter(
        user=user,
        community=community,
        role__permissions__code=permission_code,
    ).first()

    return membership is not None