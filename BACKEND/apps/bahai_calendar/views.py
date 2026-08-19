from datetime import date

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import (
    BahaiDateSerializer,
    BahaiEventSerializer,
)
from .services.calendar import BahaiCalendar
from .services.events import (
    get_all_events,
    get_events_between,
    get_next_event,
)


# ============================================================
# CALENDRIER DU JOUR
# ============================================================

class TodayCalendarView(APIView):
    """
    Retourne les informations calendaires
    correspondant à aujourd'hui.
    """

    def get(self, request):

        today = date.today()

        calendar = BahaiCalendar()

        try:
            bahai_date = calendar.from_gregorian(today)

        except ValueError as error:

            return Response(
                {
                    "detail": str(error),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = BahaiDateSerializer(
            {
                "year": bahai_date.year,
                "month": bahai_date.month,
                "day": bahai_date.day,
                "month_name": bahai_date.month_name,
                "month_meaning": bahai_date.month_meaning,
            }
        )

        return Response(
            {
                "gregorian_date": today.isoformat(),
                "bahai_date": serializer.data,
            }
        )
    
# ============================================================
# CONVERSION D'UNE DATE
# ============================================================

class CalendarDateView(APIView):
    """
    Convertit une date grégorienne
    en date bahá'íe.

    Exemple :

    /api/calendar/date/2026-08-20/
    """

    def get(
        self,
        request,
        date_string,
    ):

        try:

            gregorian_date = date.fromisoformat(
                date_string
            )

        except ValueError:

            return Response(
                {
                    "detail": (
                        "Date invalide. "
                        "Format attendu : YYYY-MM-DD."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        calendar = BahaiCalendar()

        try:

            bahai_date = calendar.from_gregorian(
                gregorian_date
            )

        except ValueError as error:

            return Response(
                {
                    "detail": str(error),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = BahaiDateSerializer(
            {
                "year": bahai_date.year,
                "month": bahai_date.month,
                "day": bahai_date.day,
                "month_name": bahai_date.month_name,
                "month_meaning": bahai_date.month_meaning,
            }
        )

        return Response(
            {
                "gregorian_date": gregorian_date.isoformat(),
                "bahai_date": serializer.data,
            }
        )

# ============================================================
# ÉVÉNEMENTS D'UNE ANNÉE
# ============================================================

class BahaiEventsView(APIView):
    """
    Retourne tous les événements bahá'ís
    d'une année grégorienne.

    Exemple :

    /api/calendar/events/?year=2026
    """

    def get(self, request):

        year_param = request.query_params.get(
            "year"
        )

        if year_param is None:

            year = date.today().year

        else:

            try:

                year = int(year_param)

            except ValueError:

                return Response(
                    {
                        "detail": (
                            "Le paramètre 'year' "
                            "doit être un nombre."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

        try:

            events = get_all_events(year)

        except ValueError as error:

            return Response(
                {
                    "detail": str(error),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = BahaiEventSerializer(
            events,
            many=True,
        )

        return Response(
            {
                "year": year,
                "count": len(events),
                "events": serializer.data,
            }
        )


# ============================================================
# ÉVÉNEMENTS ENTRE DEUX DATES
# ============================================================

class BahaiEventsBetweenView(APIView):
    """
    Retourne les événements compris entre
    deux dates.

    Exemple :

    /api/calendar/events/between/
        ?start=2026-01-01
        &end=2026-12-31
    """

    def get(self, request):

        start = request.query_params.get(
            "start"
        )

        end = request.query_params.get(
            "end"
        )

        if not start or not end:

            return Response(
                {
                    "detail": (
                        "Les paramètres "
                        "'start' et 'end' "
                        "sont obligatoires."
                    ),
                    "example": (
                        "?start=2026-01-01"
                        "&end=2026-12-31"
                    ),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:

            start_date = date.fromisoformat(
                start
            )

            end_date = date.fromisoformat(
                end
            )

        except ValueError:

            return Response(
                {
                    "detail": (
                        "Les dates doivent utiliser "
                        "le format YYYY-MM-DD."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if start_date > end_date:

            return Response(
                {
                    "detail": (
                        "La date de début doit être "
                        "antérieure ou égale à la "
                        "date de fin."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:

            events = get_events_between(
                start_date,
                end_date,
            )

        except ValueError as error:

            return Response(
                {
                    "detail": str(error),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = BahaiEventSerializer(
            events,
            many=True,
        )

        return Response(
            {
                "start": start_date.isoformat(),
                "end": end_date.isoformat(),
                "count": len(events),
                "events": serializer.data,
            }
        )


# ============================================================
# PROCHAIN ÉVÉNEMENT
# ============================================================

class NextBahaiEventView(APIView):
    """
    Retourne le prochain événement bahá'í.

    Exemple :

    /api/calendar/events/next/

    ou :

    /api/calendar/events/next/?from=2026-08-09
    """

    def get(self, request):

        from_param = request.query_params.get(
            "from"
        )

        if from_param:

            try:

                reference_date = date.fromisoformat(
                    from_param
                )

            except ValueError:

                return Response(
                    {
                        "detail": (
                            "Le paramètre 'from' "
                            "doit être au format "
                            "YYYY-MM-DD."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

        else:

            reference_date = date.today()

        try:

            event = get_next_event(
                reference_date
            )

        except ValueError as error:

            return Response(
                {
                    "detail": str(error),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if event is None:

            return Response(
                {
                    "event": None,
                }
            )

        serializer = BahaiEventSerializer(
            event
        )

        return Response(
            {
                "from": reference_date.isoformat(),
                "event": serializer.data,
            }
        )