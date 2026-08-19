from rest_framework.routers import DefaultRouter

from .views import PersonalEventViewSet


router = DefaultRouter()

router.register(
    r"",
    PersonalEventViewSet,
    basename="personal-event",
)


urlpatterns = router.urls