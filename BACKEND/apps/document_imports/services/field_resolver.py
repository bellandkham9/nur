import re
import unicodedata
from dataclasses import dataclass
from difflib import SequenceMatcher

@dataclass
class FieldMatch:
    """
    Résultat de la résolution d'un champ.
    """

    field: str | None
    confidence: float
    reason: str


class FieldResolver:
    """
    Résout les champs extraits d'un document vers les champs
    canoniques de l'application.

    Le système ne dépend PAS de la position de la colonne.

    Il utilise principalement :
    - le nom du header ;
    - les synonymes ;
    - la normalisation linguistique ;
    - le type de valeur ;
    - le contenu de la valeur ;
    - des règles de cohérence.
    """

    # ==========================================================
    # CHAMPS CANONIQUES
    # ==========================================================

    CANONICAL_FIELDS = (
        "action",
        "objective",
        "strategy",
        "responsible",
        "date",
        "location",
        "participants",
        "result",
        "needs",
        "budget",
    )

    # ==========================================================
    # SYNONYMES
    # ==========================================================

    FIELD_ALIASES = {

        "action": [
            "action",
            "actions",
            "action a mener",
            "actions a mener",
            "action à mener",
            "actions à mener",
            "ligne action",
            "ligne d action",
            "ligne d'action",
            "ligne dactivite",
            "ligne d'activité",
            "activite",
            "activité",
            "activites",
            "activités",
            "activite prevue",
            "activité prévue",
            "activites prevues",
            "activités prévues",
            "activite planifiee",
            "activité planifiée",
            "tache",
            "tâche",
            "travail a faire",
            "travail à faire",
        ],

        "objective": [
            "objectif",
            "objectifs",
            "objectif general",
            "objectif général",
            "objectifs generaux",
            "objectifs généraux",
            "objectif specifique",
            "objectif spécifique",
            "objectifs specifiques",
            "objectifs spécifiques",
            "but",
            "finalite",
            "finalité",
            "resultat recherche",
            "résultat recherché",
        ],

        "strategy": [
            "strategie",
            "stratégie",
            "strategies",
            "stratégies",
            "strategie proposee",
            "stratégie proposée",
            "methode",
            "méthode",
            "approche",
            "moyen",
            "moyens",
            "moyens de mise en oeuvre",
            "moyens de mise en œuvre",
        ],

        "responsible": [
            "responsable",
            "responsables",
            "personne responsable",
            "personnes responsables",
            "personne en charge",
            "personnes en charge",
            "charge",
            "chargé",
            "chargee",
            "chargée",
            "charge de l activite",
            "chargé de l'activité",
            "chargee de l activite",
            "chargée de l'activité",
            "equipe",
            "équipe",
            "equipe responsable",
            "équipe responsable",
            "coordinateur",
            "coordonnateur",
            "coordination",
            "chef de file",
            "point focal",
            "structure responsable",
            "structure porteuse",
            "entite responsable",
            "entité responsable",
            "porteur",
            "porteur de l action",
            "pilote",
            "personne chargee du suivi",
            "personne chargée du suivi",
        ],
        "date": [
            "date",
            "dates",
            "periode",
            "période",
            "echeance",
            "échéance",
            "date prevue",
            "date prévue",
            "date de realisation",
            "date de réalisation",
            "periode prevue",
            "période prévue",
            "calendrier",
            "planning",
            "planning prevu",
            "planning prévu",
            "calendrier prevu",
            "calendrier prévu",
            "quand",
            "moment",
            "frequence",
            "fréquence",
            "cycle",
            "delai",
            "délai",
        ],
        "location": [
            "lieu",
            "lieux",
            "localisation",
            "emplacement",
            "endroit",
            "site",
            "sites",
            "zone",
            "zone d intervention",
            "zone d'intervention",
            "lieu d intervention",
            "lieu d'intervention",
        ],

        "participants": [
            "participant",
            "participants",
            "public",
            "public cible",
            "beneficiaire",
            "bénéficiaire",
            "beneficiaires",
            "bénéficiaires",
            "personnes concernees",
            "personnes concernées",
            "groupe cible",
            "cible",
            "population cible",
            "population",
            "communaute",
            "communauté",
        ],

        "result": [
            "resultat",
            "résultat",
            "resultats",
            "résultats",
            "resultat attendu",
            "résultat attendu",
            "resultats attendus",
            "résultats attendus",
            "indicateur",
            "indicateurs",
            "objectif atteint",
            "livrable",
            "livrables",
        ],

        "needs": [
            "besoin",
            "besoins",
            "ressource",
            "ressources",
            "materiel",
            "matériel",
            "moyens necessaires",
            "moyens nécessaires",
            "ressources necessaires",
            "ressources nécessaires",
        ],

        "budget": [
            "budget",
            "budget estimatif",
            "budget prevu",
            "budget prévu",
            "cout",
            "coût",
            "cout estime",
            "coût estimé",
            "cout total",
            "coût total",
            "prix",
            "montant",
            "montant prevu",
            "montant prévu",
            "financement",
            "ressources financieres",
            "ressources financières",
            "prix unitaire",
            "prix total",
            "enveloppe",
            "enveloppe budgetaire",
            "enveloppe budgétaire",
        ],

    }

    # ==========================================================
    # NORMALISATION
    # ==========================================================

    @staticmethod
    def normalize_text(value) -> str:
        """
        Normalisation linguistique commune.

        Exemple :
            "Activités prévues"
            ->
            "activites prevues"
        """

        if value is None:
            return ""

        text = str(value).strip().lower()

        text = unicodedata.normalize(
            "NFD",
            text,
        )

        text = "".join(
            char
            for char in text
            if unicodedata.category(char) != "Mn"
        )

        text = text.replace("_", " ")
        text = text.replace("-", " ")

        text = re.sub(
            r"[^\w\s%€$]",
            " ",
            text,
        )

        text = re.sub(
            r"\s+",
            " ",
            text,
        )

        return text.strip()

    # ==========================================================
    # RESOLUTION DU HEADER
    # ==========================================================


    @classmethod
    def resolve_header(cls, header) -> FieldMatch:
        """
        Résout un header vers un champ canonique.

        Le score combine plusieurs niveaux :

        1. correspondance exacte ;
        2. correspondance par mots ;
        3. correspondance partielle ;
        4. similarité textuelle ;
        5. pénalité lorsque la correspondance est trop faible.

        Le système ne dépend pas de la position de la colonne.
        """

        normalized = cls.normalize_text(header)

        if not normalized:
            return FieldMatch(
                field=None,
                confidence=0.0,
                reason="Header vide",
            )

        best_field = None
        best_score = 0.0
        best_alias = None
        best_reason = None

        header_words = set(normalized.split())

        for field, aliases in cls.FIELD_ALIASES.items():

            for alias in aliases:

                alias_normalized = cls.normalize_text(alias)

                if not alias_normalized:
                    continue

                alias_words = set(alias_normalized.split())

                # ==================================================
                # 1. CORRESPONDANCE EXACTE
                # ==================================================

                if normalized == alias_normalized:

                    score = 1.0
                    reason = "Correspondance exacte"

                else:

                    # ==============================================
                    # 2. CORRESPONDANCE PAR MOTS
                    # ==============================================

                    common_words = (
                        header_words & alias_words
                    )

                    if common_words:

                        word_score = (
                            len(common_words)
                            / max(len(alias_words), 1)
                        )

                    else:

                        word_score = 0.0

                    # ==============================================
                    # 3. INCLUSION
                    # ==============================================

                    if alias_normalized in normalized:

                        containment_score = 0.90

                    elif normalized in alias_normalized:

                        containment_score = 0.80

                    else:

                        containment_score = 0.0

                    # ==============================================
                    # 4. SIMILARITÉ TEXTUELLE
                    # ==============================================

                    similarity = SequenceMatcher(
                        None,
                        normalized,
                        alias_normalized,
                    ).ratio()

                    # ==============================================
                    # SCORE GLOBAL
                    # ==============================================

                    score = max(
                        word_score * 0.85,
                        containment_score,
                        similarity * 0.75,
                    )

                    if score == containment_score and score > 0:
                        reason = "Correspondance partielle"

                    elif word_score > 0:
                        reason = "Correspondance par mots"

                    elif similarity >= 0.70:
                        reason = "Similarité textuelle"

                    else:
                        reason = "Correspondance faible"

                # ==================================================
                # CONSERVATION DU MEILLEUR SCORE
                # ==================================================

                if score > best_score:

                    best_score = score
                    best_field = field
                    best_alias = alias_normalized
                    best_reason = reason

        # ==========================================================
        # SEUIL DE SÉCURITÉ
        # ==========================================================

        if best_field is None:

            return FieldMatch(
                field=None,
                confidence=0.0,
                reason="Aucune correspondance",
            )

        # Un score faible ne doit PAS provoquer une affectation
        # arbitraire.

        if best_score < 0.55:

            return FieldMatch(
                field=None,
                confidence=round(best_score, 2),
                reason=(
                    f"Correspondance insuffisante avec "
                    f"'{best_alias}'"
                ),
            )

        return FieldMatch(
            field=best_field,
            confidence=round(
                min(best_score, 1.0),
                2,
            ),
            reason=(
                f"{best_reason} : "
                f"'{normalized}' → "
                f"'{best_alias}'"
            ),
        )


    @classmethod
    def resolve_header_candidates(
        cls,
        header,
        min_confidence: float = 0.45,
    ) -> list[FieldMatch]:
        """
        Retourne tous les champs plausibles pour un header,
        classés par confiance décroissante.

        Utile pour les headers ambigus.
        """

        normalized = cls.normalize_text(header)

        if not normalized:
            return []

        candidates = []

        for field in cls.CANONICAL_FIELDS:

            match = cls._score_header_against_field(
                normalized,
                field,
            )

            if (
                match.field
                and match.confidence >= min_confidence
            ):
                candidates.append(match)

        candidates.sort(
            key=lambda item: item.confidence,
            reverse=True,
        )

        return candidates



    @classmethod
    def _score_header_against_field(
        cls,
        normalized_header: str,
        field: str,
    ) -> FieldMatch:

        best_score = 0.0
        best_alias = None
        best_reason = None

        header_words = set(
            normalized_header.split()
        )

        for alias in cls.FIELD_ALIASES.get(field, []):

            alias_normalized = cls.normalize_text(alias)

            if not alias_normalized:
                continue

            alias_words = set(
                alias_normalized.split()
            )

            # Exact
            if normalized_header == alias_normalized:

                score = 1.0
                reason = "Correspondance exacte"

            else:

                common = (
                    header_words & alias_words
                )

                word_score = (
                    len(common)
                    / max(len(alias_words), 1)
                )

                if alias_normalized in normalized_header:

                    containment = 0.90

                elif normalized_header in alias_normalized:

                    containment = 0.80

                else:

                    containment = 0.0

                similarity = SequenceMatcher(
                    None,
                    normalized_header,
                    alias_normalized,
                ).ratio()

                score = max(
                    word_score * 0.85,
                    containment,
                    similarity * 0.75,
                )

                reason = "Analyse sémantique du header"

            if score > best_score:

                best_score = score
                best_alias = alias_normalized
                best_reason = reason

        if best_score < 0.45:

            return FieldMatch(
                field=None,
                confidence=round(best_score, 2),
                reason="Score insuffisant",
            )

        return FieldMatch(
            field=field,
            confidence=round(
                min(best_score, 1.0),
                2,
            ),
            reason=(
                f"{best_reason} avec "
                f"'{best_alias}'"
            ),
        )

    # ==========================================================
    # TYPE DE VALEUR
    # ==========================================================

    @classmethod
    def detect_value_type(cls, value) -> str:

        text = cls.normalize_text(value)

        if not text:
            return "empty"

        if cls.looks_like_date(text):
            return "date"

        if cls.looks_like_budget(text):
            return "budget"

        if cls.looks_like_percentage(text):
            return "percentage"

        if cls.looks_like_number(text):
            return "number"

        return "text"

    # ==========================================================
    # DATE
    # ==========================================================

    @classmethod
    def looks_like_date(cls, value) -> bool:

        text = cls.normalize_text(value)

        if not text:
            return False

        patterns = [

            r"\b\d{1,2}/\d{1,2}/\d{2,4}\b",

            r"\b\d{1,2}-\d{1,2}-\d{2,4}\b",

            r"\b\d{4}-\d{1,2}-\d{1,2}\b",

            r"\b\d{1,2}\s+"
            r"(janvier|fevrier|mars|avril|mai|juin|"
            r"juillet|aout|septembre|octobre|novembre|"
            r"decembre)\b",

            r"\b(lundi|mardi|mercredi|jeudi|vendredi|"
            r"samedi|dimanche)\b",

            r"\bchaque\s+"
            r"(jour|semaine|mois|cycle|dimanche)\b",

            r"\b(janvier|fevrier|mars|avril|mai|juin|"
            r"juillet|aout|septembre|octobre|novembre|"
            r"decembre)\b",
        ]

        return any(
            re.search(
                pattern,
                text,
                re.IGNORECASE,
            )
            for pattern in patterns
        )

    # ==========================================================
    # BUDGET
    # ==========================================================

    @classmethod
    def looks_like_budget(cls, value) -> bool:

        text = cls.normalize_text(value)

        if not text:
            return False

        if re.search(
            r"\b(fcfa|f cfa|xaf)\b",
            text,
        ):
            return True

        if re.search(
            r"\b\d[\d\s.,]*\s*(f|francs?)\b",
            text,
        ):
            return True

        return False

    # ==========================================================
    # POURCENTAGE
    # ==========================================================

    @classmethod
    def looks_like_percentage(cls, value) -> bool:

        text = cls.normalize_text(value)

        return bool(
            re.fullmatch(
                r"\d+(?:[.,]\d+)?\s*%",
                text,
            )
        )

    # ==========================================================
    # NOMBRE
    # ==========================================================

    @classmethod
    def looks_like_number(cls, value) -> bool:

        text = cls.normalize_text(value)

        return bool(
            re.fullmatch(
                r"\d+(?:[.,]\d+)?",
                text,
            )
        )

    # ==========================================================
    # VALIDATION HEADER + VALEUR
    # ==========================================================

    @classmethod
    def validate_value_for_field(
        cls,
        field: str,
        value,
    ) -> FieldMatch:

        if field not in cls.CANONICAL_FIELDS:

            return FieldMatch(
                field=None,
                confidence=0.0,
                reason="Champ canonique inconnu",
            )

        if value is None or not str(value).strip():

            return FieldMatch(
                field=field,
                confidence=0.0,
                reason="Valeur vide",
            )

        value_type = cls.detect_value_type(value)

        # ------------------------------------------------------
        # Une date ne doit pas devenir une action
        # ------------------------------------------------------

        if (
            field == "action"
            and value_type == "date"
        ):

            return FieldMatch(
                field=None,
                confidence=0.0,
                reason="Valeur détectée comme date",
            )

        # ------------------------------------------------------
        # Un montant ne doit pas devenir une action
        # ------------------------------------------------------

        if (
            field == "action"
            and value_type == "budget"
        ):

            return FieldMatch(
                field=None,
                confidence=0.0,
                reason="Valeur détectée comme budget",
            )

        # ------------------------------------------------------
        # Une date dans un autre champ est suspecte
        # ------------------------------------------------------

        if (
            field not in {"date", "objective", "result"}
            and value_type == "date"
        ):

            return FieldMatch(
                field=None,
                confidence=0.0,
                reason="Valeur incompatible : date",
            )

        # ------------------------------------------------------
        # Un budget dans un autre champ est suspect
        # ------------------------------------------------------

        if (
            field not in {"budget", "needs"}
            and value_type == "budget"
        ):

            return FieldMatch(
                field=None,
                confidence=0.0,
                reason="Valeur incompatible : budget",
            )

        return FieldMatch(
            field=field,
            confidence=1.0,
            reason="Valeur compatible avec le champ",
        )