from datetime import datetime

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .services.event_service import EventService


class EventListView(APIView):
    """
    API unifiée de consultation des événements de l'utilisateur.

    GET /api/events/

    Regroupe :
    - les événements personnels
    - les événements détectés dans les documents
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        events = EventService.get_all_events(
            user=request.user
        )

        return Response(
            events,
            status=status.HTTP_200_OK
        )


class EventTodayView(APIView):
    """
    GET /api/events/today/
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        events = EventService.get_today_events(
            user=request.user
        )

        return Response(
            events,
            status=status.HTTP_200_OK
        )


class EventUpcomingView(APIView):
    """
    GET /api/events/upcoming/?limit=20
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):

        try:
            limit = int(
                request.query_params.get(
                    "limit",
                    20
                )
            )

        except (TypeError, ValueError):
            limit = 20

        # Sécurité : empêcher une requête énorme
        limit = max(
            1,
            min(limit, 100)
        )

        events = EventService.get_upcoming_events(
            user=request.user,
            limit=limit
        )

        return Response(
            events,
            status=status.HTTP_200_OK
        )


class EventSearchView(APIView):
    """
    GET /api/events/search/?q=...
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):

        query = request.query_params.get(
            "q",
            ""
        ).strip()

        events = EventService.search_events(
            user=request.user,
            query=query
        )

        return Response(
            events,
            status=status.HTTP_200_OK
        )


class EventByDateView(APIView):
    """
    GET /api/events/date/2026-08-09/
    """

    permission_classes = [IsAuthenticated]

    def get(self, request, date_string):

        try:
            target_date = datetime.strptime(
                date_string,
                "%Y-%m-%d"
            ).date()

        except ValueError:

            return Response(
                {
                    "detail": (
                        "Format de date invalide. "
                        "Utilisez YYYY-MM-DD."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        events = EventService.get_events_by_date(
            user=request.user,
            target_date=target_date
        )

        return Response(
            events,
            status=status.HTTP_200_OK
        )


class EventDetailView(APIView):
    """
    GET /api/events/<source>/<event_id>/

    source :
        personal
        document
    """

    permission_classes = [IsAuthenticated]

    def get(
        self,
        request,
        source,
        event_id
    ):

        source = source.lower().strip()

        if source not in (
            "personal",
            "document"
        ):
            return Response(
                {
                    "detail": (
                        "Source invalide. "
                        "Utilisez 'personal' ou 'document'."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            event_id = int(event_id)

        except (TypeError, ValueError):
            return Response(
                {
                    "detail": "Identifiant d'événement invalide."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        event = EventService.get_event(
            user=request.user,
            source=source,
            event_id=event_id
        )

        if event is None:
            return Response(
                {
                    "detail": (
                        "Événement introuvable "
                        "ou non accessible."
                    )
                },
                status=status.HTTP_404_NOT_FOUND
            )

        return Response(
            event,
            status=status.HTTP_200_OK
        )