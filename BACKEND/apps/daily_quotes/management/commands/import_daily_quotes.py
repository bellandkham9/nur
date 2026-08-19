from pathlib import Path

from django.core.management.base import BaseCommand, CommandError

from apps.daily_quotes.services.quote_importer import QuoteImporter


class Command(BaseCommand):
    help = "Importe les citations quotidiennes depuis un fichier."

    def add_arguments(self, parser):
        parser.add_argument(
            "file",
            type=str,
            help="Chemin vers le fichier contenant les citations.",
        )

        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Analyse le fichier sans modifier la base.",
        )

    def handle(self, *args, **options):
        file_path = Path(options["file"])

        if not file_path.exists():
            raise CommandError(
                f"Fichier introuvable : {file_path}"
            )

        if not file_path.is_file():
            raise CommandError(
                f"Le chemin indiqué n'est pas un fichier : "
                f"{file_path}"
            )

        self.stdout.write(
            self.style.SUCCESS(
                f"Fichier trouvé : {file_path}"
            )
        )

        if options["dry_run"]:
            self.stdout.write(
                self.style.WARNING(
                    "Mode DRY-RUN : aucune donnée ne sera importée."
                )
            )

        # Le parseur réel sera branché ici
        # après analyse de la structure exacte du fichier.