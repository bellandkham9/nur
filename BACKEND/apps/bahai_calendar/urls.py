from django.urls import path

from .views import (
    TodayCalendarView,
    CalendarDateView,
    BahaiEventsView,
    BahaiEventsBetweenView,
    NextBahaiEventView,
)


urlpatterns = [

    path(
        "today/",
        TodayCalendarView.as_view(),
        name="calendar-today",
    ),

    path(
        "date/<str:date_string>/",
        CalendarDateView.as_view(),
        name="calendar-date",
    ),

    path(
        "events/",
        BahaiEventsView.as_view(),
        name="bahai-events",
    ),

    path(
        "events/between/",
        BahaiEventsBetweenView.as_view(),
        name="bahai-events-between",
    ),

    path(
        "events/next/",
        NextBahaiEventView.as_view(),
        name="bahai-next-event",
    ),
]