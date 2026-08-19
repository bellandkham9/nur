from django.urls import path

from .views import (
    QuizCategoryListView,
    QuizStartView,
    QuizSessionQuestionView,
    QuizSubmitAnswerView,
    QuizCompleteView,
    QuizAbandonView,
    QuizProgressView,
    QuizHistoryView,
    QuizBadgeListView,
    QuizMyBadgesView,
)


urlpatterns = [

    # ======================================================
    # CATÉGORIES
    # ======================================================

    path(
        "categories/",
        QuizCategoryListView.as_view(),
        name="quiz-categories",
    ),

    # ======================================================
    # DÉMARRER UN QUIZ
    # ======================================================

    path(
        "start/",
        QuizStartView.as_view(),
        name="quiz-start",
    ),

    # ======================================================
    # RÉCUPÉRER UNE QUESTION
    # ======================================================

    path(
        "sessions/<int:session_id>/question/<int:question_id>/",
        QuizSessionQuestionView.as_view(),
        name="quiz-session-question",
    ),

    # ======================================================
    # RÉPONDRE
    # ======================================================

    path(
        "sessions/<int:session_id>/answer/",
        QuizSubmitAnswerView.as_view(),
        name="quiz-submit-answer",
    ),

    # ======================================================
    # TERMINER
    # ======================================================

    path(
        "sessions/<int:session_id>/complete/",
        QuizCompleteView.as_view(),
        name="quiz-complete",
    ),

    # ======================================================
    # ABANDONNER
    # ======================================================

    path(
        "sessions/<int:session_id>/abandon/",
        QuizAbandonView.as_view(),
        name="quiz-abandon",
    ),

    # ======================================================
    # PROGRESSION
    # ======================================================

    path(
        "progress/",
        QuizProgressView.as_view(),
        name="quiz-progress",
    ),

    # ======================================================
    # HISTORIQUE
    # ======================================================

    path(
        "history/",
        QuizHistoryView.as_view(),
        name="quiz-history",
    ),

    # ======================================================
    # BADGES
    # ======================================================

    path(
        "badges/",
        QuizBadgeListView.as_view(),
        name="quiz-badges",
    ),

    path(
        "my-badges/",
        QuizMyBadgesView.as_view(),
        name="quiz-my-badges",
    ),
]