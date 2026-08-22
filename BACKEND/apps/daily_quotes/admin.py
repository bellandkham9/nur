from django.contrib import admin
from django.utils.html import format_html
from django.utils.safestring import mark_safe
from .models import DailyQuote


@admin.register(DailyQuote)
class DailyQuoteAdmin(admin.ModelAdmin):

    # ==========================================================
    # LISTE
    # ==========================================================

    list_display = (
        "date",
        "moment_badge",
        "quote_preview",
        "author",
        "source",
        "status_badge",
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

    list_per_page = 30

    date_hierarchy = "date"

    # ==========================================================
    # MODIFICATION DIRECTE
    # ==========================================================

    list_editable = (
        "notification_enabled",
    )

    # ==========================================================
    # CHAMPS LECTURE SEULE
    # ==========================================================

    readonly_fields = (
        "created_at",
        "updated_at",
    )

    # ==========================================================
    # FORMULAIRE
    # ==========================================================

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

    # ==========================================================
    # ACTIONS
    # ==========================================================

    actions = (
        "activate_quotes",
        "deactivate_quotes",
        "enable_notifications",
        "disable_notifications",
    )

    @admin.action(description="✅ Activer les citations sélectionnées")
    def activate_quotes(self, request, queryset):

        updated = queryset.update(
            is_active=True
        )

        self.message_user(
            request,
            f"{updated} citation(s) activée(s).",
        )

    @admin.action(description="⛔ Désactiver les citations sélectionnées")
    def deactivate_quotes(self, request, queryset):

        updated = queryset.update(
            is_active=False
        )

        self.message_user(
            request,
            f"{updated} citation(s) désactivée(s).",
        )

    @admin.action(description="🔔 Activer les notifications")
    def enable_notifications(self, request, queryset):

        updated = queryset.update(
            notification_enabled=True
        )

        self.message_user(
            request,
            f"Notifications activées pour {updated} citation(s).",
        )

    @admin.action(description="🔕 Désactiver les notifications")
    def disable_notifications(self, request, queryset):

        updated = queryset.update(
            notification_enabled=False
        )

        self.message_user(
            request,
            f"Notifications désactivées pour {updated} citation(s).",
        )

    # ==========================================================
    # AFFICHAGE PERSONNALISÉ
    # ==========================================================

    @admin.display(
        description="Moment",
        ordering="moment",
    )
    def moment_badge(self, obj):

        if obj.moment == "MORNING":
            return mark_safe(
                '<span class="nur-badge nur-morning">'
                "🌅 Matin"
                "</span>"
            )

        if obj.moment == "EVENING":
            return mark_safe(
                '<span class="nur-badge nur-evening">'
                "🌙 Soir"
                "</span>"
            )

        return obj.moment
    @admin.display(
        description="Citation",
    )
    def quote_preview(self, obj):

        text = obj.text or ""

        if len(text) > 100:
            text = text[:100] + "…"

        return format_html(
            '<span class="nur-quote-preview">{}</span>',
            text,
        )

    @admin.display(
        description="État",
    )
    def status_badge(self, obj):

        if obj.is_active:
            return mark_safe(
                '<span class="nur-status nur-status-active">'
                "● Active"
                "</span>"
            )

        return mark_safe(
            '<span class="nur-status nur-status-inactive">'
            "● Inactive"
            "</span>"
        )