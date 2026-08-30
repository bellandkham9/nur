from datetime import timedelta

from django.db.models import Count
from django.utils import timezone

from rest_framework import status
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import AnalyticsEvent
from .serializers import AnalyticsEventSerializer

from django.contrib.auth import get_user_model
from django.db.models.functions import TruncDate

User = get_user_model()



class AnalyticsEventCreateView(APIView):
    """
    Reçoit un événement analytics depuis le frontend.
    """

    permission_classes = [AllowAny]

    def post(self, request):

        serializer = AnalyticsEventSerializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        event = serializer.save(
            user=(
                request.user
                if request.user.is_authenticated
                else None
            )
        )

        return Response(
            {
                "success": True,
                "event_id": event.id,
            },
            status=status.HTTP_201_CREATED,
        )


class AnalyticsStatsView(APIView):
    """
    Dashboard statistiques Analytics.

    Accessible uniquement aux administrateurs.
    """

    permission_classes = [IsAdminUser]

    def get(self, request):

        try:
            days = int(request.query_params.get("days", 7))
        except (TypeError, ValueError):
            days = 7

        days = max(1, min(days, 90))

        now = timezone.now()
        start_date = now - timedelta(days=days - 1)

        queryset = AnalyticsEvent.objects.filter(
            created_at__gte=start_date
        )

        total_events = queryset.count()

        active_users = (
            queryset
            .exclude(client_id="")
            .values("client_id")
            .distinct()
            .count()
        )

        app_opens = queryset.filter(
            event_type=AnalyticsEvent.EventType.APP_OPEN
        ).count()

        page_views = queryset.filter(
            event_type=AnalyticsEvent.EventType.PAGE_VIEW
        ).count()

        quiz_starts = queryset.filter(
            event_type=AnalyticsEvent.EventType.QUIZ_START
        ).count()

        quiz_completes = queryset.filter(
            event_type=AnalyticsEvent.EventType.QUIZ_COMPLETE
        ).count()

        quotes_views = queryset.filter(
            event_type=AnalyticsEvent.EventType.DAILY_QUOTE_VIEW
        ).count()

        notifications_opened = queryset.filter(
            event_type=AnalyticsEvent.EventType.NOTIFICATION_OPEN
        ).count()

        pwa_installs = queryset.filter(
            event_type=AnalyticsEvent.EventType.PWA_INSTALL
        ).count()

        daily_stats = (
            queryset
            .annotate(date=TruncDate("created_at"))
            .values("date")
            .annotate(events=Count("id"))
            .order_by("date")
        )

        daily = []

        for item in daily_stats:

            date = item["date"]

            users = (
                queryset
                .filter(created_at__date=date)
                .exclude(client_id="")
                .values("client_id")
                .distinct()
                .count()
            )

            daily.append({
                "date": date.isoformat(),
                "events": item["events"],
                "active_users": users,
            })

        event_types = (
            queryset
            .values("event_type")
            .annotate(count=Count("id"))
            .order_by("-count")
        )

        popular_pages = (
            queryset
            .filter(
                event_type=AnalyticsEvent.EventType.PAGE_VIEW
            )
            .exclude(path="")
            .values("path")
            .annotate(count=Count("id"))
            .order_by("-count")[:10]
        )

        return Response({
            "period": {
                "days": days,
                "start": start_date.date().isoformat(),
                "end": now.date().isoformat(),
            },

            "summary": {
                "total_events": total_events,
                "active_users": active_users,
                "app_opens": app_opens,
                "page_views": page_views,
                "quiz_starts": quiz_starts,
                "quiz_completes": quiz_completes,
                "quotes_views": quotes_views,
                "notifications_opened": notifications_opened,
                "pwa_installs": pwa_installs,
            },

            "daily": list(daily),

            "event_types": list(event_types),

            "popular_pages": list(popular_pages),
        })