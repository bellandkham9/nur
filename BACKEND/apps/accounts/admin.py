from django.contrib import admin

from .models import (
    Profile,
    Permission,
    Role,
    RolePermission,
)


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):

    list_display = (
        'user',
        'display_name',
        'role',
        'language',
        'timezone',
        'created_at',
    )

    list_filter = (
        'role',
        'language',
    )

    search_fields = (
        'user__username',
        'user__email',
        'display_name',
    )


@admin.register(Permission)
class PermissionAdmin(admin.ModelAdmin):

    list_display = (
        'code',
        'name',
        'description',
    )

    search_fields = (
        'code',
        'name',
    )


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):

    list_display = (
        'code',
        'name',
        'description',
    )

    search_fields = (
        'code',
        'name',
    )


@admin.register(RolePermission)
class RolePermissionAdmin(admin.ModelAdmin):

    list_display = (
        'role',
        'permission',
    )

    list_filter = (
        'role',
    )

    search_fields = (
        'role__name',
        'permission__name',
    )