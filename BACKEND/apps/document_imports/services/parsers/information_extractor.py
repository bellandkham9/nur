import re
from typing import Any

from apps.document_imports.models import (
    DocumentImport,
    DocumentPage,
    ExtractedInformation,
    DetectedEvent,
)


class InformationExtractor:
    """
    Analyse les tableaux extraits d'un document et tente
    d'identifier les informations utiles.

    L'objectif n'est pas encore de faire de l'IA.
    On commence par une extraction déterministe et robuste.
    """

    # ---------------------------------------------------------
    # Mots-clés permettant d'identifier les colonnes
    # ---------------------------------------------------------

    FIELD_ALIASES = {
        "title": [
            "activité",
            "activite",
            "ligne d'action",
            "ligne d action",
            "actions à mener",
            "actions a mener",
            "action",
            "objectif spécifique",
            "objectifs spécifiques",
            "objectifs",
            "libellés",
            "libelles",
        ],

        "description": [
            "description",
            "stratégie",
            "strategie",
            "besoins",
            "résultats attendus",
            "resultats attendus",
        ],

        "location": [
            "lieu",
            "lieux",
            "localisation",
            "endroit",
        ],

        "date": [
            "date",
            "dates",
            "période",
            "periode",
        ],

        "responsible": [
            "responsable",
            "responsables",
            "chargé",
            "charge",
            "chargé de l'activité",
            "charge de l'activite",
        ],

        "participants": [
            "participants",
            "participant",
            "public",
            "bénéficiaires",
            "beneficiaires",
        ],

        "objective": [
            "objectif",
            "objectifs",
            "objectifs spécifiques",
            "objectif spécifique",
            "résultats attendus",
            "resultats attendus",
        ],

        "budget": [
            "budget",
            "budget estimatif",
            "prix total",
            "prix unitaire",
            "coût",
            "cout",
            "besoins",
        ],
    }

    # ---------------------------------------------------------
    # Initialisation
    # ---------------------------------------------------------

    def __init__(self, document: DocumentImport):
        self.document = document

    # ---------------------------------------------------------
    # Point d'entrée principal
    # ---------------------------------------------------------

    def extract(self):
        """
        Analyse toutes les pages du document.
        """

        total_events = 0
        total_information = 0

        for page in self.document.pages.all():

            for table in page.tables.all():

                events, information = self.process_table(
                    page=page,
                    table=table,
                )

                total_events += events
                total_information += information

        return {
            "events": total_events,
            "information": total_information,
        }

    # ---------------------------------------------------------
    # Traitement d'un tableau
    # ---------------------------------------------------------

    def process_table(self, page, table):

        headers = table.headers or []
        rows = table.rows or []

        # Certaines extractions Excel mettent les vrais headers
        # dans la première ligne des rows.
        effective_headers = self.detect_headers(
            headers=headers,
            rows=rows,
        )

        if not effective_headers:
            return 0, 0

        column_map = self.map_columns(effective_headers)

        if not column_map:
            return 0, 0

        event_count = 0
        information_count = 0

        current_context = {}

        for row in rows:

            if not row:
                continue

            normalized = self.normalize_row(
                row=row,
                size=len(effective_headers),
            )

            # Ignorer les lignes manifestement vides
            if not any(str(value).strip() for value in normalized):
                continue

            # Détecter les titres / sections
            section = self.detect_section(normalized)

            if section:
                current_context["category"] = section
                continue

            # Construire le dictionnaire colonne -> valeur
            data = self.build_row_data(
                normalized,
                effective_headers,
            )

            # Propager certains contextes
            data = self.apply_context(
                data,
                current_context,
            )

            # Est-ce une ligne susceptible de représenter une activité ?
            if not self.is_activity_row(data):
                continue

            # Extraire les informations individuelles
            information_count += self.save_information(
                page=page,
                data=data,
            )

            # Créer un événement détecté
            event = self.create_detected_event(
                page=page,
                data=data,
            )

            if event:
                event_count += 1

        return event_count, information_count

    # ---------------------------------------------------------
    # Détection des headers
    # ---------------------------------------------------------

    def detect_headers(self, headers, rows):

        if headers and self.is_useful_header_row(headers):
            return headers

        for row in rows[:15]:

            if self.is_useful_header_row(row):
                return row

        return []

    def is_useful_header_row(self, row):

        if not row:
            return False

        text = " ".join(
            self.clean_text(value).lower()
            for value in row
            if value
        )

        keywords = [
            "responsable",
            "date",
            "dates",
            "lieu",
            "lieux",
            "objectif",
            "objectifs",
            "action",
            "stratégie",
            "strategie",
            "participants",
            "besoins",
        ]

        matches = sum(
            1 for keyword in keywords
            if keyword in text
        )

        return matches >= 2

    # ---------------------------------------------------------
    # Mapping des colonnes
    # ---------------------------------------------------------

    def map_columns(self, headers):

        mapping = {}

        for index, header in enumerate(headers):

            header_clean = self.clean_text(header).lower()

            if not header_clean:
                continue

            for field, aliases in self.FIELD_ALIASES.items():

                if any(
                    alias in header_clean
                    for alias in aliases
                ):
                    mapping[index] = field
                    break

        return mapping

    # ---------------------------------------------------------
    # Construction d'une ligne
    # ---------------------------------------------------------

    def build_row_data(self, row, headers):

        data = {}

        for index, value in enumerate(row):

            if index >= len(headers):
                continue

            header = self.clean_text(headers[index])

            value = self.clean_text(value)

            if not header or not value:
                continue

            data[header] = value

        return data

    # ---------------------------------------------------------
    # Normalisation
    # ---------------------------------------------------------

    def normalize_row(self, row, size):

        normalized = list(row[:size])

        while len(normalized) < size:
            normalized.append("")

        return [
            self.clean_text(value)
            for value in normalized
        ]

    def clean_text(self, value):

        if value is None:
            return ""

        text = str(value)

        text = text.replace("\n", " ")
        text = text.replace("\r", " ")

        text = re.sub(
            r"\s+",
            " ",
            text,
        )

        return text.strip()

    # ---------------------------------------------------------
    # Sections
    # ---------------------------------------------------------

    def detect_section(self, row):

        text = " ".join(
            self.clean_text(value)
            for value in row
            if value
        )

        upper = text.upper()

        sections = [
            "EXPANSION ET CONSOLIDATION",
            "ACTION SOCIALE",
            "DISCOURS DANS LA SOCIÉTÉ",
            "DISCOURS EN COURS DANS LA SOCIÉTÉ",
            "VIE COMMUNAUTAIRE",
            "FORMATION",
        ]

        for section in sections:

            if section in upper:
                return section

        return None

    # ---------------------------------------------------------
    # Contexte
    # ---------------------------------------------------------

    def apply_context(self, data, context):

        if context.get("category"):

            if not data.get("category"):
                data["category"] = context["category"]

        return data

    # ---------------------------------------------------------
    # Détection d'une activité
    # ---------------------------------------------------------

    def is_activity_row(self, data):

        possible_fields = [
            "activité",
            "activite",
            "ligne d'action",
            "ligne d action",
            "actions à mener",
            "actions a mener",
            "action",
            "objectif",
            "objectifs",
            "objectifs spécifiques",
            "objectif spécifique",
        ]

        values = []

        for key, value in data.items():

            key_lower = key.lower()

            if any(
                field in key_lower
                for field in possible_fields
            ):
                values.append(value)

        if not values:
            return False

        text = " ".join(values).strip()

        if len(text) < 5:
            return False

        # Ne pas considérer les lignes de total comme événements
        ignored = [
            "total action sociale",
            "total expansion",
            "total action discours",
            "total",
        ]

        if text.lower() in ignored:
            return False

        return True

    # ---------------------------------------------------------
    # Extraction d'informations
    # ---------------------------------------------------------

    def save_information(self, page, data):

        count = 0

        for field_name, value in data.items():

            if not value:
                continue

            normalized_field = self.normalize_field_name(
                field_name
            )

            if not normalized_field:
                continue

            ExtractedInformation.objects.create(
                document=self.document,
                page=page,
                field_name=normalized_field,
                value=value,
                normalized_value=self.normalize_value(value),
                source_type=ExtractedInformation.SourceType.TABLE,
                confidence=0.90,
                source_reference=(
                    f"page:{page.page_number}"
                ),
            )

            count += 1

        return count

    def normalize_field_name(self, field_name):

        text = self.clean_text(field_name).lower()

        if "responsable" in text:
            return "responsible"

        if "lieu" in text:
            return "location"

        if "date" in text:
            return "date"

        if "participant" in text:
            return "participants"

        if "objectif" in text:
            return "objective"

        if "stratégie" in text or "strategie" in text:
            return "strategy"

        if "action" in text:
            return "action"

        if "résultat" in text or "resultat" in text:
            return "expected_result"

        if "budget" in text:
            return "budget"

        if "besoin" in text:
            return "needs"

        if "activité" in text or "activite" in text:
            return "activity"

        return field_name

    def normalize_value(self, value):

        text = self.clean_text(value)

        return text

    # ---------------------------------------------------------
    # Création des événements
    # ---------------------------------------------------------

    def create_detected_event(self, page, data):

        title = self.find_value(
            data,
            [
                "activité",
                "activite",
                "ligne d'action",
                "ligne d action",
                "action",
                "actions à mener",
                "actions a mener",
                "objectif spécifique",
                "objectifs spécifiques",
                "objectifs",
            ],
        )

        if not title:
            return None

        description = self.find_value(
            data,
            [
                "stratégie",
                "strategie",
                "description",
                "besoins",
            ],
        )

        location = self.find_value(
            data,
            [
                "lieux",
                "lieu",
                "localisation",
            ],
        )

        date_value = self.find_value(
            data,
            [
                "dates",
                "date",
                "période",
                "periode",
            ],
        )

        responsible = self.find_value(
            data,
            [
                "responsable",
                "responsables",
            ],
        )

        objective = self.find_value(
            data,
            [
                "objectif",
                "objectifs",
                "résultats attendus",
                "resultats attendus",
            ],
        )

        category = data.get(
            "category",
            "",
        )

        event = DetectedEvent.objects.create(
            document=self.document,
            page=page,
            title=title[:255],
            description=description or "",
            location=location or "",
            responsible=responsible or "",
            objective=objective or "",
            category=category or "",
            confidence=self.calculate_confidence(
                title=title,
                date=date_value,
                location=location,
                responsible=responsible,
            ),
            raw_data=data,
            source_reference=f"page:{page.page_number}",
        )

        # Pour le moment, nous conservons la date brute
        # dans raw_data. Le prochain service la convertira
        # en vraies dates Django.
        if date_value:
            event.raw_data["raw_date"] = date_value
            event.save(update_fields=["raw_data"])

        return event

    # ---------------------------------------------------------
    # Recherche de valeur
    # ---------------------------------------------------------

    def find_value(self, data, possible_names):

        for key, value in data.items():

            key_lower = key.lower()

            for name in possible_names:

                if name.lower() in key_lower:
                    return value

        return ""

    # ---------------------------------------------------------
    # Calcul de confiance
    # ---------------------------------------------------------

    def calculate_confidence(
        self,
        title,
        date,
        location,
        responsible,
    ):

        score = 0.0

        if title:
            score += 0.40

        if date:
            score += 0.20

        if location:
            score += 0.15

        if responsible:
            score += 0.15

        # Petite marge car l'information vient
        # directement d'un tableau structuré.
        score += 0.10

        return min(score, 1.0)