from datetime import datetime
from django.db import transaction
from rest_framework.decorators import action
from rest_framework import viewsets, status
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from apps.personal_events.models import PersonalEvent
from .models import DocumentImport
from .serializers import DocumentImportSerializer
from .services.document_processor import DocumentProcessor
from rest_framework import status, viewsets
from rest_framework.parsers import (
    FormParser,
    MultiPartParser,
)
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.events.services.event_service import EventService

from .models import (
    DocumentImport,
    DocumentPage,
    ExtractedTable,
    ExtractedImage,
    ExtractedInformation,
    DetectedEvent,
)

from .serializers import (
    DocumentImportSerializer,
    DocumentPageSerializer,
    ExtractedTableSerializer,
    ExtractedImageSerializer,
    ExtractedInformationSerializer,
    DetectedEventSerializer,
)

from .services.document_processor import DocumentProcessor



# ============================================================
# DOCUMENTS
# ============================================================

class DocumentImportViewSet(viewsets.ModelViewSet):
    serializer_class = DocumentImportSerializer
    parser_classes = (MultiPartParser, FormParser)
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return DocumentImport.objects.filter(
            user=self.request.user
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        document = serializer.save(user=request.user)

        try:
            DocumentProcessor().process(document)
        except Exception:
            document.refresh_from_db()

            return Response(
                self.get_serializer(document).data,
                status=status.HTTP_422_UNPROCESSABLE_ENTITY,
            )

        document.refresh_from_db()

        return Response(
            self.get_serializer(document).data,
            status=status.HTTP_201_CREATED,
        )
    
# ============================================================
# PAGES
# ============================================================

class DocumentPageViewSet(
    viewsets.ReadOnlyModelViewSet
):

    queryset = DocumentPage.objects.all()

    serializer_class = DocumentPageSerializer


# ============================================================
# TABLES
# ============================================================

class ExtractedTableViewSet(
    viewsets.ReadOnlyModelViewSet
):

    queryset = ExtractedTable.objects.all()

    serializer_class = ExtractedTableSerializer


# ============================================================
# IMAGES
# ============================================================

class ExtractedImageViewSet(
    viewsets.ReadOnlyModelViewSet
):

    queryset = ExtractedImage.objects.all()

    serializer_class = ExtractedImageSerializer


# ============================================================
# INFORMATIONS EXTRAITES
# ============================================================

class ExtractedInformationViewSet(
    viewsets.ReadOnlyModelViewSet
):

    queryset = ExtractedInformation.objects.all()

    serializer_class = ExtractedInformationSerializer


# ============================================================
# ÉVÉNEMENTS DÉTECTÉS
# ============================================================

class DetectedEventViewSet(viewsets.ModelViewSet):

    queryset = DetectedEvent.objects.all()

    serializer_class = DetectedEventSerializer

    permission_classes = [IsAuthenticated]

    def document_events(self, request, document_id=None):
        events = DetectedEvent.objects.filter(
            document_id=document_id
        ).order_by(
            "event_date",
            "start_time"
        )

        serializer = self.get_serializer(
            events,
            many=True
        )

        return Response(serializer.data)
    
    def get_queryset(self):
        """
        L'utilisateur ne peut voir que les événements
        détectés provenant de ses propres documents.
        """

        return (
            DetectedEvent.objects
            .filter(
                document__user=self.request.user
            )
            .select_related(
                "document",
                "page",
            )
        )

    # ========================================================
    # REVIEW
    # ========================================================

    @action(
        detail=True,
        methods=["post"],
        url_path="review",
    )
    def review(self, request, pk=None):
        """
        Place un événement détecté en vérification.

        POST /api/detected-events/<id>/review/
        """

        event = self.get_object()

        try:

            event = EventService.review_detected_event(
                event=event,
                user=request.user,
            )

        except PermissionError as exc:

            return Response(
                {
                    "detail": str(exc)
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        except ValueError as exc:

            return Response(
                {
                    "detail": str(exc)
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            self.get_serializer(event).data,
            status=status.HTTP_200_OK,
        )

    # ========================================================
    # CONFIRM
    # ========================================================

    @action(
        detail=True,
        methods=["post"],
        url_path="confirm",
    )
    def confirm(self, request, pk=None):
        """
        Confirme un événement détecté.

        Si la date n'existe pas dans l'événement détecté,
        elle doit être fournie par l'utilisateur.

        POST /api/document-imports/detected-events/<id>/confirm/
        """

        event = self.get_object()

        # ====================================================
        # DONNÉES FOURNIES PAR LE FRONTEND
        # ====================================================

        supplied_title = request.data.get("title")
        supplied_date = request.data.get("date")
        supplied_start_time = request.data.get("start_time")
        supplied_end_time = request.data.get("end_time")
        supplied_location = request.data.get("location")
        supplied_responsible = request.data.get("responsible")
        supplied_description = request.data.get("description")
        supplied_reminder_enabled = request.data.get(
            "reminder_enabled"
        )
        supplied_reminder_minutes = request.data.get(
            "reminder_minutes"
        )
        title = (
            supplied_title
            if supplied_title is not None
            else event.title
        )

        description = (
            supplied_description
            if supplied_description is not None
            else event.description
        )

        location = (
            supplied_location
            if supplied_location is not None
            else event.location
        )

        responsible = (
            supplied_responsible
            if supplied_responsible is not None
            else event.responsible
        )

        reminder_enabled = (
            supplied_reminder_enabled
            if supplied_reminder_enabled is not None
            else event.reminder_enabled
        )

        reminder_minutes = (
            supplied_reminder_minutes
            if supplied_reminder_minutes is not None
            else event.reminder_minutes
        )

        # ====================================================
        # DATE
        # ====================================================

        event_date = (
            supplied_date
            if supplied_date
            else event.event_date
        )

        if not event_date:
            return Response(
                {
                    "detail": "La date de l'événement est obligatoire.",
                    "requires_completion": True,
                    "missing_fields": ["date"],
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ====================================================
        # HEURES
        # ====================================================

        start_time = (
            supplied_start_time
            if supplied_start_time
            else event.start_time
        )

        end_time = (
            supplied_end_time
            if supplied_end_time
            else event.end_time
        )

        try:

            with transaction.atomic():

                # ============================================
                # CONFIRMATION DE L'ÉVÉNEMENT DÉTECTÉ
                # ============================================

                event = EventService.confirm_detected_event(
                    event=event,
                    user=request.user,
                )

                # ============================================
                # SAUVEGARDE DES INFORMATIONS CORRIGÉES
                # ============================================

                event.title = title
                event.description = description
                event.event_date = event_date
                event.start_time = start_time
                event.end_time = end_time
                event.location = location
                event.responsible = responsible
                event.reminder_enabled = reminder_enabled
                event.reminder_minutes = reminder_minutes

                event.save()

                # ============================================
                # RECHERCHE D'UN PERSONAL EVENT EXISTANT
                # ============================================

                personal_event = (
                    PersonalEvent.objects.filter(
                        source_detected_event=event
                    ).first()
                )

                # ============================================
                # CRÉATION
                # ============================================

                if personal_event is None:

                    event_type = "OTHER"

                    category = (
                        event.category or ""
                    ).lower()

                    if "réunion" in category:
                        event_type = "MEETING"

                    elif "activité" in category:
                        event_type = "ACTIVITY"

                    elif "prière" in category:
                        event_type = "DEVOTIONAL"

                    elif "étude" in category:
                        event_type = "STUDY"

                    elif "dix-neuf" in category:
                        event_type = "FEAST"

                    elif "fête" in category:
                        event_type = "FEAST"

                    elif "saint" in category:
                        event_type = "HOLY_DAY"

                personal_event = PersonalEvent.objects.create(
                    user=request.user,

                    title=title,

                    description=description,

                    event_type=event_type,

                    source_detected_event=event,

                    date=event_date,

                    start_time=start_time,

                    end_time=end_time,

                    location=location,

                    responsible=responsible,

                    reminder_enabled=reminder_enabled,

                    reminder_minutes=reminder_minutes,
                )
        except PermissionError as exc:

            return Response(
                {
                    "detail": str(exc)
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        except ValueError as exc:

            return Response(
                {
                    "detail": str(exc)
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {
                "message": (
                    "Événement confirmé et ajouté "
                    "au calendrier."
                ),

                "detected_event": (
                    self.get_serializer(event).data
                ),

                "personal_event": {
                    "id": personal_event.id,
                    "title": personal_event.title,
                    "date": personal_event.date,
                    "start_time": personal_event.start_time,
                    "end_time": personal_event.end_time,
                    "location": personal_event.location,
                    "responsible": personal_event.responsible,
                    "event_type": personal_event.event_type,
                    "source_detected_event": (
                        personal_event
                        .source_detected_event_id
                    ),
                },
            },
            status=status.HTTP_200_OK,
        )
    # ========================================================
    # REJECT
    # ========================================================

    @action(
        detail=True,
        methods=["post"],
        url_path="reject",
    )
    def reject(self, request, pk=None):
        """
        Rejette un événement détecté.

        POST /api/detected-events/<id>/reject/
        """

        event = self.get_object()

        try:

            event = EventService.reject_detected_event(
                event=event,
                user=request.user,
            )

        except PermissionError as exc:

            return Response(
                {
                    "detail": str(exc)
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        return Response(
            self.get_serializer(event).data,
            status=status.HTTP_200_OK,
        )
    

# ============================================================
# ÉVÉNEMENTS UNIFIÉS
# ============================================================

class EventListView(APIView):
    """
    API unifiée de consultation des événements
    de l'utilisateur.

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

        # Sécurité :
        # empêcher une requête énorme

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

    def get(
        self,
        request,
        date_string
    ):

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
    - personal
    - document
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
                    "detail": (
                        "Identifiant d'événement "
                        "invalide."
                    )
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