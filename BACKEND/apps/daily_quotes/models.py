from django.db import models


class DailyQuote(models.Model):

    class Moment(models.TextChoices):
        MORNING = "MORNING", "Matin"
        EVENING = "EVENING", "Soir"

    # ========================================================
    # CONTENU
    # ========================================================

    text = models.TextField()

    author = models.CharField(
        max_length=255,
        blank=True,
    )

    source = models.CharField(
        max_length=255,
    )

    source_reference = models.CharField(
        max_length=255,
        blank=True,
    )

    # ========================================================
    # DATE
    # ========================================================

    date = models.DateField()

    moment = models.CharField(
        max_length=20,
        choices=Moment.choices,
    )

    # ========================================================
    # ÉTAT
    # ========================================================

    is_active = models.BooleanField(
        default=True
    )

    notification_enabled = models.BooleanField(
        default=True
    )

    # ========================================================
    # TIMESTAMPS
    # ========================================================

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    # ========================================================
    # META
    # ========================================================

    class Meta:
        ordering = [
            "date",
            "moment",
        ]

        indexes = [
            models.Index(
                fields=["date", "moment"]
            ),
            models.Index(
                fields=["is_active", "date"]
            ),
        ]

    # ========================================================
    # AFFICHAGE
    # ========================================================

    def __str__(self):
        return (
            f"{self.date} - "
            f"{self.get_moment_display()} - "
            f"{self.author}"
        )