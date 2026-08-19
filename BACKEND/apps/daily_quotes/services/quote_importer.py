from dataclasses import dataclass

from django.db import transaction

from apps.daily_quotes.models import DailyQuote
from apps.daily_quotes.services.quote_parser import (
    QuoteParser,
    ParsedQuote,
)


# ============================================================
# RÉSULTAT DE L'IMPORT
# ============================================================

@dataclass
class ImportResult:
    total_parsed: int = 0
    created: int = 0
    updated: int = 0
    skipped: int = 0


# ============================================================
# IMPORTATEUR
# ============================================================

class QuoteImporter:
    """
    Importe les citations de quotes.txt dans DailyQuote.

    Le parser est responsable de la lecture du fichier.

    L'importateur est responsable de la persistance
    dans la base de données.
    """

    def __init__(
        self,
        gregorian_year: int = 2026,
    ):
        self.parser = QuoteParser(
            gregorian_year=gregorian_year
        )

    # ========================================================
    # IMPORT D'UN FICHIER
    # ========================================================

    @transaction.atomic
    def import_file(
        self,
        file_path: str,
    ) -> ImportResult:

        parsed_quotes = self.parser.parse_file(
            file_path
        )

        result = ImportResult(
            total_parsed=len(parsed_quotes)
        )

        for parsed_quote in parsed_quotes:

            action = self._import_quote(
                parsed_quote
            )

            if action == "created":
                result.created += 1

            elif action == "updated":
                result.updated += 1

            elif action == "skipped":
                result.skipped += 1

        return result

    # ========================================================
    # IMPORT D'UNE CITATION
    # ========================================================

    def _import_quote(
        self,
        parsed_quote: ParsedQuote,
    ) -> str:
        """
        Importe une citation.

        Retourne :

            created
            updated
            skipped
        """

        # ----------------------------------------------------
        # Recherche d'une citation existante
        #
        # Une citation est identifiée par :
        #
        #   date
        #   moment
        #   texte
        #
        # ----------------------------------------------------

        existing = DailyQuote.objects.filter(
            date=parsed_quote.date,
            moment=parsed_quote.moment,
            text=parsed_quote.text,
        ).first()

        # ----------------------------------------------------
        # Existe déjà
        # ----------------------------------------------------

        if existing:

            changed = False

            if existing.author != parsed_quote.author:
                existing.author = parsed_quote.author
                changed = True

            if existing.source != parsed_quote.source:
                existing.source = parsed_quote.source
                changed = True

            if (
                existing.source_reference
                != parsed_quote.source_reference
            ):
                existing.source_reference = (
                    parsed_quote.source_reference
                )
                changed = True

            if changed:
                existing.save()

                return "updated"

            return "skipped"

        # ----------------------------------------------------
        # Nouvelle citation
        # ----------------------------------------------------

        DailyQuote.objects.create(
            text=parsed_quote.text,
            author=parsed_quote.author,
            source=parsed_quote.source,
            source_reference=(
                parsed_quote.source_reference
            ),
            date=parsed_quote.date,
            moment=parsed_quote.moment,
        )

        return "created"