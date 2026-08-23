from django.conf import settings
from django.conf.urls.static import static
from pathlib import Path
from django.http import JsonResponse

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

def media_debug(request):
    path = settings.MEDIA_ROOT / "quiz" / "questions" / "chicago.png"

    return JsonResponse({
        "DEBUG": settings.DEBUG,
        "BASE_DIR": str(settings.BASE_DIR),
        "MEDIA_ROOT": str(settings.MEDIA_ROOT),
        "file_exists": path.exists(),
        "file_path": str(path),
    })


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
    path("debug-media/", media_debug),
    ]


urlpatterns += static(
    settings.MEDIA_URL,
    document_root=settings.MEDIA_ROOT,
)