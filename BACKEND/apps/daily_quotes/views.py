from datetime import date

from django.utils import timezone

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import DailyQuote
from .serializers import DailyQuoteSerializer


class DailyQuoteViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API des citations quotidiennes.

    Endpoints :

        GET /api/daily-quotes/
        GET /api/daily-quotes/<id>/
        GET /api/daily-quotes/today/?moment=MORNING
        GET /api/daily-quotes/today/?moment=EVENING
        GET /api/daily-quotes/date/?date=2026-03-21
    """

    serializer_class = DailyQuoteSerializer

    def get_queryset(self):
        return (
            DailyQuote.objects
            .filter(
                is_active=True,
                notification_enabled=True,
            )
            .order_by(
                "date",
                "moment",
            )
        )

    # ========================================================
    # CITATION DU JOUR
    # ========================================================

    @action(
        detail=False,
        methods=["get"],
        url_path="today",
    )
    def today(self, request):

        today = timezone.localdate()

        moment = request.query_params.get(
            "moment"
        )

        quotes = self.get_queryset().filter(
            date=today
        )

        # ----------------------------------------------------
        # FILTRE MATIN / SOIR
        # ----------------------------------------------------

        if moment:

            moment = moment.upper()

            valid_moments = {
                DailyQuote.Moment.MORNING,
                DailyQuote.Moment.EVENING,
            }

            if moment not in valid_moments:

                return Response(
                    {
                        "detail": (
                            "Moment invalide. "
                            "Utilisez MORNING ou EVENING."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            quotes = quotes.filter(
                moment=moment
            )

        # ----------------------------------------------------
        # AUCUNE CITATION
        # ----------------------------------------------------

        quote = quotes.first()

        if quote is None:

            return Response(
                {
                    "detail": (
                        "Aucune citation disponible "
                        "pour cette date et ce moment."
                    )
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        # ----------------------------------------------------
        # RÉPONSE
        # ----------------------------------------------------

        serializer = self.get_serializer(
            quote
        )

        return Response(
            serializer.data
        )

    # ========================================================
    # CITATIONS D'UNE DATE
    # ========================================================

    @action(
        detail=False,
        methods=["get"],
        url_path="date",
    )
    def by_date(self, request):

        date_string = request.query_params.get(
            "date"
        )

        if not date_string:

            return Response(
                {
                    "detail": (
                        "Le paramètre 'date' "
                        "est obligatoire."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:

            requested_date = date.fromisoformat(
                date_string
            )

        except ValueError:

            return Response(
                {
                    "detail": (
                        "Format de date invalide. "
                        "Utilisez YYYY-MM-DD."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        quotes = self.get_queryset().filter(
            date=requested_date
        )

        serializer = self.get_serializer(
            quotes,
            many=True,
        )

        return Response(
            {
                "date": requested_date,
                "count": quotes.count(),
                "quotes": serializer.data,
            }
        )