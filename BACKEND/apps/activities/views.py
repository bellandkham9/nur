
from django.utils import timezone

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import (
    Activity,
    ActivityParticipant,
    ActivityType,
)

from .serializers import (
    ActivitySerializer,
    ActivityCreateSerializer,
    ActivityTypeSerializer,
    ActivityParticipantSerializer,
    ActivityCommunitySerializer,
)

from apps.communities.models import CommunityMembership


# =========================================================
# TYPES D'ACTIVITÉS
# =========================================================

class ActivityTypeListView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        activity_types = (
            ActivityType.objects
            .filter(active=True)
            .order_by("name")
        )

        serializer = ActivityTypeSerializer(
            activity_types,
            many=True,
        )

        return Response(serializer.data)


# =========================================================
# MES COMMUNAUTÉS
# =========================================================

class MyActivityCommunitiesView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        memberships = (
            CommunityMembership.objects
            .filter(
                user=request.user,
                end_date__isnull=True,
            )
            .select_related("community")
            .order_by("community__name")
        )

        communities = [
            membership.community
            for membership in memberships
        ]

        serializer = ActivityCommunitySerializer(
            communities,
            many=True,
        )

        return Response(serializer.data)


# =========================================================
# OPTIONS DU FORMULAIRE
# =========================================================

class ActivityOptionsView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        # -------------------------------------------------
        # TYPES D'ACTIVITÉS
        # -------------------------------------------------

        activity_types = (
            ActivityType.objects
            .filter(active=True)
            .order_by("name")
        )

        # -------------------------------------------------
        # COMMUNAUTÉS DE L'UTILISATEUR
        # -------------------------------------------------

        memberships = (
            CommunityMembership.objects
            .filter(
                user=request.user,
                end_date__isnull=True,
            )
            .select_related("community")
            .order_by("community__name")
        )

        communities = [
            membership.community
            for membership in memberships
        ]

        # -------------------------------------------------
        # RÉPONSE
        # -------------------------------------------------

        return Response(
            {
                "types": ActivityTypeSerializer(
                    activity_types,
                    many=True,
                ).data,

                "communities": ActivityCommunitySerializer(
                    communities,
                    many=True,
                ).data,
            }
        )


# =========================================================
# LISTE + CRÉATION
# =========================================================

class ActivityListView(APIView):

    permission_classes = [IsAuthenticated]

    # -----------------------------------------------------
    # LISTE
    # -----------------------------------------------------

    def get(self, request):

        activities = (
            Activity.objects
            .select_related(
                "activity_type",
                "community",
                "organizer",
            )
            .prefetch_related(
                "participants__user"
            )
            .exclude(
                status=Activity.Status.CANCELLED
            )
            .order_by("start_datetime")
        )

        serializer = ActivitySerializer(
            activities,
            many=True,
            context={
                "request": request,
            },
        )

        return Response(serializer.data)

    # -----------------------------------------------------
    # CRÉATION
    # -----------------------------------------------------

    def post(self, request):

        serializer = ActivityCreateSerializer(
            data=request.data,
            context={
                "request": request,
            },
        )

        if not serializer.is_valid():

            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Création de l'activité
        activity = serializer.save()

        # -------------------------------------------------
        # L'organisateur devient automatiquement participant
        # -------------------------------------------------

        ActivityParticipant.objects.get_or_create(
            activity=activity,
            user=request.user,
            defaults={
                "status": ActivityParticipant.Status.ACCEPTED,
                "responded_at": timezone.now(),
            },
        )

        # -------------------------------------------------
        # CRÉER LES RAPPELS
        # -------------------------------------------------

        from apps.notifications.services.notification_service import (
            NotificationService,
        )

        NotificationService.sync_activity_reminders(
            activity
        )

        # -------------------------------------------------
        # RÉPONSE
        # -------------------------------------------------

        return Response(
            ActivitySerializer(
                activity,
                context={
                    "request": request,
                },
            ).data,
            status=status.HTTP_201_CREATED,
        )
# =========================================================
# DÉTAIL
# =========================================================

class ActivityDetailView(APIView):

    permission_classes = [IsAuthenticated]

    def get_object(self, activity_id):

        try:

            return (
                Activity.objects
                .select_related(
                    "activity_type",
                    "community",
                    "organizer",
                )
                .prefetch_related(
                    "participants__user"
                )
                .get(pk=activity_id)
            )

        except Activity.DoesNotExist:

            return None

    def get(self, request, activity_id):

        activity = self.get_object(activity_id)

        if not activity:

            return Response(
                {
                    "detail": "Activité introuvable."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = ActivitySerializer(
            activity,
            context={
                "request": request,
            },
        )

        return Response(serializer.data)

    def delete(self, request, activity_id):

        # -------------------------------------------------
        # RÉCUPÉRER L'ACTIVITÉ
        # -------------------------------------------------

        try:
            activity = Activity.objects.get(
                pk=activity_id
            )

        except Activity.DoesNotExist:

            return Response(
                {
                    "detail": "Activité introuvable."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        # -------------------------------------------------
        # VÉRIFIER L'ORGANISATEUR
        # -------------------------------------------------

        if activity.organizer_id != request.user.id:

            return Response(
                {
                    "detail": (
                        "Seul l'organisateur peut "
                        "supprimer cette activité."
                    )
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        # -------------------------------------------------
        # SUPPRIMER LES NOTIFICATIONS ASSOCIÉES
        # -------------------------------------------------

        from apps.notifications.models import Notification

        deleted_notifications, _ = (
            Notification.objects.filter(
                event_source="ACTIVITY",
                event_id=activity.id,
            ).delete()
        )

        # -------------------------------------------------
        # SUPPRIMER L'ACTIVITÉ
        # -------------------------------------------------

        activity.delete()

        # -------------------------------------------------
        # RÉPONSE
        # -------------------------------------------------

        return Response(
            {
                "success": True,
                "detail": "Activité supprimée avec succès.",
                "activity_id": activity_id,
                "notifications_deleted": deleted_notifications,
            },
            status=status.HTTP_200_OK,
        )


# =========================================================
# PUBLIER UNE ACTIVITÉ
# =========================================================

class ActivityPublishView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request, activity_id):

        # -------------------------------------------------
        # RÉCUPÉRER L'ACTIVITÉ
        # -------------------------------------------------

        try:
            activity = (
                Activity.objects
                .select_related(
                    "activity_type",
                    "community",
                    "organizer",
                )
                .get(pk=activity_id)
            )

        except Activity.DoesNotExist:

            return Response(
                {
                    "detail": "Activité introuvable."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        # -------------------------------------------------
        # VÉRIFIER L'ORGANISATEUR
        # -------------------------------------------------

        if activity.organizer_id != request.user.id:

            return Response(
                {
                    "detail": (
                        "Seul l'organisateur peut "
                        "publier cette activité."
                    )
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        # -------------------------------------------------
        # VÉRIFIER LE STATUT
        # -------------------------------------------------

        if activity.status == Activity.Status.PUBLISHED:

            return Response(
                {
                    "detail": (
                        "Cette activité est déjà publiée."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if activity.status == Activity.Status.CANCELLED:

            return Response(
                {
                    "detail": (
                        "Une activité annulée ne peut "
                        "pas être publiée."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # -------------------------------------------------
        # VÉRIFIER LA DATE
        # -------------------------------------------------

        if not activity.start_datetime:

            return Response(
                {
                    "detail": (
                        "La date de début est obligatoire "
                        "pour publier l'activité."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if activity.start_datetime <= timezone.now():

            return Response(
                {
                    "detail": (
                        "Impossible de publier une activité "
                        "dont la date est déjà passée."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # -------------------------------------------------
        # PUBLICATION
        # -------------------------------------------------

        activity.status = Activity.Status.PUBLISHED
        activity.published_at = timezone.now()

        activity.save(
            update_fields=[
                "status",
                "published_at",
            ]
        )

        # -------------------------------------------------
        # CRÉER LES RAPPELS
        # -------------------------------------------------

        from apps.notifications.services.notification_service import (
            NotificationService,
        )

        NotificationService.sync_activity_reminders(
            activity
        )

        # -------------------------------------------------
        # RÉPONSE
        # -------------------------------------------------

        serializer = ActivitySerializer(
            activity,
            context={
                "request": request,
            },
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )
    
# =========================================================
# REJOINDRE
# =========================================================

class ActivityJoinView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request, activity_id):

        # -------------------------------------------------
        # Récupérer l'activité
        # -------------------------------------------------

        try:

            activity = (
                Activity.objects
                .select_related("community")
                .get(pk=activity_id)
            )

        except Activity.DoesNotExist:

            return Response(
                {
                    "detail": "Activité introuvable."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        # -------------------------------------------------
        # Vérifier que l'activité est accessible
        # -------------------------------------------------

        if activity.status not in [
            Activity.Status.PUBLISHED,
            Activity.Status.PENDING,
        ]:

            return Response(
                {
                    "detail": (
                        "Cette activité n'est pas "
                        "ouverte aux inscriptions."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # -------------------------------------------------
        # Vérifier l'adhésion à la communauté
        # -------------------------------------------------

        is_community_member = (
            CommunityMembership.objects
            .filter(
                user=request.user,
                community=activity.community,
                end_date__isnull=True,
            )
            .exists()
        )

        if not is_community_member:

            return Response(
                {
                    "detail": (
                        "Vous devez être membre de la "
                        "communauté pour rejoindre "
                        "cette activité."
                    )
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        # -------------------------------------------------
        # Vérifier la capacité
        # -------------------------------------------------

        if activity.max_participants:

            accepted_count = (
                ActivityParticipant.objects
                .filter(
                    activity=activity,
                    status=(
                        ActivityParticipant.Status.ACCEPTED
                    ),
                )
                .count()
            )

            # Si l'utilisateur est déjà accepté,
            # ne pas considérer cela comme une nouvelle place.
            already_accepted = (
                ActivityParticipant.objects
                .filter(
                    activity=activity,
                    user=request.user,
                    status=(
                        ActivityParticipant.Status.ACCEPTED
                    ),
                )
                .exists()
            )

            if (
                accepted_count >= activity.max_participants
                and not already_accepted
            ):

                return Response(
                    {
                        "detail": (
                            "Le nombre maximum de "
                            "participants est atteint."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

        # -------------------------------------------------
        # Créer / récupérer la participation
        # -------------------------------------------------

        participant, created = (
            ActivityParticipant.objects
            .get_or_create(
                activity=activity,
                user=request.user,
                defaults={
                    "status": (
                        ActivityParticipant.Status.ACCEPTED
                    ),
                    "responded_at": timezone.now(),
                },
            )
        )

        # -------------------------------------------------
        # Déjà participant
        # -------------------------------------------------

        if not created:

            if participant.status == (
                ActivityParticipant.Status.ACCEPTED
            ):

                return Response(
                    {
                        "detail": (
                            "Vous participez déjà "
                            "à cette activité."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # -------------------------------------------------
            # Réactivation de la participation
            # -------------------------------------------------

            participant.status = (
                ActivityParticipant.Status.ACCEPTED
            )

            participant.responded_at = timezone.now()

            participant.save(
                update_fields=[
                    "status",
                    "responded_at",
                ]
            )

        from apps.notifications.services.notification_service import (
            NotificationService,
        )

        NotificationService.create_activity_reminder(
            activity=activity,
            user=request.user,
        )

        # -------------------------------------------------
        # Réponse
        # -------------------------------------------------

        return Response(
            ActivityParticipantSerializer(
                participant,
                context={
                    "request": request,
                },
            ).data,
            status=status.HTTP_200_OK,
        )


# =========================================================
# QUITTER
# =========================================================

class ActivityLeaveView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request, activity_id):

        try:

            participant = (
                ActivityParticipant.objects
                .get(
                    activity_id=activity_id,
                    user=request.user,
                )
            )

        except ActivityParticipant.DoesNotExist:

            return Response(
                {
                    "detail": (
                        "Vous ne participez pas "
                        "à cette activité."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # -------------------------------------------------
        # L'organisateur ne peut pas simplement
        # "quitter" son activité.
        # -------------------------------------------------

        activity = participant.activity

        if activity.organizer_id == request.user.id:

            return Response(
                {
                    "detail": (
                        "L'organisateur ne peut pas "
                        "quitter sa propre activité."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # -------------------------------------------------
        # Refuser / quitter
        # -------------------------------------------------

        participant.status = (
            ActivityParticipant.Status.DECLINED
        )

        participant.responded_at = timezone.now()

        participant.save(
            update_fields=[
                "status",
                "responded_at",
            ]
        )

        return Response(
            {
                "detail": (
                    "Vous avez quitté l'activité."
                )
            },
            status=status.HTTP_200_OK,
        )


# =========================================================
# PARTICIPANTS
# =========================================================

class ActivityParticipantListView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request, activity_id):

        # -------------------------------------------------
        # Vérifier que l'activité existe
        # -------------------------------------------------

        if not Activity.objects.filter(
            pk=activity_id
        ).exists():

            return Response(
                {
                    "detail": "Activité introuvable."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        # -------------------------------------------------
        # Récupérer les participants
        # -------------------------------------------------

        participants = (
            ActivityParticipant.objects
            .filter(
                activity_id=activity_id,
            )
            .select_related("user")
            .order_by("invited_at")
        )

        serializer = ActivityParticipantSerializer(
            participants,
            many=True,
            context={
                "request": request,
            },
        )

        return Response(serializer.data)

# =========================================================
# SUPPRIMER UNE ACTIVITÉ
# =========================================================

class ActivityDeleteView(APIView):

    permission_classes = [IsAuthenticated]

    def delete(self, request, activity_id):

        # -------------------------------------------------
        # RÉCUPÉRER L'ACTIVITÉ
        # -------------------------------------------------

        try:
            activity = Activity.objects.get(
                pk=activity_id
            )

        except Activity.DoesNotExist:

            return Response(
                {
                    "detail": "Activité introuvable."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        # -------------------------------------------------
        # VÉRIFIER L'ORGANISATEUR
        # -------------------------------------------------

        if activity.organizer_id != request.user.id:

            return Response(
                {
                    "detail": (
                        "Seul l'organisateur peut "
                        "supprimer cette activité."
                    )
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        # -------------------------------------------------
        # SUPPRIMER LES NOTIFICATIONS ASSOCIÉES
        # -------------------------------------------------

        from apps.notifications.models import Notification

        deleted_notifications, _ = (
            Notification.objects.filter(
                event_source="ACTIVITY",
                event_id=activity.id,
            ).delete()
        )

        # -------------------------------------------------
        # SUPPRIMER L'ACTIVITÉ
        # -------------------------------------------------

        activity_id_deleted = activity.id

        activity.delete()

        # -------------------------------------------------
        # RÉPONSE
        # -------------------------------------------------

        return Response(
            {
                "success": True,
                "detail": "Activité supprimée avec succès.",
                "activity_id": activity_id_deleted,
                "notifications_deleted": deleted_notifications,
            },
            status=status.HTTP_200_OK,
        )