from dataclasses import dataclass, field
from typing import Any


@dataclass
class FieldConfidence:
    """
    Niveau de confiance attribué à une valeur extraite.
    """

    field: str
    value: Any
    confidence: float
    accepted: bool
    reasons: list[str] = field(default_factory=list)


@dataclass
class ExtractionConfidenceResult:
    """
    Résultat global de l'évaluation de confiance.
    """

    fields: dict[str, FieldConfidence]
    global_confidence: float
    accepted: bool
    warnings: list[str] = field(default_factory=list)


class ExtractionConfidenceEngine:
    """
    Évalue la fiabilité globale d'une extraction.

    Ce moteur ne fait PAS l'extraction.

    Il exploite les résultats produits par :
        - FieldResolver
        - FieldAssignmentEngine
        - ExtractionConsistencyChecker

    Objectif :
        empêcher qu'une extraction ambiguë ou incohérente
        soit considérée comme correcte.
    """

    MIN_FIELD_CONFIDENCE = 0.60
    MIN_GLOBAL_CONFIDENCE = 0.65

    # Poids utilisés dans le calcul final.
    HEADER_WEIGHT = 0.35
    VALUE_WEIGHT = 0.25
    CONSISTENCY_WEIGHT = 0.40

    # ==========================================================
    # INITIALISATION
    # ==========================================================

    def __init__(
        self,
        min_field_confidence: float | None = None,
        min_global_confidence: float | None = None,
    ):
        self.min_field_confidence = (
            min_field_confidence
            if min_field_confidence is not None
            else self.MIN_FIELD_CONFIDENCE
        )

        self.min_global_confidence = (
            min_global_confidence
            if min_global_confidence is not None
            else self.MIN_GLOBAL_CONFIDENCE
        )

    # ==========================================================
    # OUTILS
    # ==========================================================

    @staticmethod
    def clamp(value: float) -> float:
        return max(0.0, min(1.0, value))

    @staticmethod
    def normalize_score(value) -> float:
        try:
            return max(0.0, min(1.0, float(value)))
        except (TypeError, ValueError):
            return 0.0

    # ==========================================================
    # CONFIANCE D'UN CHAMP
    # ==========================================================

    def evaluate_field(
        self,
        field_name: str,
        value,
        assignment_confidence: float = 0.0,
        header_confidence: float = 0.0,
        value_confidence: float = 0.0,
        consistency_confidence: float = 0.0,
        consistency_ok: bool = True,
        reasons: list[str] | None = None,
    ) -> FieldConfidence:

        reasons = list(reasons or [])

        header_score = self.normalize_score(
            header_confidence
        )

        assignment_score = self.normalize_score(
            assignment_confidence
        )

        value_score = self.normalize_score(
            value_confidence
        )

        consistency_score = self.normalize_score(
            consistency_confidence
        )

        # ------------------------------------------------------
        # Score principal
        # ------------------------------------------------------

        score = (
            header_score * self.HEADER_WEIGHT
            + (
                (assignment_score + value_score) / 2
            ) * self.VALUE_WEIGHT
            + consistency_score * self.CONSISTENCY_WEIGHT
        )

        # ------------------------------------------------------
        # Incohérence explicite
        # ------------------------------------------------------

        if not consistency_ok:
            score *= 0.35

            reasons.append(
                "Incohérence détectée"
            )

        score = self.clamp(score)

        accepted = (
            score >= self.min_field_confidence
            and consistency_ok
        )

        if not accepted:
            reasons.append(
                "Confiance insuffisante"
            )

        return FieldConfidence(
            field=field_name,
            value=value,
            confidence=round(score, 3),
            accepted=accepted,
            reasons=reasons,
        )

    # ==========================================================
    # VALEUR SIMPLE
    # ==========================================================

    def evaluate_simple_value(
        self,
        field_name: str,
        value,
        assignment_confidence: float = 1.0,
        header_confidence: float = 1.0,
        consistency_ok: bool = True,
        consistency_confidence: float = 1.0,
        reasons: list[str] | None = None,
    ) -> FieldConfidence:

        if value is None or not str(value).strip():
            return FieldConfidence(
                field=field_name,
                value=value,
                confidence=0.0,
                accepted=False,
                reasons=[
                    "Valeur vide",
                ],
            )

        # Une valeur non vide est considérée comme
        # correctement identifiable si le moteur d'affectation
        # l'a déjà validée.
        value_confidence = 1.0

        return self.evaluate_field(
            field_name=field_name,
            value=value,
            assignment_confidence=assignment_confidence,
            header_confidence=header_confidence,
            value_confidence=value_confidence,
            consistency_confidence=consistency_confidence,
            consistency_ok=consistency_ok,
            reasons=reasons,
        )

    # ==========================================================
    # EXTRACTION COMPLÈTE
    # ==========================================================

    def evaluate_extraction(
        self,
        fields: dict[str, dict[str, Any]],
    ) -> ExtractionConfidenceResult:

        evaluated = {}
        warnings = []

        if not fields:
            return ExtractionConfidenceResult(
                fields={},
                global_confidence=0.0,
                accepted=False,
                warnings=[
                    "Aucun champ extrait"
                ],
            )

        scores = []

        for field_name, data in fields.items():

            value = data.get("value")

            result = self.evaluate_field(
                field_name=field_name,
                value=value,
                assignment_confidence=data.get(
                    "assignment_confidence",
                    0.0,
                ),
                header_confidence=data.get(
                    "header_confidence",
                    0.0,
                ),
                value_confidence=data.get(
                    "value_confidence",
                    0.0,
                ),
                consistency_confidence=data.get(
                    "consistency_confidence",
                    0.0,
                ),
                consistency_ok=data.get(
                    "consistency_ok",
                    True,
                ),
                reasons=data.get(
                    "reasons",
                    [],
                ),
            )

            evaluated[field_name] = result

            if result.accepted:
                scores.append(result.confidence)
            else:
                warnings.append(
                    f"Champ '{field_name}' non fiable"
                )

        # ------------------------------------------------------
        # Confiance globale
        # ------------------------------------------------------

        if scores:
            global_confidence = sum(scores) / len(scores)
        else:
            global_confidence = 0.0

        global_confidence = round(
            self.clamp(global_confidence),
            3,
        )

        accepted = (
            global_confidence
            >= self.min_global_confidence
        )

        if not accepted:
            warnings.append(
                "Confiance globale insuffisante"
            )

        return ExtractionConfidenceResult(
            fields=evaluated,
            global_confidence=global_confidence,
            accepted=accepted,
            warnings=warnings,
        )