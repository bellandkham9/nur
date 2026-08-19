from rest_framework.routers import DefaultRouter

from .views import DailyQuoteViewSet


router = DefaultRouter()

router.register(
    r"daily-quotes",
    DailyQuoteViewSet,
    basename="daily-quote",
)

urlpatterns = router.urls