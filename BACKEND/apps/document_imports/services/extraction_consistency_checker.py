
from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Any

from .field_resolver import FieldResolver


@dataclass
class ConsistencyIssue:
    """
    Représente une incohérence détectée dans l'extraction.
    """

    severity: str
    field: str | None
    message: str
    expected: str | None = None
    detected: str | None = None


@dataclass
class ConsistencyResult:
    """
    Résultat global du contrôle de cohérence.
    """

    is_consistent: bool
    score: float
    issues: list[ConsistencyIssue] = field(default_factory=list)


class ExtractionConsistencyChecker:
    """
    Vérifie la cohérence des valeurs après leur affectation
    aux champs canoniques.

    IMPORTANT :
    Ce composant ne décide PAS de la structure du document.

    Il intervient après FieldResolver + FieldAssignmentEngine.

    Son rôle est de répondre à une question simple :

        "Les valeurs placées dans ces champs ont-elles
         réellement du sens ensemble ?"
    """

    # ==========================================================
    # CHAMPS ATTENDANT PRINCIPALEMENT DU TEXTE
    # ==========================================================

    TEXT_FIELDS = {
        "action",
        "objective",
        "strategy",
        "responsible",
        "location",
        "participants",
        "result",
        "needs",
    }

    # ==========================================================
    # CHAMPS SPÉCIALISÉS
    # ==========================================================

    DATE_FIELDS = {
        "date",
    }

    BUDGET_FIELDS = {
        "budget",
    }

    # ==========================================================
    # INITIALISATION
    # ==========================================================

    def __init__(
        self,
        min_text_length: int = 2,
    ):
        self.min_text_length = min_text_length

    # ==========================================================
    # API PRINCIPALE
    # ==========================================================

    def check(
        self,
        extracted_fields: dict[str, Any],
    ) -> ConsistencyResult:
        """
        Analyse un ensemble de champs déjà affectés.

        Exemple :

            {
                "action": "Organiser une réunion",
                "date": "15/09/2026",
                "responsible": "Jean",
                "budget": "50000 FCFA"
            }
        """

        issues: list[ConsistencyIssue] = []

        # ------------------------------------------------------
        # 1. Vérification des champs inconnus
        # ------------------------------------------------------

        issues.extend(
            self._check_unknown_fields(
                extracted_fields
            )
        )

        # ------------------------------------------------------
        # 2. Vérification du type de chaque valeur
        # ------------------------------------------------------

        issues.extend(
            self._check_field_value_types(
                extracted_fields
            )
        )

        # ------------------------------------------------------
        # 3. Recherche des valeurs manifestement déplacées
        # ------------------------------------------------------

        issues.extend(
            self._check_misplaced_values(
                extracted_fields
            )
        )

        # ------------------------------------------------------
        # 4. Vérification des doublons suspects
        # ------------------------------------------------------

        issues.extend(
            self._check_duplicate_values(
                extracted_fields
            )
        )

        # ------------------------------------------------------
        # 5. Cohérence des relations entre champs
        # ------------------------------------------------------

        issues.extend(
            self._check_cross_field_consistency(
                extracted_fields
            )
        )

        # ------------------------------------------------------
        # 6. Calcul du score
        # ------------------------------------------------------

        score = self._calculate_score(
            issues
        )

        has_error = any(
            issue.severity == "error"
            for issue in issues
        )

        return ConsistencyResult(
            is_consistent=not has_error,
            score=score,
            issues=issues,
        )

    # ==========================================================
    # CHAMPS INCONNUS
    # ==========================================================

    def _check_unknown_fields(
        self,
        extracted_fields: dict[str, Any],
    ) -> list[ConsistencyIssue]:

        issues = []

        canonical_fields = set(
            FieldResolver.CANONICAL_FIELDS
        )

        for field_name in extracted_fields:

            if field_name not in canonical_fields:

                issues.append(
                    ConsistencyIssue(
                        severity="warning",
                        field=field_name,
                        message=(
                            "Champ non reconnu dans le schéma "
                            "canonique."
                        ),
                    )
                )

        return issues

    # ==========================================================
    # TYPE DES VALEURS
    # ==========================================================

    def _check_field_value_types(
        self,
        extracted_fields: dict[str, Any],
    ) -> list[ConsistencyIssue]:

        issues = []

        for field_name, value in extracted_fields.items():

            if field_name not in FieldResolver.CANONICAL_FIELDS:
                continue

            if self._is_empty(value):
                continue

            detected_type = (
                FieldResolver.detect_value_type(
                    value
                )
            )

            # --------------------------------------------------
            # Champ date
            # --------------------------------------------------

            if (
                field_name in self.DATE_FIELDS
                and detected_type not in {
                    "date",
                    "text",
                }
            ):

                issues.append(
                    ConsistencyIssue(
                        severity="error",
                        field=field_name,
                        message=(
                            "La valeur du champ date "
                            "n'a pas un format compatible."
                        ),
                        expected="date",
                        detected=detected_type,
                    )
                )

            # --------------------------------------------------
            # Champ budget
            # --------------------------------------------------

            elif (
                field_name in self.BUDGET_FIELDS
                and detected_type
                not in {
                    "budget",
                    "number",
                    "text",
                }
            ):

                issues.append(
                    ConsistencyIssue(
                        severity="error",
                        field=field_name,
                        message=(
                            "La valeur du champ budget "
                            "n'est pas compatible."
                        ),
                        expected="budget",
                        detected=detected_type,
                    )
                )

            # --------------------------------------------------
            # Champs textuels
            # --------------------------------------------------

            elif (
                field_name in self.TEXT_FIELDS
                and detected_type in {
                    "date",
                    "budget",
                }
            ):

                issues.append(
                    ConsistencyIssue(
                        severity="error",
                        field=field_name,
                        message=(
                            "Une valeur spécialisée a été "
                            "placée dans un champ textuel."
                        ),
                        expected="text",
                        detected=detected_type,
                    )
                )

        return issues

    # ==========================================================
    # VALEURS MANIFESTEMENT DÉPLACÉES
    # ==========================================================

    def _check_misplaced_values(
        self,
        extracted_fields: dict[str, Any],
    ) -> list[ConsistencyIssue]:

        issues = []

        for field_name, value in extracted_fields.items():

            if (
                field_name
                not in FieldResolver.CANONICAL_FIELDS
            ):
                continue

            if self._is_empty(value):
                continue

            detected_type = (
                FieldResolver.detect_value_type(
                    value
                )
            )

            # --------------------------------------------------
            # Une date doit rester dans date
            # --------------------------------------------------

            if (
                detected_type == "date"
                and field_name != "date"
            ):

                issues.append(
                    ConsistencyIssue(
                        severity="error",
                        field=field_name,
                        message=(
                            "Une valeur ressemblant à une date "
                            "est placée dans un autre champ."
                        ),
                        expected="date",
                        detected=detected_type,
                    )
                )

            # --------------------------------------------------
            # Un budget doit rester dans budget
            # --------------------------------------------------

            if (
                detected_type == "budget"
                and field_name != "budget"
            ):

                issues.append(
                    ConsistencyIssue(
                        severity="error",
                        field=field_name,
                        message=(
                            "Une valeur ressemblant à un budget "
                            "est placée dans un autre champ."
                        ),
                        expected="budget",
                        detected=detected_type,
                    )
                )

        return issues

    # ==========================================================
    # DOUBLONS
    # ==========================================================

    def _check_duplicate_values(
        self,
        extracted_fields: dict[str, Any],
    ) -> list[ConsistencyIssue]:

        issues = []

        normalized_values: dict[str, str] = {}

        for field_name, value in extracted_fields.items():

            if (
                field_name
                not in FieldResolver.CANONICAL_FIELDS
            ):
                continue

            if self._is_empty(value):
                continue

            normalized = FieldResolver.normalize_text(
                value
            )

            if not normalized:
                continue

            normalized_values[field_name] = normalized

        fields = list(normalized_values.keys())

        for index, first_field in enumerate(fields):

            for second_field in fields[index + 1:]:

                if (
                    normalized_values[first_field]
                    != normalized_values[second_field]
                ):
                    continue

                # Certains doublons sont parfaitement légitimes.
                # Exemple : objective et result peuvent parfois
                # reprendre une même formulation.
                allowed_pairs = {
                    frozenset(
                        {"objective", "result"}
                    ),
                    frozenset(
                        {"action", "strategy"}
                    ),
                }

                if frozenset(
                    {first_field, second_field}
                ) in allowed_pairs:
                    continue

                issues.append(
                    ConsistencyIssue(
                        severity="warning",
                        field=first_field,
                        message=(
                            f"La même valeur apparaît également "
                            f"dans le champ '{second_field}'."
                        ),
                    )
                )

        return issues

    # ==========================================================
    # COHÉRENCE ENTRE CHAMPS
    # ==========================================================

    def _check_cross_field_consistency(
        self,
        extracted_fields: dict[str, Any],
    ) -> list[ConsistencyIssue]:

        issues = []

        # ------------------------------------------------------
        # Une action vide alors qu'un responsable/date existe
        # ------------------------------------------------------

        action = extracted_fields.get("action")
        date = extracted_fields.get("date")
        responsible = extracted_fields.get("responsible")

        if (
            not self._is_empty(date)
            and not self._is_empty(responsible)
            and self._is_empty(action)
        ):

            issues.append(
                ConsistencyIssue(
                    severity="warning",
                    field="action",
                    message=(
                        "Une date et un responsable sont présents "
                        "mais aucune action n'a été identifiée."
                    ),
                )
            )

        # ------------------------------------------------------
        # Une action doit normalement être textuelle
        # ------------------------------------------------------

        if not self._is_empty(action):

            action_type = (
                FieldResolver.detect_value_type(
                    action
                )
            )

            if action_type in {
                "number",
                "percentage",
            }:

                issues.append(
                    ConsistencyIssue(
                        severity="warning",
                        field="action",
                        message=(
                            "La valeur de l'action ressemble "
                            "davantage à une valeur numérique."
                        ),
                        detected=action_type,
                    )
                )

        # ------------------------------------------------------
        # Responsable
        # ------------------------------------------------------

        if not self._is_empty(responsible):

            responsible_type = (
                FieldResolver.detect_value_type(
                    responsible
                )
            )

            if responsible_type in {
                "date",
                "budget",
                "percentage",
            }:

                issues.append(
                    ConsistencyIssue(
                        severity="error",
                        field="responsible",
                        message=(
                            "La valeur du responsable semble "
                            "appartenir à un autre type de champ."
                        ),
                        detected=responsible_type,
                    )
                )

        return issues

    # ==========================================================
    # SCORE
    # ==========================================================

    @staticmethod
    def _calculate_score(
        issues: list[ConsistencyIssue],
    ) -> float:

        score = 1.0

        for issue in issues:

            if issue.severity == "error":
                score -= 0.25

            elif issue.severity == "warning":
                score -= 0.08

        return round(
            max(0.0, min(score, 1.0)),
            2,
        )

    # ==========================================================
    # UTILITAIRES
    # ==========================================================

    @staticmethod
    def _is_empty(value: Any) -> bool:

        if value is None:
            return True

        if isinstance(value, str):
            return not value.strip()

        return False

