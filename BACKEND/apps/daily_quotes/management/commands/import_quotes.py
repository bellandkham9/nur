from pathlib import Path

from django.core.management.base import (
    BaseCommand,
    CommandError,
)

from apps.daily_quotes.services.quote_importer import (
    QuoteImporter,
)


class Command(BaseCommand):
    help = (
        "Importe les citations depuis quotes.txt "
        "dans DailyQuote."
    )

    def add_arguments(self, parser):

        parser.add_argument(
            "file_path",
            nargs="?",
            default="quotes.txt",
            help=(
                "Chemin vers le fichier quotes.txt "
                "(défaut : quotes.txt)"
            ),
        )

        parser.add_argument(
            "--year",
            type=int,
            default=2026,
            help=(
                "Année grégorienne de départ "
                "(défaut : 2026)"
            ),
        )

    def handle(self, *args, **options):

        file_path = Path(
            options["file_path"]
        )

        gregorian_year = options["year"]

        # ----------------------------------------------------
        # Vérification du fichier
        # ----------------------------------------------------

        if not file_path.exists():

            raise CommandError(
                f"Fichier introuvable : {file_path}"
            )

        self.stdout.write(
            self.style.NOTICE(
                "=========================================="
            )
        )

        self.stdout.write(
            self.style.NOTICE(
                "      IMPORT DES CITATIONS BAHÁ'ÍES"
            )
        )

        self.stdout.write(
            self.style.NOTICE(
                "=========================================="
            )
        )

        self.stdout.write(
            f"Fichier : {file_path}"
        )

        self.stdout.write(
            f"Année de départ : {gregorian_year}"
        )

        self.stdout.write("")

        # ----------------------------------------------------
        # Import
        # ----------------------------------------------------

        importer = QuoteImporter(
            gregorian_year=gregorian_year
        )

        try:

            result = importer.import_file(
                str(file_path)
            )

        except Exception as exc:

            raise CommandError(
                f"Erreur pendant l'import : {exc}"
            ) from exc

        # ----------------------------------------------------
        # Résultat
        # ----------------------------------------------------

        self.stdout.write("")

        self.stdout.write(
            self.style.SUCCESS(
                "IMPORT TERMINÉ"
            )
        )

        self.stdout.write(
            "------------------------------------------"
        )

        self.stdout.write(
            f"Citations parsées : {result.total_parsed}"
        )

        self.stdout.write(
            self.style.SUCCESS(
                f"Citations créées : {result.created}"
            )
        )

        self.stdout.write(
            f"Citations mises à jour : {result.updated}"
        )

        self.stdout.write(
            f"Citations déjà existantes : {result.skipped}"
        )

        self.stdout.write(
            "------------------------------------------"
        )