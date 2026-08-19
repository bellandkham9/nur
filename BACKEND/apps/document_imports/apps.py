from django.apps import AppConfig


class DocumentImportsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.document_imports"
    verbose_name = "Importation de documents"