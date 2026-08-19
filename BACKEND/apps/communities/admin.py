from django.contrib import admin

from .models import (
    Community,
    CommunityMembership,
)


@admin.register(Community)
class CommunityAdmin(admin.ModelAdmin):

    list_display = (
        'name',
        'country',
        'city',
        'timezone',
        'created_at',
    )

    list_filter = (
        'country',
        'city',
    )

    search_fields = (
        'name',
        'country',
        'city',
    )


@admin.register(CommunityMembership)
class CommunityMembershipAdmin(admin.ModelAdmin):

    list_display = (
        'user',
        'community',
        'role',
        'start_date',
        'end_date',
    )

    list_filter = (
        'community',
        'role',
    )

    search_fields = (
        'user__username',
        'user__email',
        'community__name',
        'role__name',
    )