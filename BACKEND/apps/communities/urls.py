from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    CommunityViewSet,
    CommunityMembershipViewSet,
)


router = DefaultRouter()

# IMPORTANT :
# Les routes spécifiques doivent être enregistrées
# avant la route vide "".
router.register(
    "memberships",
    CommunityMembershipViewSet,
    basename="community-membership",
)

router.register(
    "",
    CommunityViewSet,
    basename="community",
)


urlpatterns = [
    path(
        "",
        include(router.urls),
    ),
]