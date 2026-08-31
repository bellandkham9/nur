from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    RegisterView,
    UserPreferencesView,
    CurrentUserView,
)

router = DefaultRouter()

urlpatterns = router.urls + [

    path(
        "register/",
        RegisterView.as_view(),
        name="register",
    ),

    path(
        "preferences/",
        UserPreferencesView.as_view(),
        name="user-preferences",
    ),

    path(
        "me/",
        CurrentUserView.as_view(),
        name="current-user",
    ),
]