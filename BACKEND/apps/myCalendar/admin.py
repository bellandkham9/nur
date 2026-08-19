from django.contrib import admin

# Register your models here.
from django.contrib import admin

from .models import CalendarEvent


@admin.register(CalendarEvent)
class CalendarEventAdmin(admin.ModelAdmin):

    list_display = (
        'name',
        'event_type',
        'date',
        'end_date',
        'year',
        'is_holy_day',
        'is_work_suspended',
    )

    list_filter = (
        'event_type',
        'year',
        'is_holy_day',
        'is_work_suspended',
    )

    search_fields = (
        'name',
        'description',
    )

    date_hierarchy = 'date'