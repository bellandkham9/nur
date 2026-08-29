from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    NotificationViewSet,
    PushSubscriptionViewSet,
    process_notifications_cron,
    process_notifications_internal,
)


router = DefaultRouter()

# IMPORTANT :
# Les routes spécifiques doivent être déclarées
# avant la route générale des notifications.

router.register(
    r"push-subscriptions",
    PushSubscriptionViewSet,
    basename="push-subscription",
)

router.register(
    r"",
    NotificationViewSet,
    basename="notification",
)


urlpatterns = [
    path(
        "process/",
        process_notifications_cron,
        name="notifications-process-cron",
    ),
    path(
        "internal/process/",
        process_notifications_internal,
        name="process-notifications-internal",
    ),
]

urlpatterns += router.urls