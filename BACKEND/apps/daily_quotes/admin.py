from django.contrib import admin

# Register your models here.
from django.contrib import admin

from .models import DailyQuote


@admin.register(DailyQuote)
class DailyQuoteAdmin(admin.ModelAdmin):
    list_display = (
        "date",
        "moment",
        "author",
        "source",
        "is_active",
        "notification_enabled",
    )

    list_filter = (
        "moment",
        "is_active",
        "notification_enabled",
        "date",
        "author",
    )

    search_fields = (
        "text",
        "author",
        "source",
        "source_reference",
        "baha_i_month",
    )

    ordering = (
        "date",
        "moment",
    )

    list_editable = (
        "is_active",
        "notification_enabled",
    )

    date_hierarchy = "date"

    readonly_fields = (
        "created_at",
        "updated_at",
    )

    fieldsets = (
        (
            "📖 Citation",
            {
                "fields": (
                    "text",
                    "author",
                    "source",
                    "source_reference",
                ),
            },
        ),
        (
            "📅 Calendrier",
            {
                "fields": (
                    "date",
                    "baha_i_day",
                    "baha_i_month",
                    "moment",
                ),
            },
        ),
        (
            "⚙️ État",
            {
                "fields": (
                    "is_active",
                    "notification_enabled",
                ),
            },
        ),
        (
            "ℹ️ Informations système",
            {
                "fields": (
                    "created_at",
                    "updated_at",
                ),
                "classes": (
                    "collapse",
                ),
            },
        ),
    )