from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import UserPreferencesView

router = DefaultRouter()

urlpatterns = router.urls + [

    path(
        "preferences/",
        UserPreferencesView.as_view(),
        name="user-preferences",
    ),
]