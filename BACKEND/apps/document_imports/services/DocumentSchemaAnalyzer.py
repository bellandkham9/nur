from dataclasses import dataclass, field
from typing import Any

from .field_resolver import FieldResolver, FieldMatch


# ==============================================================
# RÉSULTAT D'UNE COLONNE
# ==============================================================


@dataclass
class ColumnSchema:
    """
    Schéma détecté pour une colonne du document.
    """

    index: int
    header: Any
    normalized_header: str

    field: str | None
    confidence: float
    reason: str

    sample_values: list[Any] = field(default_factory=list)

    detected_types: list[str] = field(default_factory=list)

    ambiguous: bool = False


# ==============================================================
# RÉSULTAT GLOBAL DU DOCUMENT
# ==============================================================


@dataclass
class DocumentSchema:
    """
    Schéma global détecté pour un document.
    """

    columns: list[ColumnSchema]

    field_to_columns: dict[str, list[int]]

    unresolved_columns: list[int]

    ambiguous_columns: list[int]

    confidence: float

    structure_type: str

    warnings: list[str] = field(default_factory=list)


# ==============================================================
# ANALYSEUR DE STRUCTURE
# ==============================================================


class DocumentSchemaAnalyzer:
    """
    Analyse la structure d'un document avant l'extraction
    définitive des données.

    Principes :

    - ne dépend pas de l'ordre des colonnes ;
    - ne suppose pas que tous les documents possèdent
      les mêmes champs ;
    - utilise FieldResolver pour les headers ;
    - analyse les valeurs présentes dans les colonnes ;
    - détecte les colonnes ambiguës ;
    - détecte les doublons de champs ;
    - produit un DocumentSchema exploitable par
      FieldAssignmentEngine.

    Le document peut être un tableau Excel, CSV ou toute autre
    structure déjà transformée en :

        headers = [...]
        rows = [
            [...],
            [...],
        ]
    """

    # ==========================================================
    # PARAMÈTRES
    # ==========================================================

    MIN_SAMPLES = 5

    HIGH_CONFIDENCE = 0.85

    LOW_CONFIDENCE = 0.60

    # ==========================================================
    # CONSTRUCTION
    # ==========================================================

    def __init__(
        self,
        resolver: FieldResolver | None = None,
    ):
        self.resolver = resolver or FieldResolver()

    # ==========================================================
    # ANALYSE PRINCIPALE
    # ==========================================================

    def analyze(
        self,
        headers: list[Any],
        rows: list[list[Any]],
    ) -> DocumentSchema:

        if not headers:

            return DocumentSchema(
                columns=[],
                field_to_columns={},
                unresolved_columns=[],
                ambiguous_columns=[],
                confidence=0.0,
                structure_type="unknown",
                warnings=[
                    "Aucun header détecté dans le document."
                ],
            )

        columns = []

        for index, header in enumerate(headers):

            samples = self._extract_column_samples(
                rows=rows,
                column_index=index,
            )

            column_schema = self._analyze_column(
                index=index,
                header=header,
                samples=samples,
            )

            columns.append(column_schema)

        field_to_columns = self._build_field_mapping(
            columns
        )

        ambiguous_columns = [
            column.index
            for column in columns
            if column.ambiguous
        ]

        unresolved_columns = [
            column.index
            for column in columns
            if column.field is None
        ]

        warnings = self._build_warnings(
            columns=columns,
            field_to_columns=field_to_columns,
        )

        confidence = self._calculate_document_confidence(
            columns
        )

        structure_type = self._detect_structure_type(
            columns=columns,
            rows=rows,
        )

        return DocumentSchema(
            columns=columns,
            field_to_columns=field_to_columns,
            unresolved_columns=unresolved_columns,
            ambiguous_columns=ambiguous_columns,
            confidence=confidence,
            structure_type=structure_type,
            warnings=warnings,
        )

    # ==========================================================
    # EXTRACTION DES EXEMPLES DE COLONNE
    # ==========================================================

    def _extract_column_samples(
        self,
        rows: list[list[Any]],
        column_index: int,
    ) -> list[Any]:

        samples = []

        for row in rows:

            if column_index >= len(row):
                continue

            value = row[column_index]

            if value is None:
                continue

            if isinstance(value, str):
                value = value.strip()

                if not value:
                    continue

            samples.append(value)

            if len(samples) >= self.MIN_SAMPLES:
                break

        return samples

    # ==========================================================
    # ANALYSE D'UNE COLONNE
    # ==========================================================

    def _analyze_column(
        self,
        index: int,
        header: Any,
        samples: list[Any],
    ) -> ColumnSchema:

        normalized_header = (
            self.resolver.normalize_text(header)
        )

        header_match = self.resolver.resolve_header(
            header
        )

        detected_types = self._detect_column_types(
            samples
        )

        field = header_match.field
        confidence = header_match.confidence
        reason = header_match.reason

        ambiguous = False

        # ------------------------------------------------------
        # Header inconnu
        # ------------------------------------------------------

        if field is None:

            alternative = self._infer_field_from_values(
                samples
            )

            if alternative.field:

                field = alternative.field
                confidence = alternative.confidence
                reason = (
                    "Champ déduit à partir du contenu : "
                    + alternative.reason
                )

            else:

                confidence = 0.0
                reason = (
                    "Header non reconnu et contenu "
                    "insuffisant pour déterminer le champ."
                )

        # ------------------------------------------------------
        # Vérification header + contenu
        # ------------------------------------------------------

        if field:

            compatibility = self._check_column_compatibility(
                field=field,
                samples=samples,
            )

            if compatibility["conflict"]:

                alternative = self._infer_field_from_values(
                    samples,
                    excluded_fields={field},
                )

                if alternative.field:

                    field = alternative.field

                    confidence = min(
                        alternative.confidence,
                        0.95,
                    )

                    reason = (
                        "Réaffectation du champ : "
                        + alternative.reason
                    )

                else:

                    ambiguous = True

                    confidence = min(
                        confidence,
                        0.50,
                    )

                    reason = (
                        "Header reconnu mais contenu "
                        "incompatible ou ambigu."
                    )

        # ------------------------------------------------------
        # Colonne vide
        # ------------------------------------------------------

        if not samples:

            confidence = min(
                confidence,
                0.40,
            )

            reason = (
                "Colonne sans valeurs exploitables."
            )

        # ------------------------------------------------------
        # Colonne avec plusieurs types
        # ------------------------------------------------------

        if len(detected_types) > 1:

            # Certaines colonnes peuvent naturellement
            # contenir du texte mixte.
            #
            # On ne considère pas automatiquement cela
            # comme une erreur.

            if {
                "date",
                "budget",
            }.issubset(set(detected_types)):

                ambiguous = True

                confidence = min(
                    confidence,
                    0.50,
                )

                reason += (
                    " La colonne contient plusieurs "
                    "types structurés incompatibles."
                )

        return ColumnSchema(
            index=index,
            header=header,
            normalized_header=normalized_header,
            field=field,
            confidence=round(
                confidence,
                2,
            ),
            reason=reason,
            sample_values=samples,
            detected_types=detected_types,
            ambiguous=ambiguous,
        )

    # ==========================================================
    # TYPES D'UNE COLONNE
    # ==========================================================

    def _detect_column_types(
        self,
        samples: list[Any],
    ) -> list[str]:

        types = []

        for value in samples:

            value_type = self.resolver.detect_value_type(
                value
            )

            if value_type not in types:

                types.append(value_type)

        return types

    # ==========================================================
    # VÉRIFICATION DE COMPATIBILITÉ
    # ==========================================================

    def _check_column_compatibility(
        self,
        field: str,
        samples: list[Any],
    ) -> dict[str, Any]:

        if not samples:

            return {
                "conflict": False,
                "reason": "Aucune donnée disponible",
            }

        conflicts = 0

        for value in samples:

            result = self.resolver.validate_value_for_field(
                field,
                value,
            )

            if result.field is None:

                conflicts += 1

        conflict_ratio = (
            conflicts / len(samples)
        )

        return {
            "conflict": conflict_ratio >= 0.5,
            "conflict_ratio": conflict_ratio,
            "reason": (
                f"{conflicts}/{len(samples)} "
                "valeurs incompatibles"
            ),
        }

    # ==========================================================
    # INFÉRENCE PAR LE CONTENU
    # ==========================================================

    def _infer_field_from_values(
        self,
        samples: list[Any],
        excluded_fields: set[str] | None = None,
    ) -> FieldMatch:

        excluded_fields = excluded_fields or set()

        if not samples:

            return FieldMatch(
                field=None,
                confidence=0.0,
                reason="Aucune valeur disponible",
            )

        type_counts: dict[str, int] = {}

        for value in samples:

            value_type = self.resolver.detect_value_type(
                value
            )

            type_counts[value_type] = (
                type_counts.get(value_type, 0) + 1
            )

        dominant_type = max(
            type_counts,
            key=type_counts.get,
        )

        # ------------------------------------------------------
        # DATE
        # ------------------------------------------------------

        if dominant_type == "date":

            if "date" not in excluded_fields:

                ratio = (
                    type_counts["date"]
                    / len(samples)
                )

                return FieldMatch(
                    field="date",
                    confidence=round(
                        min(0.98, 0.80 + ratio * 0.18),
                        2,
                    ),
                    reason=(
                        "La majorité des valeurs "
                        "correspondent à des dates."
                    ),
                )

        # ------------------------------------------------------
        # BUDGET
        # ------------------------------------------------------

        if dominant_type == "budget":

            if "budget" not in excluded_fields:

                ratio = (
                    type_counts["budget"]
                    / len(samples)
                )

                return FieldMatch(
                    field="budget",
                    confidence=round(
                        min(0.98, 0.80 + ratio * 0.18),
                        2,
                    ),
                    reason=(
                        "La majorité des valeurs "
                        "correspondent à des montants."
                    ),
                )

        # ------------------------------------------------------
        # POURCENTAGE
        # ------------------------------------------------------

        if dominant_type == "percentage":

            if "result" not in excluded_fields:

                return FieldMatch(
                    field="result",
                    confidence=0.70,
                    reason=(
                        "Les valeurs correspondent "
                        "principalement à des pourcentages."
                    ),
                )

        # ------------------------------------------------------
        # NOMBRE
        # ------------------------------------------------------

        if dominant_type == "number":

            return FieldMatch(
                field=None,
                confidence=0.35,
                reason=(
                    "Valeurs numériques sans "
                    "sémantique suffisamment précise."
                ),
            )

        # ------------------------------------------------------
        # TEXTE
        # ------------------------------------------------------

        return FieldMatch(
            field=None,
            confidence=0.0,
            reason=(
                "Le contenu textuel seul ne permet "
                "pas une affectation suffisamment fiable."
            ),
        )

    # ==========================================================
    # CONSTRUCTION DU MAPPING
    # ==========================================================

    def _build_field_mapping(
        self,
        columns: list[ColumnSchema],
    ) -> dict[str, list[int]]:

        mapping: dict[str, list[int]] = {}

        for column in columns:

            if column.field is None:
                continue

            mapping.setdefault(
                column.field,
                [],
            ).append(column.index)

        return mapping

    # ==========================================================
    # TYPE DE STRUCTURE
    # ==========================================================

    def _detect_structure_type(
        self,
        columns: list[ColumnSchema],
        rows: list[list[Any]],
    ) -> str:

        if not columns:
            return "unknown"

        recognized = sum(
            1
            for column in columns
            if column.field is not None
        )

        ratio = recognized / len(columns)

        if ratio >= 0.75:
            return "structured_table"

        if ratio >= 0.40:
            return "semi_structured"

        if rows:
            return "unstructured_table"

        return "unknown"

    # ==========================================================
    # CONFIANCE GLOBALE
    # ==========================================================

    def _calculate_document_confidence(
        self,
        columns: list[ColumnSchema],
    ) -> float:

        if not columns:
            return 0.0

        usable = [
            column.confidence
            for column in columns
            if column.field is not None
        ]

        if not usable:
            return 0.0

        confidence = sum(usable) / len(usable)

        # Pénalité pour les colonnes ambiguës.
        ambiguous_count = sum(
            1
            for column in columns
            if column.ambiguous
        )

        if ambiguous_count:
            penalty = (
                ambiguous_count
                / len(columns)
            ) * 0.20

            confidence -= penalty

        return round(
            max(0.0, min(confidence, 1.0)),
            2,
        )

    # ==========================================================
    # AVERTISSEMENTS
    # ==========================================================

    def _build_warnings(
        self,
        columns: list[ColumnSchema],
        field_to_columns: dict[str, list[int]],
    ) -> list[str]:

        warnings = []

        # ------------------------------------------------------
        # Colonnes inconnues
        # ------------------------------------------------------

        unresolved = [
            column
            for column in columns
            if column.field is None
        ]

        if unresolved:

            warnings.append(
                f"{len(unresolved)} colonne(s) "
                "n'ont pas pu être identifiées."
            )

        # ------------------------------------------------------
        # Colonnes ambiguës
        # ------------------------------------------------------

        ambiguous = [
            column
            for column in columns
            if column.ambiguous
        ]

        if ambiguous:

            warnings.append(
                f"{len(ambiguous)} colonne(s) "
                "présentent une ambiguïté."
            )

        # ------------------------------------------------------
        # Champs présents plusieurs fois
        # ------------------------------------------------------

        duplicates = {
            field: indexes
            for field, indexes in field_to_columns.items()
            if len(indexes) > 1
        }

        for field, indexes in duplicates.items():

            warnings.append(
                f"Le champ '{field}' apparaît "
                f"sur plusieurs colonnes : {indexes}."
            )

        # ------------------------------------------------------
        # Faible confiance
        # ------------------------------------------------------

        low_confidence = [
            column
            for column in columns
            if (
                column.field is not None
                and column.confidence < self.LOW_CONFIDENCE
            )
        ]

        if low_confidence:

            warnings.append(
                f"{len(low_confidence)} colonne(s) "
                "ont une confiance faible."
            )

        return warnings

    # ==========================================================
    # API SIMPLE
    # ==========================================================

    def analyze_headers(
        self,
        headers: list[Any],
    ) -> DocumentSchema:

        return self.analyze(
            headers=headers,
            rows=[],
        )

