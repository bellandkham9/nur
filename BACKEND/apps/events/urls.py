
from django.urls import path

from .views import (
    EventListView,
    EventTodayView,
    EventUpcomingView,
    EventSearchView,
    EventByDateView,
    EventDetailView,
)


urlpatterns = [

    path(
        "",
        EventListView.as_view(),
        name="event-list",
    ),

    path(
        "today/",
        EventTodayView.as_view(),
        name="event-today",
    ),

    path(
        "upcoming/",
        EventUpcomingView.as_view(),
        name="event-upcoming",
    ),

    path(
        "search/",
        EventSearchView.as_view(),
        name="event-search",
    ),

    path(
        "date/<str:date_string>/",
        EventByDateView.as_view(),
        name="event-by-date",
    ),

    path(
        "<str:source>/<int:event_id>/",
        EventDetailView.as_view(),
        name="event-detail",
    ),
    path("", EventListView.as_view(), name="event-list"),
]

