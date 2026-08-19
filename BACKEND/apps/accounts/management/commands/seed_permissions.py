from django.core.management.base import BaseCommand

from apps.accounts.models import (
    Permission,
    Role,
    RolePermission,
)


PERMISSIONS = [

    # Utilisateurs
    ('VIEW_PROFILE', 'Voir son profil'),
    ('EDIT_OWN_PROFILE', 'Modifier son profil'),

    ('VIEW_USERS', 'Voir les utilisateurs'),
    ('CREATE_USER', 'Créer un utilisateur'),
    ('EDIT_USER', 'Modifier un utilisateur'),
    ('DISABLE_USER', 'Désactiver un utilisateur'),
    ('ASSIGN_ROLE', 'Attribuer un rôle'),

    # Activités
    ('VIEW_ACTIVITIES', 'Voir les activités'),
    ('CREATE_ACTIVITY', 'Créer une activité'),
    ('EDIT_ACTIVITY', 'Modifier une activité'),
    ('DELETE_ACTIVITY', 'Supprimer une activité'),
    ('VALIDATE_ACTIVITY', 'Valider une activité'),
    ('PUBLISH_ACTIVITY', 'Publier une activité'),

    # Plans
    ('VIEW_PLANS', 'Voir les plans'),
    ('IMPORT_PLAN', 'Importer un plan'),
    ('PROCESS_PLAN', 'Analyser un plan'),
    ('VALIDATE_PLAN', 'Valider un plan'),
    ('PUBLISH_PLAN', 'Publier un plan'),
    ('ARCHIVE_PLAN', 'Archiver un plan'),

    # Calendrier
    ('VIEW_CALENDAR', 'Voir le calendrier'),
    ('MANAGE_HOLY_DAYS', 'Gérer les jours saints'),
    ('MANAGE_FEASTS', 'Gérer les fêtes'),
    ('MANAGE_BADI_CALENDAR', 'Gérer le calendrier bahá’í'),

    # Notifications
    ('VIEW_NOTIFICATIONS', 'Voir les notifications'),
    ('CREATE_NOTIFICATION', 'Créer une notification'),
    ('SCHEDULE_NOTIFICATION', 'Programmer une notification'),
    ('SEND_NOTIFICATION', 'Envoyer une notification'),
    ('MANAGE_NOTIFICATION_TEMPLATES', 'Gérer les modèles'),
    ('VIEW_NOTIFICATION_HISTORY', 'Voir l’historique'),

    # Contenu
    ('VIEW_WRITINGS', 'Voir les écrits'),
    ('CREATE_WRITING', 'Créer un écrit'),
    ('EDIT_WRITING', 'Modifier un écrit'),
    ('DELETE_WRITING', 'Supprimer un écrit'),

    ('VIEW_BOOKS', 'Voir les livres'),
    ('MANAGE_BOOKS', 'Gérer les livres'),

    ('VIEW_PRAYERS', 'Voir les prières'),
    ('MANAGE_PRAYERS', 'Gérer les prières'),

    # Quiz
    ('TAKE_QUIZ', 'Participer aux quiz'),
    ('CREATE_QUIZ', 'Créer un quiz'),
    ('EDIT_QUIZ', 'Modifier un quiz'),
    ('DELETE_QUIZ', 'Supprimer un quiz'),
    ('VIEW_QUIZ_STATISTICS', 'Voir les statistiques des quiz'),

    # Engagement
    ('VIEW_ENGAGEMENT', 'Voir son engagement'),
    ('MANAGE_BADGES', 'Gérer les badges'),
    ('VIEW_STATISTICS', 'Voir les statistiques'),
]


ROLES = [
    ('VISITOR', 'Visiteur'),
    ('MEMBER', 'Membre'),
    ('ANIMATOR', 'Animateur'),
    ('RESPONSIBLE', 'Responsable'),
    ('COORDINATOR', 'Coordinateur'),
    ('SECRETARY', 'Secrétaire'),
    ('ADMIN', 'Administrateur'),
]


class Command(BaseCommand):

    help = 'Crée les permissions et rôles par défaut'

    def handle(self, *args, **options):

        permissions = {}

        for code, name in PERMISSIONS:

            permission, created = Permission.objects.get_or_create(
                code=code,
                defaults={
                    'name': name,
                }
            )

            permissions[code] = permission

            if created:
                self.stdout.write(
                    self.style.SUCCESS(
                        f'Permission créée : {code}'
                    )
                )

        roles = {}

        for code, name in ROLES:

            role, created = Role.objects.get_or_create(
                code=code,
                defaults={
                    'name': name,
                }
            )

            roles[code] = role

            if created:
                self.stdout.write(
                    self.style.SUCCESS(
                        f'Rôle créé : {code}'
                    )
                )

        self.assign_permissions(
            roles,
            permissions
        )

        self.stdout.write(
            self.style.SUCCESS(
                'Permissions et rôles initialisés avec succès.'
            )
        )

    def assign_permissions(self, roles, permissions):

        member_permissions = [
            'VIEW_PROFILE',
            'EDIT_OWN_PROFILE',
            'VIEW_ACTIVITIES',
            'VIEW_CALENDAR',
            'VIEW_WRITINGS',
            'VIEW_BOOKS',
            'VIEW_PRAYERS',
            'TAKE_QUIZ',
            'VIEW_NOTIFICATIONS',
            'VIEW_ENGAGEMENT',
        ]

        animator_permissions = member_permissions + [
            'CREATE_ACTIVITY',
            'EDIT_ACTIVITY',
            'VALIDATE_ACTIVITY',
            'VIEW_NOTIFICATION_HISTORY',
        ]

        responsible_permissions = animator_permissions + [
            'IMPORT_PLAN',
            'PROCESS_PLAN',
            'VALIDATE_PLAN',
            'PUBLISH_PLAN',
            'ARCHIVE_PLAN',
            'CREATE_NOTIFICATION',
            'SCHEDULE_NOTIFICATION',
            'SEND_NOTIFICATION',
        ]

        coordinator_permissions = responsible_permissions + [
            'MANAGE_HOLY_DAYS',
            'MANAGE_FEASTS',
            'VIEW_STATISTICS',
            'PUBLISH_ACTIVITY',
        ]

        secretary_permissions = coordinator_permissions + [
            'VIEW_USERS',
            'EDIT_USER',
            'MANAGE_BADI_CALENDAR',
            'MANAGE_NOTIFICATION_TEMPLATES',
        ]

        role_permissions = {
            'VISITOR': [
                'VIEW_CALENDAR',
                'VIEW_WRITINGS',
                'VIEW_BOOKS',
                'VIEW_PRAYERS',
                'TAKE_QUIZ',
            ],

            'MEMBER': member_permissions,

            'ANIMATOR': animator_permissions,

            'RESPONSIBLE': responsible_permissions,

            'COORDINATOR': coordinator_permissions,

            'SECRETARY': secretary_permissions,

            'ADMIN': list(permissions.keys()),
        }

        for role_code, permission_codes in role_permissions.items():

            role = roles[role_code]

            for permission_code in permission_codes:

                permission = permissions[permission_code]

                RolePermission.objects.get_or_create(
                    role=role,
                    permission=permission
                )