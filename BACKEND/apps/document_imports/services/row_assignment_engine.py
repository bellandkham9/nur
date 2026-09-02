from dataclasses import dataclass
from typing import Any

from .field_assignment_engine import (
    FieldAssignmentEngine,
    FieldAssignment,
)
from .field_resolver import FieldResolver


@dataclass
class RowField:
    """
    Valeur finale affectée à un champ canonique.
    """

    field: str
    value: Any
    confidence: float
    source_header: str | None
    reason: str


@dataclass
class RowAssignmentResult:
    """
    Résultat de résolution d'une ligne complète.
    """

    fields: dict[str, RowField]
    unresolved: list[dict]
    conflicts: list[dict]


class RowAssignmentEngine:
    """
    Résout une ligne complète de document.

    Le moteur :
    - ne dépend pas de l'ordre des colonnes ;
    - utilise les headers comme indice ;
    - vérifie les valeurs ;
    - détecte les incohérences ;
    - évite d'affecter deux valeurs au même champ ;
    - conserve les valeurs ambiguës plutôt que de les placer
      arbitrairement.
    """

    def __init__(self):
        self.resolver = FieldResolver()
        self.assignment_engine = FieldAssignmentEngine()

    # ==========================================================
    # POINT D'ENTRÉE PRINCIPAL
    # ==========================================================

    def resolve_row(
        self,
        row: dict[str, Any],
    ) -> RowAssignmentResult:

        fields: dict[str, RowField] = {}
        unresolved: list[dict] = []
        conflicts: list[dict] = []

        # ------------------------------------------------------
        # Première passe :
        # résoudre les correspondances évidentes
        # ------------------------------------------------------

        assignments: list[FieldAssignment] = []

        for header, value in row.items():

            assignment = self.assignment_engine.resolve_cell(
                header=header,
                value=value,
                used_fields=set(fields.keys()),
            )

            if assignment.field:

                assignments.append(assignment)

            elif value is not None and str(value).strip():

                unresolved.append(
                    {
                        "header": header,
                        "value": value,
                        "reason": assignment.reason,
                    }
                )

        # ------------------------------------------------------
        # Trier par confiance
        #
        # Les affectations certaines passent en premier.
        # ------------------------------------------------------

        assignments.sort(
            key=lambda item: item.confidence,
            reverse=True,
        )

        # ------------------------------------------------------
        # Affectation sans collision
        # ------------------------------------------------------

        for assignment in assignments:

            field = assignment.field

            if field is None:
                continue

            # Champ encore libre
            if field not in fields:

                fields[field] = RowField(
                    field=field,
                    value=assignment.value,
                    confidence=assignment.confidence,
                    source_header=assignment.source_header,
                    reason=assignment.reason,
                )

                continue

            # --------------------------------------------------
            # Collision :
            # deux valeurs veulent le même champ
            # --------------------------------------------------

            existing = fields[field]

            if assignment.confidence > existing.confidence:

                conflicts.append(
                    {
                        "field": field,
                        "previous_value": existing.value,
                        "new_value": assignment.value,
                        "previous_confidence": (
                            existing.confidence
                        ),
                        "new_confidence": (
                            assignment.confidence
                        ),
                        "decision": "new_value_selected",
                    }
                )

                fields[field] = RowField(
                    field=field,
                    value=assignment.value,
                    confidence=assignment.confidence,
                    source_header=assignment.source_header,
                    reason=assignment.reason,
                )

            else:

                conflicts.append(
                    {
                        "field": field,
                        "previous_value": existing.value,
                        "new_value": assignment.value,
                        "previous_confidence": (
                            existing.confidence
                        ),
                        "new_confidence": (
                            assignment.confidence
                        ),
                        "decision": "previous_value_kept",
                    }
                )

                unresolved.append(
                    {
                        "header": assignment.source_header,
                        "value": assignment.value,
                        "reason": (
                            f"Collision sur le champ '{field}'"
                        ),
                    }
                )

        # ------------------------------------------------------
        # Deuxième passe :
        # tenter de résoudre les valeurs restées ambiguës
        # ------------------------------------------------------

        remaining = list(unresolved)

        unresolved = []

        for item in remaining:

            value = item["value"]
            header = item["header"]

            alternative = (
                self.assignment_engine.find_best_field_for_value(
                    value=value,
                    excluded_fields=set(fields.keys()),
                )
            )

            if (
                alternative.field
                and alternative.confidence >= 0.80
            ):

                fields[alternative.field] = RowField(
                    field=alternative.field,
                    value=value,
                    confidence=alternative.confidence,
                    source_header=header,
                    reason=(
                        "Réaffectation après analyse "
                        "globale de la ligne. "
                        + alternative.reason
                    ),
                )

            else:

                unresolved.append(
                    {
                        **item,
                        "alternative_field": (
                            alternative.field
                        ),
                        "alternative_confidence": (
                            alternative.confidence
                        ),
                    }
                )

        return RowAssignmentResult(
            fields=fields,
            unresolved=unresolved,
            conflicts=conflicts,
        )

    # ==========================================================
    # CONVERSION EN DICTIONNAIRE SIMPLE
    # ==========================================================

    @staticmethod
    def to_dict(
        result: RowAssignmentResult,
    ) -> dict[str, Any]:

        return {
            field: item.value
            for field, item in result.fields.items()
        }