from django.contrib import admin

# Register your models here.
from django.contrib import admin

from .models import (
    Activity,
    ActivityParticipant,
    ActivityType,
)


@admin.register(ActivityType)
class ActivityTypeAdmin(admin.ModelAdmin):

    list_display = (
        'name',
        'code',
        'active',
        'requires_confirmation',
    )

    list_filter = (
        'active',
        'requires_confirmation',
    )

    search_fields = (
        'name',
        'code',
    )


@admin.register(Activity)
class ActivityAdmin(admin.ModelAdmin):

    list_display = (
        'title',
        'activity_type',
        'community',
        'start_datetime',
        'status',
        'organizer',
    )

    list_filter = (
        'status',
        'activity_type',
        'community',
        'is_online',
    )

    search_fields = (
        'title',
        'description',
        'location_name',
    )

    date_hierarchy = 'start_datetime'


@admin.register(ActivityParticipant)
class ActivityParticipantAdmin(admin.ModelAdmin):

    list_display = (
        'activity',
        'user',
        'status',
        'invited_at',
        'responded_at',
    )

    list_filter = (
        'status',
        'activity',
    )

    search_fields = (
        'user__username',
        'activity__title',
    )