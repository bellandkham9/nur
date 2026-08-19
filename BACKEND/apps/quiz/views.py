import random
from datetime import timedelta
from django.db import transaction
from django.utils import timezone

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import (
    QuizCategory,
    QuizQuestion,
    QuizAnswer,
    QuizSession,
    QuizUserAnswer,
    QuizProgress,
    QuizBadge,
    QuizUserBadge,
)

from .serializers import (
    QuizCategorySerializer,
    QuizQuestionSerializer,
    QuizSessionSerializer,
    QuizUserAnswerSerializer,
    QuizAnswerSubmitSerializer,
    QuizProgressSerializer,
    QuizBadgeSerializer,
    QuizUserBadgeSerializer,
)


# ==========================================================
# CATÉGORIES
# ==========================================================

class QuizCategoryListView(APIView):
    """
    GET /api/quiz/categories/
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):

        categories = (
            QuizCategory.objects
            .filter(active=True)
            .order_by("order", "name")
        )

        serializer = QuizCategorySerializer(
            categories,
            many=True,
        )

        return Response(serializer.data)


# ==========================================================
# DÉMARRER UN QUIZ
# ==========================================================

class QuizStartView(APIView):
    """
    POST /api/quiz/start/

    Body optionnel :

    {
        "category_id": 1,
        "question_count": 10
    }
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):

        category_id = request.data.get(
            "category_id"
        )

        question_count = request.data.get(
            "question_count",
            10,
        )

        time_limit_seconds = request.data.get(
            "time_limit_seconds",
            180,
        )

        try:
            time_limit_seconds = int(
                time_limit_seconds
            )
        except (TypeError, ValueError):

            return Response(
                {
                    "detail": (
                        "time_limit_seconds doit être "
                        "un nombre."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        time_limit_seconds = max(
            60,
            min(time_limit_seconds, 3600),
        )

        try:
            question_count = int(question_count)
        except (TypeError, ValueError):

            return Response(
                {
                    "detail": (
                        "question_count doit être "
                        "un nombre."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        question_count = max(
            1,
            min(question_count, 50),
        )

        # --------------------------------------------------
        # CATÉGORIE
        # --------------------------------------------------

        category = None

        if category_id:

            try:
                category = QuizCategory.objects.get(
                    id=category_id,
                    active=True,
                )

            except QuizCategory.DoesNotExist:

                return Response(
                    {
                        "detail": (
                            "Catégorie introuvable."
                        )
                    },
                    status=status.HTTP_404_NOT_FOUND,
                )

        # --------------------------------------------------
        # QUESTIONS
        # --------------------------------------------------

        questions_query = QuizQuestion.objects.filter(
            active=True,
        )

        if category:
            questions_query = questions_query.filter(
                category=category,
            )

        questions = list(
            questions_query
            .select_related("category")
            .prefetch_related("answers")
        )

        if not questions:

            return Response(
                {
                    "detail": (
                        "Aucune question disponible "
                        "pour ce quiz."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Mélange aléatoire
        random.shuffle(questions)

        questions = questions[
            :min(question_count, len(questions))
        ]

        # --------------------------------------------------
        # SESSION
        # --------------------------------------------------

        session = QuizSession.objects.create(
            user=request.user,
            category=category,
            total_questions=len(questions),
            time_limit_seconds=time_limit_seconds,
        )

        # Enregistrer les questions tirées
        # dans cette session
        session.questions.set(questions)

        serializer = QuizQuestionSerializer(
            questions,
            many=True,
            context={
                "request": request,
                "quiz_session": session,
            },
        )

        return Response(
            {
                "session": QuizSessionSerializer(
                    session
                ).data,

                "questions": serializer.data,
            },
            status=status.HTTP_201_CREATED,
        )


# ==========================================================
# QUESTION D'UNE SESSION
# ==========================================================

class QuizSessionQuestionView(APIView):
    """
    GET /api/quiz/sessions/<session_id>/question/<question_id>/
    """

    permission_classes = [IsAuthenticated]

    def get(
        self,
        request,
        session_id,
        question_id,
    ):

        try:

            session = QuizSession.objects.get(
                id=session_id,
                user=request.user,
            )

        except QuizSession.DoesNotExist:

            return Response(
                {
                    "detail": "Session introuvable."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        if session.status != (
            QuizSession.Status.IN_PROGRESS
        ):

            return Response(
                {
                    "detail": (
                        "Cette session n'est plus "
                        "active."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        question = (
            session.questions
            .select_related("category")
            .prefetch_related("answers")
            .filter(
                id=question_id,
                active=True,
            )
            .first()
        )

        if not question:

            return Response(
                {
                    "detail": (
                        "Cette question ne fait pas "
                        "partie de cette session."
                    )
                },
                status=status.HTTP_404_NOT_FOUND,
            )

       
        # On accepte la question si elle est encore
        # disponible dans la session.

        serializer = QuizQuestionSerializer(
            question,
            context={
                "quiz_session": session,
                "request": request,
            },
        )

        return Response(
            serializer.data
        )


# ==========================================================
# RÉPONDRE
# ==========================================================

class QuizSubmitAnswerView(APIView):
    """
    POST /api/quiz/sessions/<session_id>/answer/

    {
        "question_id": 1,
        "answer_id": 4
    }
    """

    permission_classes = [IsAuthenticated]
    @transaction.atomic
    def post(self, request, session_id):

        serializer = QuizAnswerSubmitSerializer(
            data=request.data
        )

        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST,
            )

        question_id = serializer.validated_data[
            "question_id"
        ]

        answer_id = serializer.validated_data[
            "answer_id"
        ]

        # --------------------------------------------------
        # SESSION
        # --------------------------------------------------

        try:
            session = (
                QuizSession.objects
                .select_for_update()
                .get(
                    id=session_id,
                    user=request.user,
                )
            )

        except QuizSession.DoesNotExist:

            return Response(
                {
                    "detail": "Session introuvable."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        # --------------------------------------------------
        # SESSION ACTIVE ?
        # --------------------------------------------------

        if session.status != QuizSession.Status.IN_PROGRESS:

            return Response(
                {
                    "detail": (
                        "Cette session n'est plus active."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # --------------------------------------------------
        # MINUTEUR
        # --------------------------------------------------

        deadline = (
            session.started_at
            + timedelta(
                seconds=session.time_limit_seconds
            )
        )

        now = timezone.now()

        if now >= deadline:

            session.status = (
                QuizSession.Status.TIME_EXPIRED
            )

            session.completed_at = now

            session.save(
                update_fields=[
                    "status",
                    "completed_at",
                ]
            )

            return Response(
                {
                    "detail": (
                        "Le temps imparti pour ce quiz "
                        "est écoulé."
                    ),
                    "completed": True,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # --------------------------------------------------
        # QUESTION
        # --------------------------------------------------

        try:

            question = (
                session.questions
                .prefetch_related("answers")
                .get(
                    id=question_id,
                    active=True,
                )
            )

        except QuizQuestion.DoesNotExist:

            return Response(
                {
                    "detail": (
                        "Cette question "
                        "n'appartient pas à cette session."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # --------------------------------------------------
        # EMPÊCHER DOUBLE RÉPONSE
        # --------------------------------------------------

        if QuizUserAnswer.objects.filter(
            session=session,
            question=question,
        ).exists():

            return Response(
                {
                    "detail": (
                        "Vous avez déjà répondu "
                        "à cette question."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # --------------------------------------------------
        # RÉPONSE
        # --------------------------------------------------

        try:

            answer = QuizAnswer.objects.get(
                id=answer_id,
                question=question,
            )

        except QuizAnswer.DoesNotExist:

            return Response(
                {
                    "detail": (
                        "Cette réponse "
                        "n'appartient pas à la question."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # --------------------------------------------------
        # CALCUL
        # --------------------------------------------------

        is_correct = answer.is_correct

        points = (
            question.xp_reward
            if is_correct
            else 0
        )

        # --------------------------------------------------
        # ENREGISTRER
        # --------------------------------------------------

        QuizUserAnswer.objects.create(
            session=session,
            question=question,
            selected_answer=answer,
            is_correct=is_correct,
            points_earned=points,
        )

        session.answered_questions += 1

        if is_correct:
            session.correct_answers += 1

        session.score += points
        session.xp_earned += points

        session.save(
            update_fields=[
                "answered_questions",
                "correct_answers",
                "score",
                "xp_earned",
            ]
        )

        # --------------------------------------------------
        # QUIZ TERMINÉ ?
        # --------------------------------------------------

        completed = (
            session.answered_questions
            >= session.total_questions
        )

        # --------------------------------------------------
        # RÉPONSE
        # --------------------------------------------------

        correct_answer = (
            question.answers
            .filter(is_correct=True)
            .values_list(
                "id",
                flat=True,
            )
            .first()
        )

        return Response(
            {
                "correct": is_correct,
                "points_earned": points,
                "explanation": question.explanation,
                "correct_answer_id": correct_answer,

                "session": QuizSessionSerializer(
                    session
                ).data,

                "completed": completed,
            },
            status=status.HTTP_200_OK,
        )

# ==========================================================
# TERMINER UNE SESSION
# ==========================================================

class QuizCompleteView(APIView):
    """
    POST /api/quiz/sessions/<session_id>/complete/

    Termine un quiz même si certaines questions
    n'ont pas reçu de réponse.

    Une question non répondue (ex: temps écoulé)
    est considérée comme une question ratée et
    rapporte 0 point / 0 XP.
    """

    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request, session_id):

        # ==================================================
        # RÉCUPÉRER LA SESSION
        # ==================================================

        try:
            session = (
                QuizSession.objects
                .select_for_update()
                .get(
                    id=session_id,
                    user=request.user,
                )
            )

        except QuizSession.DoesNotExist:

            return Response(
                {
                    "detail": "Session introuvable."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        # ==================================================
        # VÉRIFIER LE STATUT
        # ==================================================

        if session.status != QuizSession.Status.IN_PROGRESS:

            return Response(
                {
                    "detail": (
                        "Cette session n'est plus active."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ==================================================
        # VÉRIFIER LE TEMPS GLOBAL DU QUIZ
        # ==================================================
        #
        # ATTENTION :
        # Ton frontend possède un timer par question.
        #
        # Si time_limit_seconds correspond au temps global
        # de la session, cette vérification reste valable.
        #
        # Si tu n'utilises PAS de limite globale côté backend,
        # tu peux supprimer complètement cette section.
        # ==================================================

        deadline = (
            session.started_at
            + timedelta(
                seconds=session.time_limit_seconds
            )
        )

        if timezone.now() >= deadline:

            session.status = (
                QuizSession.Status.TIME_EXPIRED
            )

            session.completed_at = timezone.now()

            session.save(
                update_fields=[
                    "status",
                    "completed_at",
                ]
            )

            return Response(
                {
                    "session": QuizSessionSerializer(
                        session
                    ).data,

                    "progress": None,

                    "message": (
                        "Le temps imparti pour ce quiz "
                        "est écoulé."
                    ),
                },
                status=status.HTTP_200_OK,
            )

        # ==================================================
        # IMPORTANT :
        # ON NE VÉRIFIE PLUS QUE TOUTES LES QUESTIONS
        # ONT ÉTÉ RÉPONDUES.
        #
        # Une question sans réponse est autorisée.
        #
        # Exemple :
        #
        # 5 questions
        # 3 répondues
        # 2 non répondues
        #
        # => le quiz peut être terminé.
        # ==================================================

        session.status = (
            QuizSession.Status.COMPLETED
        )

        session.completed_at = timezone.now()

        session.save(
            update_fields=[
                "status",
                "completed_at",
            ]
        )

        # ==================================================
        # PROGRESSION UTILISATEUR
        # ==================================================

        progress, created = (
            QuizProgress.objects.get_or_create(
                user=request.user,
            )
        )

        progress.total_quizzes += 1

        progress.completed_quizzes += 1

        # --------------------------------------------------
        # IMPORTANT
        #
        # On compte TOUTES les questions du quiz,
        # y compris celles qui n'ont pas reçu de réponse.
        #
        # Exemple :
        # total_questions = 5
        # answered_questions = 3
        #
        # progress.total_questions += 5
        # --------------------------------------------------

        progress.total_questions += (
            session.total_questions
        )

        progress.correct_answers += (
            session.correct_answers
        )

        progress.xp += session.xp_earned

        # ==================================================
        # NIVEAU
        # ==================================================

        progress.level = (
            progress.xp // 100
        ) + 1

        # ==================================================
        # STREAK
        # ==================================================

        today = timezone.localdate()

        if progress.last_quiz_date:

            difference = (
                today
                - progress.last_quiz_date
            ).days

            if difference == 1:

                progress.current_streak += 1

            elif difference > 1:

                progress.current_streak = 1

            # Même jour :
            # on conserve la série actuelle.

        else:

            progress.current_streak = 1

        progress.best_streak = max(
            progress.best_streak,
            progress.current_streak,
        )

        progress.last_quiz_date = today

        progress.save()

        # ==================================================
        # BADGES
        # ==================================================

        QuizViewSetLikeAwardBadges.award_badges(
            request.user,
            progress,
        )

        # ==================================================
        # RÉPONSE FINALE
        # ==================================================

        return Response(
            {
                "session": QuizSessionSerializer(
                    session
                ).data,

                "progress": QuizProgressSerializer(
                    progress
                ).data,

                "message": (
                    "Quiz terminé ! 🎉"
                ),
            },
            status=status.HTTP_200_OK,
        )

# ==========================================================
# ABANDONNER
# ==========================================================

class QuizAbandonView(APIView):
    """
    POST /api/quiz/sessions/<session_id>/abandon/
    """

    permission_classes = [IsAuthenticated]

    def post(self, request, session_id):

        try:

            session = QuizSession.objects.get(
                id=session_id,
                user=request.user,
            )

        except QuizSession.DoesNotExist:

            return Response(
                {
                    "detail": "Session introuvable."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        if session.status != (
            QuizSession.Status.IN_PROGRESS
        ):

            return Response(
                {
                    "detail": (
                        "Cette session n'est plus active."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        session.status = (
            QuizSession.Status.ABANDONED
        )

        session.save(
            update_fields=[
                "status",
            ]
        )

        return Response(
            {
                "message": "Quiz abandonné.",
                "session": QuizSessionSerializer(
                    session
                ).data,
            }
        )


# ==========================================================
# PROGRESSION
# ==========================================================

class QuizProgressView(APIView):
    """
    GET /api/quiz/progress/
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):

        progress, created = (
            QuizProgress.objects.get_or_create(
                user=request.user,
            )
        )

        serializer = QuizProgressSerializer(
            progress
        )

        return Response(
            serializer.data
        )


# ==========================================================
# HISTORIQUE
# ==========================================================

class QuizHistoryView(APIView):
    """
    GET /api/quiz/history/
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):

        sessions = (
            QuizSession.objects
            .filter(user=request.user)
            .select_related("category")
            .order_by("-started_at")
        )

        serializer = QuizSessionSerializer(
            sessions,
            many=True,
        )

        return Response(
            serializer.data
        )


# ==========================================================
# BADGES
# ==========================================================

class QuizBadgeListView(APIView):
    """
    GET /api/quiz/badges/
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):

        badges = (
            QuizBadge.objects
            .filter(active=True)
            .order_by("id")
        )

        serializer = QuizBadgeSerializer(
            badges,
            many=True,
        )

        return Response(
            serializer.data
        )


# ==========================================================
# MES BADGES
# ==========================================================

class QuizMyBadgesView(APIView):
    """
    GET /api/quiz/my-badges/
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):

        badges = (
            QuizUserBadge.objects
            .filter(user=request.user)
            .select_related("badge")
        )

        serializer = QuizUserBadgeSerializer(
            badges,
            many=True,
        )

        return Response(
            serializer.data
        )


# ==========================================================
# ATTRIBUTION DES BADGES
# ==========================================================

class QuizViewSetLikeAwardBadges:

    @staticmethod
    def award_badges(user, progress):

        # --------------------------------------------------
        # PREMIER QUIZ
        # --------------------------------------------------

        if progress.completed_quizzes >= 1:

            QuizViewSetLikeAwardBadges._award(
                user,
                "FIRST_QUIZ",
            )

        # --------------------------------------------------
        # 10 QUIZ
        # --------------------------------------------------

        if progress.completed_quizzes >= 10:

            QuizViewSetLikeAwardBadges._award(
                user,
                "QUIZ_10",
            )

        # --------------------------------------------------
        # 100 XP
        # --------------------------------------------------

        if progress.xp >= 100:

            QuizViewSetLikeAwardBadges._award(
                user,
                "XP_100",
            )

        # --------------------------------------------------
        # STREAK 7
        # --------------------------------------------------

        if progress.best_streak >= 7:

            QuizViewSetLikeAwardBadges._award(
                user,
                "STREAK_7",
            )

    @staticmethod
    def _award(user, code):

        try:

            badge = QuizBadge.objects.get(
                code=code,
                active=True,
            )

        except QuizBadge.DoesNotExist:

            return

        QuizUserBadge.objects.get_or_create(
            user=user,
            badge=badge,
        )