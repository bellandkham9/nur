from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    NotificationViewSet,
    PushSubscriptionViewSet,
    process_notifications_cron,
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


urlpatterns = [
    path(
        "process/",
        process_notifications_cron,
        name="notifications-process-cron",
    ),
] + router.urls