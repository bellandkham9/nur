from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    DocumentImportViewSet,
    DocumentPageViewSet,
    ExtractedTableViewSet,
    ExtractedImageViewSet,
    ExtractedInformationViewSet,
    DetectedEventViewSet,
    EventListView,
    EventTodayView,
    EventUpcomingView,
    EventSearchView,
    EventByDateView,
    EventDetailView,
)


router = DefaultRouter()


# ─────────────────────────────────────────────
# DOCUMENTS
# ─────────────────────────────────────────────

router.register(
    r"",
    DocumentImportViewSet,
    basename="document-import",
)


# ─────────────────────────────────────────────
# PAGES
# ─────────────────────────────────────────────

router.register(
    r"pages",
    DocumentPageViewSet,
    basename="document-page",
)


# ─────────────────────────────────────────────
# TABLES
# ─────────────────────────────────────────────

router.register(
    r"tables",
    ExtractedTableViewSet,
    basename="extracted-table",
)


# ─────────────────────────────────────────────
# IMAGES
# ─────────────────────────────────────────────

router.register(
    r"images",
    ExtractedImageViewSet,
    basename="extracted-image",
)


# ─────────────────────────────────────────────
# INFORMATIONS EXTRAITES
# ─────────────────────────────────────────────

router.register(
    r"information",
    ExtractedInformationViewSet,
    basename="extracted-information",
)


# ─────────────────────────────────────────────
# ÉVÉNEMENTS DÉTECTÉS
# ─────────────────────────────────────────────

router.register(
    r"detected-events",
    DetectedEventViewSet,
    basename="detected-event",
)


# ─────────────────────────────────────────────
# ÉVÉNEMENTS UNIFIÉS
# ─────────────────────────────────────────────

urlpatterns = router.urls + [

    path(
        "events/",
        EventListView.as_view(),
        name="event-list",
    ),

    path(
        "events/today/",
        EventTodayView.as_view(),
        name="event-today",
    ),

    path(
        "events/upcoming/",
        EventUpcomingView.as_view(),
        name="event-upcoming",
    ),

    path(
        "events/search/",
        EventSearchView.as_view(),
        name="event-search",
    ),

    path(
        "events/date/<str:date_string>/",
        EventByDateView.as_view(),
        name="event-by-date",
    ),

    path(
        "events/<str:source>/<int:event_id>/",
        EventDetailView.as_view(),
        name="event-detail",
    ),
    path(
    "<int:document_id>/detected-events/",
    DetectedEventViewSet.as_view({
        "get": "document_events",
    }),
    name="document-detected-events",
),
]