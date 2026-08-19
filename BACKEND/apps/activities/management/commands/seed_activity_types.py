from django.core.management.base import BaseCommand

from apps.activities.models import ActivityType


ACTIVITY_TYPES = [
    {
        'code': 'FEAST',
        'name': 'Fête des 19 jours',
        'icon': '🕊️',
        'description': 'Fête mensuelle des 19 jours.',
    },
    {
        'code': 'HOLY_DAY',
        'name': 'Jour saint',
        'icon': '🌟',
        'description': 'Commémoration d’un jour saint bahá’í.',
    },
    {
        'code': 'DEVOTIONAL',
        'name': 'Réunion de dévotion',
        'icon': '🙏',
        'description': 'Réunion consacrée aux prières et aux textes sacrés.',
    },
    {
        'code': 'STUDY_CIRCLE',
        'name': "Cercle d'étude",
        'icon': '📚',
        'description': "Cercle d'étude et de formation.",
    },
    {
        'code': 'CHILDREN_CLASS',
        'name': 'Classe pour enfants',
        'icon': '👧',
        'description': "Classe d'éducation spirituelle pour enfants.",
    },
    {
        'code': 'JUNIOR_YOUTH',
        'name': 'Groupe de jeunes',
        'icon': '🌱',
        'description': 'Activité destinée aux jeunes adolescents.',
    },
    {
        'code': 'MEETING',
        'name': 'Réunion',
        'icon': '🤝',
        'description': 'Réunion générale ou organisationnelle.',
    },
    {
        'code': 'SERVICE',
        'name': 'Acte de service',
        'icon': '❤️',
        'description': 'Activité ou projet de service à la communauté.',
    },
    {
        'code': 'ADMINISTRATIVE',
        'name': 'Réunion administrative',
        'icon': '📋',
        'description': 'Réunion consacrée à la gestion administrative.',
    },
    {
        'code': 'OTHER',
        'name': 'Autre activité',
        'icon': '📅',
        'description': 'Autre type d’activité.',
    },
]


class Command(BaseCommand):

    help = 'Initialise les types d’activités par défaut.'

    def handle(self, *args, **options):

        created_count = 0
        updated_count = 0

        for data in ACTIVITY_TYPES:

            activity_type, created = ActivityType.objects.update_or_create(
                code=data['code'],
                defaults={
                    'name': data['name'],
                    'icon': data['icon'],
                    'description': data['description'],
                    'active': True,
                }
            )

            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(
                        f"✓ Créé : {activity_type.icon} {activity_type.name}"
                    )
                )
            else:
                updated_count += 1
                self.stdout.write(
                    f"↻ Mis à jour : {activity_type.icon} {activity_type.name}"
                )

        self.stdout.write('')
        self.stdout.write(
            self.style.SUCCESS(
                f'Initialisation terminée : '
                f'{created_count} créé(s), '
                f'{updated_count} mis à jour.'
            )
        )