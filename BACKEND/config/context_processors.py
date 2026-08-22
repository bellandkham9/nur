from django.contrib.auth import get_user_model


def nur_stats(request):
    """
    Statistiques affichées dans le dashboard NUR.
    """

    from apps.quiz.models import QuizCategory, QuizQuestion
    from apps.daily_quotes.models import DailyQuote
    from apps.communities.models import Community

    User = get_user_model()

    return {
        "nur_stats": {
            "users": User.objects.count(),
            "questions": QuizQuestion.objects.count(),
            "quotes": DailyQuote.objects.count(),
            "communities": Community.objects.count(),
            "categories": QuizCategory.objects.count(),
        }
    }