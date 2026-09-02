from dataclasses import dataclass
from typing import Any

from .field_resolver import FieldResolver, FieldMatch


@dataclass
class FieldAssignment:
    """
    Affectation finale d'une valeur à un champ canonique.
    """

    field: str | None
    value: Any
    confidence: float
    reason: str
    source_header: str | None = None


class FieldAssignmentEngine:
    """
    Détermine le champ réel auquel une valeur doit être affectée.

    Contrairement à une simple correspondance de colonnes,
    ce moteur prend en compte :

    - le header ;
    - le type de valeur ;
    - la compatibilité valeur/champ ;
    - les champs déjà utilisés ;
    - les alternatives possibles.

    Le moteur ne dépend PAS de l'ordre des colonnes.
    """

    def __init__(self):
        self.resolver = FieldResolver()

    # ==========================================================
    # RÉSOLUTION D'UNE CELLULE
    # ==========================================================

    def resolve_cell(
        self,
        header: str | None,
        value: Any,
        used_fields: set[str] | None = None,
    ) -> FieldAssignment:

        used_fields = used_fields or set()

        # ------------------------------------------------------
        # Valeur vide
        # ------------------------------------------------------

        if value is None or not str(value).strip():

            return FieldAssignment(
                field=None,
                value=value,
                confidence=0.0,
                reason="Valeur vide",
                source_header=header,
            )

        # ------------------------------------------------------
        # Type réel de la valeur
        # ------------------------------------------------------

        value_type = self.resolver.detect_value_type(value)

        # ------------------------------------------------------
        # Résolution du header
        # ------------------------------------------------------

        header_match = self.resolver.resolve_header(header)

        # ------------------------------------------------------
        # Le header propose un champ
        # ------------------------------------------------------

        if header_match.field:

            validation = self.resolver.validate_value_for_field(
                header_match.field,
                value,
            )

            if validation.field:

                return FieldAssignment(
                    field=header_match.field,
                    value=value,
                    confidence=(
                        header_match.confidence
                        * validation.confidence
                    ),
                    reason=(
                        f"Header valide : "
                        f"{header_match.reason}. "
                        f"{validation.reason}."
                    ),
                    source_header=header,
                )

        # ------------------------------------------------------
        # Le header est incompatible :
        # on cherche une autre destination
        # ------------------------------------------------------

        alternative = self.find_best_field_for_value(
            value=value,
            excluded_fields=used_fields,
        )

        if alternative.field:

            return FieldAssignment(
                field=alternative.field,
                value=value,
                confidence=alternative.confidence,
                reason=(
                    f"Réaffectation automatique. "
                    f"Header source='{header}'. "
                    f"{alternative.reason}"
                ),
                source_header=header,
            )

        # ------------------------------------------------------
        # Impossible de déterminer correctement
        # ------------------------------------------------------

        return FieldAssignment(
            field=None,
            value=value,
            confidence=0.0,
            reason=(
                "Aucune affectation suffisamment fiable"
            ),
            source_header=header,
        )

    # ==========================================================
    # RECHERCHE D'UNE DESTINATION ALTERNATIVE
    # ==========================================================

    def find_best_field_for_value(
        self,
        value: Any,
        excluded_fields: set[str] | None = None,
    ) -> FieldMatch:

        excluded_fields = excluded_fields or set()

        value_type = self.resolver.detect_value_type(value)

        candidates = []

        # ------------------------------------------------------
        # DATE
        # ------------------------------------------------------

        if value_type == "date":

            candidates.append(
                FieldMatch(
                    field="date",
                    confidence=0.98,
                    reason="La valeur correspond fortement au champ date",
                )
            )

        # ------------------------------------------------------
        # BUDGET
        # ------------------------------------------------------

        elif value_type == "budget":

            candidates.append(
                FieldMatch(
                    field="budget",
                    confidence=0.98,
                    reason="La valeur correspond fortement au champ budget",
                )
            )

        # ------------------------------------------------------
        # POURCENTAGE
        # ------------------------------------------------------

        elif value_type == "percentage":

            candidates.extend(
                [
                    FieldMatch(
                        field="result",
                        confidence=0.75,
                        reason=(
                            "Pourcentage compatible avec "
                            "un indicateur ou résultat"
                        ),
                    ),
                ]
            )

        # ------------------------------------------------------
        # NOMBRE
        # ------------------------------------------------------

        elif value_type == "number":

            candidates.extend(
                [
                    FieldMatch(
                        field="result",
                        confidence=0.55,
                        reason=(
                            "Nombre pouvant représenter "
                            "un indicateur ou résultat"
                        ),
                    ),
                    FieldMatch(
                        field="budget",
                        confidence=0.50,
                        reason=(
                            "Nombre pouvant représenter "
                            "un montant budgétaire"
                        ),
                    ),
                ]
            )

        # ------------------------------------------------------
        # TEXTE
        # ------------------------------------------------------

        else:

            candidates.extend(
                [
                    FieldMatch(
                        field="action",
                        confidence=0.50,
                        reason=(
                            "Texte potentiellement descriptif "
                            "d'une action"
                        ),
                    ),
                    FieldMatch(
                        field="objective",
                        confidence=0.45,
                        reason=(
                            "Texte potentiellement descriptif "
                            "d'un objectif"
                        ),
                    ),
                    FieldMatch(
                        field="strategy",
                        confidence=0.45,
                        reason=(
                            "Texte potentiellement descriptif "
                            "d'une stratégie"
                        ),
                    ),
                    FieldMatch(
                        field="responsible",
                        confidence=0.40,
                        reason=(
                            "Texte potentiellement représentant "
                            "un responsable"
                        ),
                    ),
                    FieldMatch(
                        field="location",
                        confidence=0.40,
                        reason=(
                            "Texte potentiellement représentant "
                            "un lieu"
                        ),
                    ),
                    FieldMatch(
                        field="participants",
                        confidence=0.40,
                        reason=(
                            "Texte potentiellement représentant "
                            "des participants"
                        ),
                    ),
                    FieldMatch(
                        field="result",
                        confidence=0.40,
                        reason=(
                            "Texte potentiellement représentant "
                            "un résultat"
                        ),
                    ),
                    FieldMatch(
                        field="needs",
                        confidence=0.40,
                        reason=(
                            "Texte potentiellement représentant "
                            "un besoin ou une ressource"
                        ),
                    ),
                ]
            )

        # ------------------------------------------------------
        # Retirer les champs déjà utilisés
        # ------------------------------------------------------

        candidates = [
            candidate
            for candidate in candidates
            if candidate.field not in excluded_fields
        ]

        # ------------------------------------------------------
        # Meilleur candidat
        # ------------------------------------------------------

        if not candidates:

            return FieldMatch(
                field=None,
                confidence=0.0,
                reason="Aucun champ alternatif disponible",
            )

        candidates.sort(
            key=lambda candidate: candidate.confidence,
            reverse=True,
        )

        return candidates[0]