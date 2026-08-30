from django.conf import settings
from django.conf.urls.static import static
from pathlib import Path
from django.http import JsonResponse
from django.urls import include, path, re_path

from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from django.contrib import admin
from django.urls import include, path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

from django.http import FileResponse, Http404
from pathlib import Path


def serve_media(request, path):
    file_path = Path(settings.MEDIA_ROOT) / path

    if not file_path.exists() or not file_path.is_file():
        raise Http404("Fichier média introuvable")

    return FileResponse(
        open(file_path, "rb"),
    )

urlpatterns = [

       # =====================================================
    # AUTHENTIFICATION JWT
    # =====================================================

    path(
        "api/login/",
        TokenObtainPairView.as_view(),
        name="login",
    ),


    path(
        "api/token/",
        TokenObtainPairView.as_view(),
        name="token_obtain_pair",
    ),

    path(
        "api/token/refresh/",
        TokenRefreshView.as_view(),
        name="token_refresh",
    ),

    path(
        "admin/",
        admin.site.urls,
    ),

    path(
        "api/bahai-calendar/",
        include("apps.bahai_calendar.urls"),
    ),

    path(
        "api/calendar/",
        include("apps.bahai_calendar.urls"),
    ),

    path(
        "api/personal-events/",
        include("apps.personal_events.urls"),
    ),

    path("api/events/", include("apps.events.urls")),

    path(
        "api/document-imports/",
        include("apps.document_imports.urls"),
    ),

    path(
        "api/notifications/",
        include("apps.notifications.urls"),
    ),

    path(
        "api/accounts/",
        include("apps.accounts.urls"),
    ),

    path(
    "api/communities/",
        include("apps.communities.urls"),
    ),
    
    path(
        "api/activities/",
        include("apps.activities.urls"),
    ),

    path(
        "api/quiz/",
        include("apps.quiz.urls"),
    ),

    path(
        "api/",
        include(
            "apps.daily_quotes.urls"
        ),
    ),
    path(
    "api/analytics/",
        include("apps.analytics.urls"),
    ),
    re_path(
        r"^media/(?P<path>.*)$",
        serve_media,
    ),
    ]


urlpatterns += static(
    settings.MEDIA_URL,
    document_root=settings.MEDIA_ROOT,
)