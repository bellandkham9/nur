from rest_framework.routers import DefaultRouter

from .views import (
    NotificationViewSet,
    PushSubscriptionViewSet,
)


router = DefaultRouter()

router.register(
    r"",
    NotificationViewSet,
    basename="notification",
)

router.register(
    r"push-subscriptions",
    PushSubscriptionViewSet,
    basename="push-subscription",
)


urlpatterns = router.urls