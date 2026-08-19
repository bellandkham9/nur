"""
Service central de gestion des événements.

Les événements peuvent provenir de deux sources :

1. PersonalEvent
   → événement créé directement par l'utilisateur.

2. DetectedEvent
   → événement extrait automatiquement d'un document.

EventService fournit une interface commune aux autres parties
de l'application : calendrier, notifications, recherche, etc.

Toutes les méthodes nécessitant un utilisateur filtrent les
données afin d'empêcher l'accès aux événements d'un autre
utilisateur.
"""

from django.db.models import Q
from django.utils import timezone

from apps.personal_events.models import PersonalEvent
from apps.document_imports.models import DetectedEvent


class EventService:
    """
    Service central de gestion des événements.
    """

    # ==========================================================
    # PERSONAL EVENTS
    # ==========================================================

    @staticmethod
    def get_personal_events(user):
        """
        Retourne uniquement les événements personnels
        appartenant à l'utilisateur.
        """

        return (
            PersonalEvent.objects
            .filter(user=user)
            .order_by(
                "date",
                "start_time",
                "id",
            )
        )

    # ==========================================================
    # DETECTED EVENTS
    # ==========================================================

    @staticmethod
    def get_detected_events(user):
        """
        Retourne uniquement les événements détectés
        appartenant aux documents de l'utilisateur.

        Les événements REJECTED sont exclus.
        """

        return (
            DetectedEvent.objects
            .filter(
                document__user=user
            )
            .exclude(
                status=DetectedEvent.Status.REJECTED
            ).
            exclude(
                personal_event__isnull=False
            )
            .select_related(
                "document",
                "page",
            )
            .order_by(
                "event_date",
                "start_time",
                "id",
            )
        )

    # ==========================================================
    # NORMALISATION PERSONAL EVENT
    # ==========================================================

    @staticmethod
    def normalize_personal_event(event):
        """
        Transforme un PersonalEvent en structure commune
        exploitable par l'API et la PWA.
        """

        return {
            "id": event.id,
            "user_id": event.user_id,

            "source": "personal",
            "source_id": event.id,

            "title": event.title,
            "description": event.description,

            "event_type": event.event_type,

            "event_type_display": (
                event.get_event_type_display()
            ),

            "date": event.date,
            "date_end": event.date,

            "start_time": event.start_time,
            "end_time": event.end_time,

            "location": event.location,

            "responsible": (
                event.responsible.username
                if hasattr(event.responsible, "username")
                else event.responsible
            ),

            "objective": "",

            "category": (
                event.get_event_type_display()
            ),

            "work_suspension": False,

            "status": "CONFIRMED",

            "confidence": 1.0,

            "reminder_enabled": (
                event.reminder_enabled
            ),

            "reminder_minutes": (
                event.reminder_minutes
            ),

            "document_id": None,
            "page_id": None,

            "source_reference": "",
        }
    # ==========================================================
    # NORMALISATION DETECTED EVENT
    # ==========================================================

    @staticmethod
    def normalize_detected_event(event):
        """
        Transforme un DetectedEvent en structure commune
        exploitable par l'API et la PWA.
        """

        return {
            "id": event.id,

            "user_id": event.document.user_id,

            "source": "document",
            "source_id": event.id,

            "title": event.title,
            "description": event.description,

            "event_type": "DETECTED",

            "event_type_display": (
                "Événement détecté"
            ),

            "date": event.event_date,
            "date_end": event.event_date_end,

            "start_time": event.start_time,
            "end_time": event.end_time,

            "location": event.location,
            "responsible": event.responsible,

            "objective": event.objective,

            "category": event.category,

            "work_suspension": (
                event.work_suspension
            ),

            "status": event.status,

            "confidence": event.confidence,

            "reminder_enabled": (
                event.reminder_enabled
            ),

            "reminder_minutes": (
                event.reminder_minutes
            ),

            "document_id": event.document_id,

            "page_id": event.page_id,

            "source_reference": (
                event.source_reference
            ),
        }

    # ==========================================================
    # TOUS LES ÉVÉNEMENTS
    # ==========================================================

    @staticmethod
    def get_all_events(user):
        """
        Retourne tous les événements accessibles
        par l'utilisateur.

        Les PersonalEvent et DetectedEvent sont
        normalisés dans une structure commune.
        """

        events = []

        # Événements personnels
        for event in EventService.get_personal_events(user):

            events.append(
                EventService.normalize_personal_event(
                    event
                )
            )

        # Événements détectés
        for event in EventService.get_detected_events(user):

            events.append(
                EventService.normalize_detected_event(
                    event
                )
            )

        events.sort(
            key=EventService._event_sort_key
        )

        return events

    # ==========================================================
    # ÉVÉNEMENTS DU JOUR
    # ==========================================================

    @staticmethod
    def get_today_events(user):
        """
        Retourne les événements ayant lieu aujourd'hui.

        Pour un événement détecté couvrant plusieurs jours,
        l'événement est retourné s'il couvre la date du jour.
        """

        today = timezone.localdate()

        events = []

        # ------------------------------------------------------
        # PERSONAL EVENTS
        # ------------------------------------------------------

        personal_events = (
            PersonalEvent.objects
            .filter(
                user=user,
                date=today,
            )
            .order_by(
                "start_time",
                "id",
            )
        )

        for event in personal_events:

            events.append(
                EventService.normalize_personal_event(
                    event
                )
            )

        # ------------------------------------------------------
        # DETECTED EVENTS
        # ------------------------------------------------------

        detected_events = (
            DetectedEvent.objects
            .filter(
                document__user=user,
            )
            .exclude(
                status=DetectedEvent.Status.REJECTED
            )
            .filter(
                event_date__lte=today
            )
            .filter(
                Q(event_date_end__gte=today)
                |
                Q(
                    event_date_end__isnull=True,
                    event_date=today,
                )
            )
            .select_related(
                "document",
                "page",
            )
            .order_by(
                "start_time",
                "id",
            )
        )

        for event in detected_events:

            events.append(
                EventService.normalize_detected_event(
                    event
                )
            )

        events.sort(
            key=EventService._event_sort_key
        )

        return events

    # ==========================================================
    # ÉVÉNEMENTS À VENIR
    # ==========================================================

    @staticmethod
    def get_upcoming_events(user, limit=20):
        """
        Retourne les prochains événements.

        Les événements du jour et futurs sont inclus.
        """

        today = timezone.localdate()

        events = []

        # ------------------------------------------------------
        # PERSONAL EVENTS
        # ------------------------------------------------------

        personal_events = (
            PersonalEvent.objects
            .filter(
                user=user,
                date__gte=today,
            )
            .order_by(
                "date",
                "start_time",
                "id",
            )
        )

        for event in personal_events:

            events.append(
                EventService.normalize_personal_event(
                    event
                )
            )

        # ------------------------------------------------------
        # DETECTED EVENTS
        # ------------------------------------------------------

        detected_events = (
            DetectedEvent.objects
            .filter(
                document__user=user,
                event_date__gte=today,
            )
            .exclude(
                status=DetectedEvent.Status.REJECTED
            )
            .select_related(
                "document",
                "page",
            )
            .order_by(
                "event_date",
                "start_time",
                "id",
            )
        )

        for event in detected_events:

            events.append(
                EventService.normalize_detected_event(
                    event
                )
            )

        # ------------------------------------------------------
        # TRI + LIMITE
        # ------------------------------------------------------

        events.sort(
            key=EventService._event_sort_key
        )

        return events[:limit]

    # ==========================================================
    # RECHERCHE
    # ==========================================================

    @staticmethod
    def search_events(user, query=""):
        """
        Recherche un événement dans :

        - titre
        - description
        - lieu
        - responsable
        - catégorie
        - objectif
        """

        query = (query or "").strip()

        if not query:
            return EventService.get_all_events(user)

        events = []

        # ------------------------------------------------------
        # PERSONAL EVENTS
        # ------------------------------------------------------

        personal_events = (
            PersonalEvent.objects
            .filter(user=user)
            .filter(
                Q(title__icontains=query)
                |
                Q(description__icontains=query)
                |
                Q(location__icontains=query)
                |
                Q(responsible__icontains=query)
                |
                Q(event_type__icontains=query)
            )
            .order_by(
                "date",
                "start_time",
                "id",
            )
        )

        for event in personal_events:

            events.append(
                EventService.normalize_personal_event(
                    event
                )
            )

        # ------------------------------------------------------
        # DETECTED EVENTS
        # ------------------------------------------------------

        detected_events = (
            DetectedEvent.objects
            .filter(
                document__user=user
            )
            .exclude(
                status=DetectedEvent.Status.REJECTED
            )
            .filter(
                Q(title__icontains=query)
                |
                Q(description__icontains=query)
                |
                Q(location__icontains=query)
                |
                Q(responsible__icontains=query)
                |
                Q(objective__icontains=query)
                |
                Q(category__icontains=query)
                |
                Q(source_reference__icontains=query)
            )
            .select_related(
                "document",
                "page",
            )
            .order_by(
                "event_date",
                "start_time",
                "id",
            )
        )

        for event in detected_events:

            events.append(
                EventService.normalize_detected_event(
                    event
                )
            )

        events.sort(
            key=EventService._event_sort_key
        )

        return events

    # ==========================================================
    # ÉVÉNEMENTS PAR DATE
    # ==========================================================

    @staticmethod
    def get_events_by_date(user, target_date):
        """
        Retourne les événements correspondant à une date.

        Un événement détecté avec une période
        event_date -> event_date_end est inclus si
        target_date se trouve dans cette période.
        """

        events = []

        # ------------------------------------------------------
        # PERSONAL EVENTS
        # ------------------------------------------------------

        personal_events = (
            PersonalEvent.objects
            .filter(
                user=user,
                date=target_date,
            )
            .order_by(
                "start_time",
                "id",
            )
        )

        for event in personal_events:

            events.append(
                EventService.normalize_personal_event(
                    event
                )
            )

        # ------------------------------------------------------
        # DETECTED EVENTS
        # ------------------------------------------------------

        detected_events = (
            DetectedEvent.objects
            .filter(
                document__user=user,
                event_date__lte=target_date,
            )
            .exclude(
                status=DetectedEvent.Status.REJECTED
            )
            .filter(
                Q(event_date_end__gte=target_date)
                |
                Q(
                    event_date_end__isnull=True,
                    event_date=target_date,
                )
            )
            .select_related(
                "document",
                "page",
            )
            .order_by(
                "start_time",
                "id",
            )
        )

        for event in detected_events:

            events.append(
                EventService.normalize_detected_event(
                    event
                )
            )

        events.sort(
            key=EventService._event_sort_key
        )

        return events

    # ==========================================================
    # ÉVÉNEMENT UNIQUE
    # ==========================================================

    @staticmethod
    def get_event(user, source, event_id):
        """
        Récupère un événement précis.

        source :
            personal
            document

        Retourne un événement normalisé.
        """

        source = source.lower().strip()

        if source == "personal":

            event = EventService.get_personal_event(
                event_id=event_id,
                user=user,
            )

            if event is None:
                return None

            return EventService.normalize_personal_event(
                event
            )

        if source == "document":

            event = EventService.get_detected_event(
                event_id=event_id,
                user=user,
            )

            if event is None:
                return None

            return EventService.normalize_detected_event(
                event
            )

        return None

    # ==========================================================
    # CALENDRIER
    # ==========================================================

    @staticmethod
    def get_calendar_events(user):
        """
        Retourne les événements exploitables par le calendrier.

        PersonalEvent :
            toujours inclus.

        DetectedEvent :
            uniquement ceux confirmés.
        """

        events = []

        # ------------------------------------------------------
        # PERSONAL EVENTS
        # ------------------------------------------------------

        personal_events = (
            EventService.get_personal_events(user)
        )

        for event in personal_events:

            events.append(
                EventService.normalize_personal_event(
                    event
                )
            )

        # ------------------------------------------------------
        # DETECTED EVENTS CONFIRMÉS
        # ------------------------------------------------------

        detected_events = (
            EventService
            .get_detected_events(user)
            .filter(
                status=DetectedEvent.Status.CONFIRMED
            )
        )

        for event in detected_events:

            events.append(
                EventService.normalize_detected_event(
                    event
                )
            )

        events.sort(
            key=EventService._event_sort_key
        )

        return events

    # ==========================================================
    # REVIEW
    # ==========================================================

    @staticmethod
    def review_detected_event(event, user):
        """
        Place un événement détecté en attente
        de vérification.
        """

        if event.document.user_id != user.id:

            raise PermissionError(
                "Vous n'avez pas accès à cet événement."
            )

        if event.status == DetectedEvent.Status.REJECTED:

            raise ValueError(
                "Un événement rejeté ne peut pas être "
                "placé en vérification."
            )

        event.status = DetectedEvent.Status.REVIEW

        event.save(
            update_fields=[
                "status",
                "updated_at",
            ]
        )

        return event

    # ==========================================================
    # CONFIRMATION
    # ==========================================================

    @staticmethod
    def confirm_detected_event(event, user):
        """
        Confirme un événement détecté.
        """

        if event.document.user_id != user.id:

            raise PermissionError(
                "Vous n'avez pas accès à cet événement."
            )

        if event.status == DetectedEvent.Status.REJECTED:

            raise ValueError(
                "Un événement rejeté ne peut pas être confirmé."
            )

        event.status = DetectedEvent.Status.CONFIRMED

        event.save(
            update_fields=[
                "status",
                "updated_at",
            ]
        )

        return event

    # ==========================================================
    # REJET
    # ==========================================================

    @staticmethod
    def reject_detected_event(event, user):
        """
        Rejette un événement détecté.
        """

        if event.document.user_id != user.id:

            raise PermissionError(
                "Vous n'avez pas accès à cet événement."
            )

        event.status = DetectedEvent.Status.REJECTED

        event.save(
            update_fields=[
                "status",
                "updated_at",
            ]
        )

        return event

    # ==========================================================
    # RÉCUPÉRATION D'UN ÉVÉNEMENT DÉTECTÉ
    # ==========================================================

    @staticmethod
    def get_detected_event(event_id, user):
        """
        Récupère un événement détecté appartenant
        à l'utilisateur.
        """

        return (
            DetectedEvent.objects
            .filter(
                id=event_id,
                document__user=user,
            )
            .select_related(
                "document",
                "page",
            )
            .first()
        )

    # ==========================================================
    # RÉCUPÉRATION D'UN ÉVÉNEMENT PERSONNEL
    # ==========================================================

    @staticmethod
    def get_personal_event(event_id, user):
        """
        Récupère un événement personnel appartenant
        à l'utilisateur.
        """

        return (
            PersonalEvent.objects
            .filter(
                id=event_id,
                user=user,
            )
            .first()
        )

    # ==========================================================
    # TRI COMMUN
    # ==========================================================

    @staticmethod
    def _event_sort_key(event):
        """
        Clé de tri commune.

        Les événements sans date sont placés à la fin.
        """

        date = event.get("date")
        start_time = event.get("start_time")

        return (
            date is None,
            date if date is not None else "",
            start_time is None,
            start_time if start_time is not None else "",
            event.get("id", 0),
        )