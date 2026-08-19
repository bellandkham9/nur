from rest_framework import serializers

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


# ==========================================================
# CATÉGORIE
# ==========================================================

class QuizCategorySerializer(serializers.ModelSerializer):
    question_count = serializers.SerializerMethodField()

    class Meta:
        model = QuizCategory

        fields = [
            "id",
            "name",
            "code",
            "description",
            "icon",
            "color",
            "question_count",
        ]

        read_only_fields = [
            "id",
            "question_count",
        ]

    def get_question_count(self, obj):
        return obj.questions.filter(
            active=True
        ).count()


# ==========================================================
# RÉPONSE PUBLIQUE
# ==========================================================

class QuizAnswerSerializer(serializers.ModelSerializer):
    """
    Réponse envoyée au frontend.

    IMPORTANT :
    is_correct n'est jamais exposé ici.
    """

    class Meta:
        model = QuizAnswer

        fields = [
            "id",
            "text",
            "order",
        ]

        read_only_fields = [
            "id",
            "order",
        ]


# ==========================================================
# QUESTION
# ==========================================================

class QuizQuestionSerializer(serializers.ModelSerializer):

    category_name = serializers.CharField(
        source="category.name",
        read_only=True,
    )

    answers = QuizAnswerSerializer(
        many=True,
        read_only=True,
    )

    image_url = serializers.SerializerMethodField()

    answered = serializers.SerializerMethodField()

    selected_answer_id = serializers.SerializerMethodField()

    class Meta:
        model = QuizQuestion

        fields = [
            "id",
            "category",
            "category_name",
            "question",
            "difficulty",
            "image_url",
            "audio_url",
            "xp_reward",
            "answers",
            "selected_answer_id",
            "answered",
        ]

        read_only_fields = [
            "id",
            "category_name",
            "answers",
            "image_url",
            "selected_answer_id",
            "answered",
        ]

    def get_image_url(self, obj):

        if not obj.image:
            return None

        request = self.context.get("request")

        if request:
            return request.build_absolute_uri(
                obj.image.url
            )

        return obj.image.url

    def get_answered(self, obj):

        request = self.context.get("request")

        if (
            not request
            or not request.user.is_authenticated
        ):
            return False

        session = self.context.get(
            "quiz_session"
        )

        if not session:
            return False

        return QuizUserAnswer.objects.filter(
            session=session,
            question=obj,
        ).exists()

    def get_selected_answer_id(self, obj):

        request = self.context.get("request")

        if (
            not request
            or not request.user.is_authenticated
        ):
            return None

        session = self.context.get(
            "quiz_session"
        )

        if not session:
            return None

        user_answer = (
            QuizUserAnswer.objects
            .filter(
                session=session,
                question=obj,
            )
            .first()
        )

        if not user_answer:
            return None

        return user_answer.selected_answer_id


# ==========================================================
# SESSION
# ==========================================================

class QuizSessionSerializer(serializers.ModelSerializer):

    category_name = serializers.CharField(
        source="category.name",
        read_only=True,
    )

    status_display = serializers.CharField(
        source="get_status_display",
        read_only=True,
    )

    accuracy = serializers.SerializerMethodField()

    class Meta:
        model = QuizSession

        fields = [
            "id",
            "category",
            "category_name",
            "status",
            "status_display",

            "total_questions",
            "answered_questions",
            "correct_answers",

            "score",
            "xp_earned",
            "accuracy",

            "time_limit_seconds",

            "started_at",
            "completed_at",
        ]

        read_only_fields = [
            "id",
            "category_name",
            "status",
            "status_display",

            "total_questions",
            "answered_questions",
            "correct_answers",

            "score",
            "xp_earned",
            "accuracy",

            "time_limit_seconds",

            "started_at",
            "completed_at",
        ]

    def get_accuracy(self, obj):

        if obj.answered_questions == 0:
            return 0

        return round(
            (
                obj.correct_answers
                / obj.answered_questions
            ) * 100,
            1,
        )


# ==========================================================
# RÉPONSE UTILISATEUR
# ==========================================================

class QuizUserAnswerSerializer(serializers.ModelSerializer):

    question_text = serializers.CharField(
        source="question.question",
        read_only=True,
    )

    selected_answer_text = serializers.CharField(
        source="selected_answer.text",
        read_only=True,
    )

    class Meta:
        model = QuizUserAnswer

        fields = [
            "id",
            "session",
            "question",
            "question_text",
            "selected_answer",
            "selected_answer_text",
            "is_correct",
            "points_earned",
            "answered_at",
        ]

        read_only_fields = [
            "id",
            "session",
            "question_text",
            "selected_answer_text",
            "is_correct",
            "points_earned",
            "answered_at",
        ]


# ==========================================================
# SOUMISSION D'UNE RÉPONSE
# ==========================================================

class QuizAnswerSubmitSerializer(serializers.Serializer):

    question_id = serializers.IntegerField()

    answer_id = serializers.IntegerField()


# ==========================================================
# PROGRESSION
# ==========================================================

class QuizProgressSerializer(serializers.ModelSerializer):

    accuracy = serializers.ReadOnlyField()

    class Meta:
        model = QuizProgress

        fields = [
            "id",
            "xp",
            "level",
            "total_quizzes",
            "completed_quizzes",
            "total_questions",
            "correct_answers",
            "accuracy",
            "current_streak",
            "best_streak",
            "last_quiz_date",
            "created_at",
            "updated_at",
        ]

        read_only_fields = fields


# ==========================================================
# BADGE
# ==========================================================

class QuizBadgeSerializer(serializers.ModelSerializer):

    class Meta:
        model = QuizBadge

        fields = [
            "id",
            "name",
            "code",
            "description",
            "icon",
            "xp_reward",
        ]

        read_only_fields = fields


# ==========================================================
# BADGE UTILISATEUR
# ==========================================================

class QuizUserBadgeSerializer(serializers.ModelSerializer):

    badge = QuizBadgeSerializer(
        read_only=True,
    )

    class Meta:
        model = QuizUserBadge

        fields = [
            "id",
            "badge",
            "obtained_at",
        ]

        read_only_fields = fields