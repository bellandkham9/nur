from django.urls import path

from .views import (
    AnalyticsEventCreateView,
    AnalyticsStatsView,
)


urlpatterns = [
    path(
        "events/",
        AnalyticsEventCreateView.as_view(),
        name="analytics-events",
    ),

    path(
        "stats/",
        AnalyticsStatsView.as_view(),
        name="analytics-stats",
    ),
]