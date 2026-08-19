from django.db import models

# Create your models here.
from django.conf import settings
from django.db import models
from django.utils import timezone


# ==========================================================
# CATÉGORIE
# ==========================================================

class QuizCategory(models.Model):
    """
    Catégorie d'une question de quiz.
    """

    name = models.CharField(
        max_length=100,
        unique=True,
    )

    code = models.CharField(
        max_length=50,
        unique=True,
    )

    description = models.TextField(
        blank=True,
    )

    icon = models.CharField(
        max_length=20,
        blank=True,
    )

    color = models.CharField(
        max_length=30,
        blank=True,
    )

    active = models.BooleanField(
        default=True,
    )

    order = models.PositiveIntegerField(
        default=0,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        ordering = ["order", "name"]
        verbose_name = "Catégorie de quiz"
        verbose_name_plural = "Catégories de quiz"

    def __str__(self):
        return self.name


# ==========================================================
# QUESTION
# ==========================================================

class QuizQuestion(models.Model):
    """
    Question du quiz.
    """

    class Difficulty(models.TextChoices):
        EASY = "EASY", "Facile"
        MEDIUM = "MEDIUM", "Moyen"
        HARD = "HARD", "Difficile"

    category = models.ForeignKey(
        QuizCategory,
        on_delete=models.PROTECT,
        related_name="questions",
    )

    question = models.TextField()

    explanation = models.TextField(
        blank=True,
        help_text=(
            "Explication affichée après la réponse."
        ),
    )

    difficulty = models.CharField(
        max_length=20,
        choices=Difficulty.choices,
        default=Difficulty.MEDIUM,
    )

    image = models.ImageField(
        upload_to="quiz/questions/",
        blank=True,
        null=True,
    )

    audio_url = models.URLField(
        blank=True,
        null=True,
    )

    xp_reward = models.PositiveIntegerField(
        default=10,
    )

    active = models.BooleanField(
        default=True,
    )

    order = models.PositiveIntegerField(
        default=0,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        ordering = ["order", "id"]
        verbose_name = "Question de quiz"
        verbose_name_plural = "Questions de quiz"

    def __str__(self):
        return self.question[:80]


# ==========================================================
# RÉPONSE POSSIBLE
# ==========================================================

class QuizAnswer(models.Model):
    """
    Une réponse possible à une question.
    """

    question = models.ForeignKey(
        QuizQuestion,
        on_delete=models.CASCADE,
        related_name="answers",
    )

    text = models.CharField(
        max_length=500,
    )

    is_correct = models.BooleanField(
        default=False,
    )

    order = models.PositiveIntegerField(
        default=0,
    )

    class Meta:
        ordering = ["order", "id"]
        verbose_name = "Réponse de quiz"
        verbose_name_plural = "Réponses de quiz"

    def __str__(self):
        return self.text


# ==========================================================
# SESSION DE QUIZ
# ==========================================================

class QuizSession(models.Model):
    """
    Une partie de quiz jouée par un utilisateur.
    """

    class Status(models.TextChoices):
        IN_PROGRESS = "IN_PROGRESS", "En cours"
        COMPLETED = "COMPLETED", "Terminée"
        ABANDONED = "ABANDONED", "Abandonnée"
        TIME_EXPIRED = "TIME_EXPIRED", "Temps écoulé"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="quiz_sessions",
    )

    category = models.ForeignKey(
        QuizCategory,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="sessions",
    )

    questions = models.ManyToManyField(
        QuizQuestion,
        related_name="quiz_sessions",
        blank=True,
    )
    time_limit_seconds = models.PositiveIntegerField(
        default=300,
        help_text="Durée maximale du quiz en secondes.",
    )
    
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.IN_PROGRESS,
    )

    total_questions = models.PositiveIntegerField(
        default=0,
    )

    answered_questions = models.PositiveIntegerField(
        default=0,
    )

    correct_answers = models.PositiveIntegerField(
        default=0,
    )

    score = models.PositiveIntegerField(
        default=0,
    )

    xp_earned = models.PositiveIntegerField(
        default=0,
    )

    started_at = models.DateTimeField(
        auto_now_add=True,
    )

    completed_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    class Meta:
        ordering = ["-started_at"]
        verbose_name = "Session de quiz"
        verbose_name_plural = "Sessions de quiz"

    def __str__(self):
        return (
            f"{self.user} - "
            f"Quiz #{self.id}"
        )


# ==========================================================
# RÉPONSE DONNÉE PAR L'UTILISATEUR
# ==========================================================

class QuizUserAnswer(models.Model):
    """
    Réponse d'un utilisateur à une question
    pendant une session.
    """

    session = models.ForeignKey(
        QuizSession,
        on_delete=models.CASCADE,
        related_name="user_answers",
    )

    question = models.ForeignKey(
        QuizQuestion,
        on_delete=models.PROTECT,
        related_name="user_answers",
    )

    selected_answer = models.ForeignKey(
        QuizAnswer,
        on_delete=models.PROTECT,
        related_name="user_selections",
    )

    is_correct = models.BooleanField(
        default=False,
    )

    points_earned = models.PositiveIntegerField(
        default=0,
    )

    answered_at = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        ordering = ["answered_at"]
        constraints = [
            models.UniqueConstraint(
                fields=[
                    "session",
                    "question",
                ],
                name="unique_question_per_session",
            ),
        ]
        verbose_name = "Réponse utilisateur"
        verbose_name_plural = "Réponses utilisateur"

    def __str__(self):
        return (
            f"{self.session.user} - "
            f"{self.question_id}"
        )


# ==========================================================
# PROGRESSION UTILISATEUR
# ==========================================================

class QuizProgress(models.Model):
    """
    Progression globale d'un utilisateur
    dans le système de quiz.
    """

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="quiz_progress",
    )

    xp = models.PositiveIntegerField(
        default=0,
    )

    level = models.PositiveIntegerField(
        default=1,
    )

    total_quizzes = models.PositiveIntegerField(
        default=0,
    )

    completed_quizzes = models.PositiveIntegerField(
        default=0,
    )

    total_questions = models.PositiveIntegerField(
        default=0,
    )

    time_limit_seconds = models.PositiveIntegerField(
        default=180,
        help_text="Durée maximale du quiz en secondes.",
    )
    
    correct_answers = models.PositiveIntegerField(
        default=0,
    )

    current_streak = models.PositiveIntegerField(
        default=0,
    )

    best_streak = models.PositiveIntegerField(
        default=0,
    )

    last_quiz_date = models.DateField(
        null=True,
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        verbose_name = "Progression quiz"
        verbose_name_plural = "Progressions quiz"

    def __str__(self):
        return (
            f"{self.user} - "
            f"Niveau {self.level}"
        )

    @property
    def accuracy(self):
        """
        Pourcentage de bonnes réponses.
        """

        if self.total_questions == 0:
            return 0

        return round(
            (
                self.correct_answers
                / self.total_questions
            ) * 100,
            1,
        )


# ==========================================================
# BADGES
# ==========================================================

class QuizBadge(models.Model):
    """
    Badge pouvant être obtenu par un utilisateur.
    """

    name = models.CharField(
        max_length=100,
        unique=True,
    )

    code = models.CharField(
        max_length=50,
        unique=True,
    )

    description = models.TextField()

    icon = models.CharField(
        max_length=20,
        default="🏆",
    )

    xp_reward = models.PositiveIntegerField(
        default=0,
    )

    active = models.BooleanField(
        default=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    def __str__(self):
        return self.name


# ==========================================================
# BADGES UTILISATEUR
# ==========================================================

class QuizUserBadge(models.Model):
    """
    Badge obtenu par un utilisateur.
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="quiz_badges",
    )

    badge = models.ForeignKey(
        QuizBadge,
        on_delete=models.CASCADE,
        related_name="users",
    )

    obtained_at = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=[
                    "user",
                    "badge",
                ],
                name="unique_quiz_badge_per_user",
            ),
        ]
        ordering = ["-obtained_at"]
        verbose_name = "Badge utilisateur"
        verbose_name_plural = "Badges utilisateurs"

    def __str__(self):
        return (
            f"{self.user} - "
            f"{self.badge.name}"
        )