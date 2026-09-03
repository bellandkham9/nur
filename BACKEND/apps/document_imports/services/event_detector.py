import re
import unicodedata
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

from django.db import transaction

from apps.document_imports.models import (
    DocumentImport,
    DocumentPage,
    ExtractedTable,
    DetectedEvent,
)


class EventDetector:
    """
    Détecteur robuste d'activités dans les tableaux Excel.

    Principes :

    1. Ne jamais considérer automatiquement une ligne comme activité
       simplement parce qu'elle contient du texte.

    2. Les headers sont détectés par leur contenu réel.

    3. Les lignes statistiques, budgets, totaux et indicateurs sont
       éliminées avant toute tentative de création d'événement.

    4. Les tableaux peuvent avoir des structures différentes.

    5. Les lignes de continuation peuvent hériter du contexte
       de l'activité précédente.

    6. Le détecteur privilégie la conservation d'une vraie activité
       plutôt que sa suppression à cause d'un mauvais alignement Excel.
    """

    VERSION = 6

    # ============================================================
    # MOTS-CLÉS
    # ============================================================

    HEADER_ALIASES = {
        "action": [
            "action",
            "actions",
            "actions a mener",
            "action a mener",
            "ligne d action",
            "ligne d'action",
            "activite",
            "activites",
            "activité",
            "activités",
            "activite a realiser",
            "activité à réaliser",
        ],
        "objective": [
            "objectif",
            "objectifs",
            "objectifs specifiques",
            "objectifs spécifiques",
            "objectif specifique",
        ],
        "strategy": [
            "strategie",
            "stratégie",
            "strategies",
            "stratégies",
        ],
        "location": [
            "lieu",
            "lieux",
            "endroit",
            "localisation",
        ],
        "date": [
            "date",
            "dates",
            "periode",
            "période",
            "calendrier",
        ],
        "participants": [
            "participant",
            "participants",
            "public",
            "beneficiaire",
            "bénéficiaires",
        ],
        "responsible": [
            "responsable",
            "responsables",
            "charge",
            "chargé",
            "encadreur",
            "encadreurs",
        ],
        "result": [
            "resultat",
            "résultat",
            "resultats",
            "résultats",
            "resultats attendus",
            "résultats attendus",
        ],
        "needs": [
            "besoin",
            "besoins",
            "budget",
            "ressources",
            "moyens",
        ],
    }

    SECTION_KEYWORDS = [
        "expansion et consolidation",
        "expansion",
        "consolidation",
        "action sociale",
        "discours dans la société",
        "discours en cours dans la société",
        "vie communautaire",
        "formation",
        "budget estimatif",
        "detail du budget",
        "détail du budget",
    ]

    STATISTIC_KEYWORDS = [
        "total",
        "nombre",
        "objectif",
        "réalisation",
        "realisation",
        "ecart",
        "écart",
        "population",
        "population baha",
        "mouvement des quartiers",
        "groupe de famille",
        "tuteurs",
        "animateurs gp",
        "maitre de classes",
        "maîtres de classes",
        "hotes des rd",
        "cercle d'étude",
        "cercle d etude",
        "nouvelle ressource",
        "membre de l'asl",
        "libelles",
        "prix unitaire",
        "prix total",
        "renforcement des capacités du responsable régional des statistiques",
        "renforcement des capacites du responsable regional des statistiques",
    ]

    NON_ACTIVITY_EXACT = {
        "formation",
        "cercle d'étude",
        "cercle d etude",
        "rencontre des jeunes",
        "rencontres des jeunes",
        "nombrede jeunes a enrolé",
        "nombre de jeunes a enrolé",
        "nombre de jeunes à enrôler",
        "quartier cycle",
        "population baha'ie",
        "population bahaie",
        "population baha'ie pour les livres superieurs",
        "population bahaie pour les livres superieurs",
        "membre de l'asl",
        "nouvelle ressource",
        "nombre",
        "contacts",
        "déclaration",
        "declaration",
        "objectif",
    }

    DATE_PATTERNS = [
        r"\b\d{1,2}\s*(?:er)?\s*(?:au|à|-)\s*\d{1,2}\s+\w+",
        r"\b\d{1,2}\s*(?:er)?\s*(?:au|à|-)\s*\d{1,2}\s+\w+\s+\d{4}",
        r"\b(?:du|de)\s+\d{1,2}\s*(?:au|à|-)\s*\d{1,2}\s+\w+",
        r"\b(?:du|de)\s+\d{1,2}\s+\w+\s*(?:au|à|-)\s*\d{1,2}\s+\w+",
        r"\b(?:janvier|février|fevrier|mars|avril|mai|juin|juillet|août|aout|septembre|octobre|novembre|décembre|decembre)\b",
        r"\bchaque\s+(?:cycle|mois|semaine|dimanche|année|annee)\b",
        r"\b(?:premier|deuxième|troisième|1er|1er|2e|3e)\s+cycle\b",
        r"\b\d{4}\b",
    ]

    BUDGET_PATTERNS = [
        r"\b\d[\d\s.,]*\s*(?:fcfa|f\s*cfa)\b",
        r"\b\d[\d\s.,]*\s*(?:francs?)\b",
        r"\b\d[\d\s.,]*\s*fcfa\b",
    ]

    ACTION_VERBS = [
        "organiser",
        "organisé",
        "organiser",
        "préparer",
        "preparer",
        "contacter",
        "visiter",
        "former",
        "créer",
        "creer",
        "rencontrer",
        "consulter",
        "envoyer",
        "écrire",
        "ecrire",
        "accompagner",
        "encourager",
        "reprendre",
        "identifier",
        "fixer",
        "tenir",
        "enseigner",
        "participer",
        "mobiliser",
        "former",
        "planifier",
        "plannifier",
        "suivre",
        "impliquer",
        "réaliser",
        "realiser",
        "étudier",
        "etudier",
        "visite",
        "visiter",
        "création",
        "creation",
        "mise en place",
        "développer",
        "developper",
        "faire",
    ]

    # ============================================================
    # OUTILS TEXTE
    # ============================================================

    @staticmethod
    def normalize(value: Any) -> str:
        if value is None:
            return ""

        value = str(value).strip()

        value = unicodedata.normalize("NFKD", value)
        value = "".join(
            c for c in value
            if not unicodedata.combining(c)
        )

        value = value.lower()

        value = re.sub(r"\s+", " ", value)
        value = value.replace("’", "'")
        value = value.replace("–", "-")
        value = value.replace("—", "-")

        return value.strip()

    @staticmethod
    def clean(value: Any) -> str:
        if value is None:
            return ""

        value = str(value).strip()

        value = re.sub(r"\s+", " ", value)

        return value.strip()

    @classmethod
    def is_empty_row(cls, row: List[Any]) -> bool:
        return not any(cls.clean(v) for v in row)

    @classmethod
    def non_empty_values(cls, row: List[Any]) -> List[str]:
        return [
            cls.clean(v)
            for v in row
            if cls.clean(v)
        ]

    # ============================================================
    # DATE
    # ============================================================

    @classmethod
    def looks_like_date(cls, value: Any) -> bool:
        text = cls.normalize(value)

        if not text:
            return False

        for pattern in cls.DATE_PATTERNS:
            if re.search(pattern, text, re.IGNORECASE):
                return True

        return False

    # ============================================================
    # BUDGET
    # ============================================================

    @classmethod
    def looks_like_budget(cls, value: Any) -> bool:
        text = cls.normalize(value)

        if not text:
            return False

        for pattern in cls.BUDGET_PATTERNS:
            if re.search(pattern, text):
                return True

        # Nombre seul dans une cellule destinée au budget
        compact = text.replace(" ", "")

        if re.fullmatch(r"\d+(?:[.,]\d+)?", compact):
            try:
                number = float(compact.replace(",", "."))

                if number >= 100:
                    return True
            except ValueError:
                pass

        return False

    # ============================================================
    # HEADER
    # ============================================================

    @classmethod
    def header_field(cls, value: Any) -> Optional[str]:
        normalized = cls.normalize(value)

        if not normalized:
            return None

        for field, aliases in cls.HEADER_ALIASES.items():
            for alias in aliases:
                if normalized == cls.normalize(alias):
                    return field

        return None

    @classmethod
    def detect_header(cls, row: List[Any]) -> Tuple[bool, Dict[str, int], int]:
        """
        Détecte un header uniquement si plusieurs noms de colonnes
        sont réellement présents.

        Un seul mot comme "Objectif" ne suffit jamais.
        """

        mapping: Dict[str, int] = {}

        for index, value in enumerate(row):
            field = cls.header_field(value)

            if field and field not in mapping:
                mapping[field] = index

        score = len(mapping)

        # Un vrai header possède au minimum 3 champs connus.
        is_header = score >= 3

        return is_header, mapping, score

    # ============================================================
    # SECTION
    # ============================================================

    @classmethod
    def detect_section(cls, row: List[Any]) -> Optional[str]:
        values = cls.non_empty_values(row)

        if not values:
            return None

        text = cls.normalize(" ".join(values))

        # Une section doit être relativement courte.
        if len(text) > 100:
            return None

        for keyword in cls.SECTION_KEYWORDS:
            if cls.normalize(keyword) == text:
                return keyword.title()

            if (
                cls.normalize(keyword) in text
                and len(values) <= 2
            ):
                return keyword.title()

        # Sections numérotées
        match = re.match(
            r"^\s*\d+\.\s*(.+)$",
            text
        )

        if match:
            title = match.group(1).strip()

            if len(title) <= 80:
                return title.title()

        return None

    # ============================================================
    # STATISTIQUES
    # ============================================================

    @classmethod
    def is_statistic_row(cls, row: List[Any]) -> bool:
        values = cls.non_empty_values(row)

        if not values:
            return True

        normalized_values = [
            cls.normalize(v)
            for v in values
        ]

        joined = " ".join(normalized_values)

        # ========================================================
        # IMPORTANT :
        # "PLAN" seul n'est PAS une statistique.
        # Dans nos fichiers Excel, PLAN marque une activité planifiée.
        # ========================================================

        # --------------------------------------------------------
        # REALISATION / ECART
        # --------------------------------------------------------

        if normalized_values[0] in {
            "realisation",
            "réalisation",
            "ecart",
            "écart",
        }:
            return True

        # --------------------------------------------------------
        # TOTAL
        # --------------------------------------------------------

        if joined.startswith("total "):
            return True

        # --------------------------------------------------------
        # BUDGET
        # --------------------------------------------------------

        if (
            "detail du budget" in joined
            or "détail du budget" in joined
        ):
            return True

        # --------------------------------------------------------
        # MOTS-CLÉS STATISTIQUES EXPLICITES
        # --------------------------------------------------------

        statistical_labels = {
            "nombre",
            "population",
            "population baha",
            "population baha'ie",
            "mouvement des quartiers",
            "groupe de famille",
            "tuteurs",
            "animateurs gp",
            "maitre de classes",
            "maîtres de classes",
            "hotes des rd",
            "cercle d'étude",
            "cercle d etude",
            "nouvelle ressource",
            "membre de l'asl",
            "libelles",
            "prix unitaire",
            "prix total",
        }

        # On ne considère comme statistique que lorsque le label
        # est réellement une cellule descriptive de statistique.
        for value in normalized_values:
            if value in statistical_labels:
                return True

        # --------------------------------------------------------
        # CAS "NOMBRE DE ..."
        # --------------------------------------------------------

        first = normalized_values[0]

        if first.startswith("nombre de "):
            return True

        # --------------------------------------------------------
        # LIGNES PUREMENT NUMÉRIQUES
        # --------------------------------------------------------

        numeric_count = 0
        text_count = 0

        for value in values:

            compact = (
                cls.normalize(value)
                .replace(" ", "")
                .replace(",", ".")
            )

            if re.fullmatch(
                r"-?\d+(?:\.\d+)?",
                compact
            ):
                numeric_count += 1
            else:
                text_count += 1

        # Tableau statistique :
        # plusieurs nombres et très peu de texte.
        if (
            numeric_count >= 3
            and numeric_count > text_count
        ):
            return True

        return False
    # ============================================================
    # ACTIVITÉ
    # ============================================================

    @classmethod
    def is_non_activity_title(cls, value: str) -> bool:
        normalized = cls.normalize(value)

        if not normalized:
            return True

        if normalized in cls.NON_ACTIVITY_EXACT:
            return True

        # Indicateurs statistiques
        for keyword in [
            "nombre de ",
            "population ",
            "quartier cycle",
            "membre de l'asl",
            "nouvelle ressource",
        ]:
            if normalized.startswith(keyword):
                return True

        return False

    @classmethod
    def contains_action_verb(cls, value: str) -> bool:
        text = cls.normalize(value)

        if not text:
            return False

        return any(
            re.search(
                rf"\b{re.escape(cls.normalize(verb))}\b",
                text
            )
            for verb in cls.ACTION_VERBS
        )

    @classmethod
    def looks_like_activity_title(cls, value: str) -> bool:
        text = cls.clean(value)

        if not text:
            return False

        if cls.is_non_activity_title(text):
            return False

        normalized = cls.normalize(text)

        # Trop court
        if len(normalized) < 4:
            return False

        # Une simple année / chiffre
        if re.fullmatch(r"[\d\s./-]+", normalized):
            return False

        # Titre d'activité typique
        if cls.contains_action_verb(text):
            return True

        # Certains titres nominaux restent de vraies activités.
        nominal_patterns = [
            r"\bvisite\b",
            r"\bconférence\b",
            r"\bconference\b",
            r"\bfête\b",
            r"\bfete\b",
            r"\brencontre\b",
            r"\brencontres\b",
            r"\bespace d'orientation\b",
            r"\bjournee\b",
            r"\bjournée\b",
            r"\baccompagnement\b",
            r"\bsalubrité\b",
            r"\bsalubrite\b",
        ]

        return any(
            re.search(pattern, normalized)
            for pattern in nominal_patterns
        )

    # ============================================================
    # MAPPING DYNAMIQUE
    # ============================================================

    @classmethod
    def infer_mapping_for_legacy_table(
        cls,
        row: List[Any],
    ) -> Dict[str, int]:
        """
        Structure observée dans TABLE 3 :

        N°
        Objectif
        Action
        Stratégie
        Lieux
        Dates
        Participants
        Responsable
        Résultats
        Budget
        """

        candidates = {}

        for i, value in enumerate(row):
            normalized = cls.normalize(value)

            if cls.looks_like_date(value):
                candidates.setdefault("date", i)

            elif cls.looks_like_budget(value):
                candidates.setdefault("needs", i)

        return candidates

    @classmethod
    def infer_row_mapping(
        cls,
        row: List[Any],
        header_mapping: Optional[Dict[str, int]],
    ) -> Dict[str, str]:
        """
        Convertit une ligne brute en schéma canonique.

        Important :
        on ne fait pas confiance aveuglément aux positions.
        """

        result = {
            "action": "",
            "objective": "",
            "strategy": "",
            "location": "",
            "date": "",
            "participants": "",
            "responsible": "",
            "result": "",
            "needs": "",
        }

        # --------------------------------------------------------
        # Cas avec vrai header
        # --------------------------------------------------------

        if header_mapping:
            for field, index in header_mapping.items():
                if index < len(row):
                    result[field] = cls.clean(row[index])

            return result

        # --------------------------------------------------------
        # Structure TABLE 3
        # --------------------------------------------------------

        if len(row) >= 10:
            result["objective"] = cls.clean(row[2])
            result["action"] = cls.clean(row[3])
            result["strategy"] = cls.clean(row[4])
            result["location"] = cls.clean(row[5])
            result["date"] = cls.clean(row[6])
            result["participants"] = cls.clean(row[7])
            result["responsible"] = cls.clean(row[8])
            result["result"] = cls.clean(row[9])

            if len(row) > 10:
                result["needs"] = cls.clean(row[10])

            return result

        # --------------------------------------------------------
        # Mapping générique
        # --------------------------------------------------------

        values = [
            cls.clean(v)
            for v in row
        ]

        # Date
        for i, value in enumerate(values):
            if cls.looks_like_date(value):
                result["date"] = value
                break

        # Budget
        for i, value in enumerate(values):
            if cls.looks_like_budget(value):
                result["needs"] = value

        # Texte restant
        candidates = [
            v
            for v in values
            if v
            and v != result["date"]
            and v != result["needs"]
        ]

        if candidates:
            result["action"] = candidates[0]

        if len(candidates) > 1:
            result["objective"] = candidates[1]

        if len(candidates) > 2:
            result["strategy"] = candidates[2]

        return result

    # ============================================================
    # RÉPARATION DU MAPPING
    # ============================================================

    @classmethod
    def repair_mapping(cls, data: Dict[str, str]) -> Dict[str, str]:
        """
        Corrige les colonnes manifestement décalées.

        Exemple :

        action = "Organiser..."
        strategy = "Octobre-novembre..."
        date = "la communauté"
        responsible = "Déo et maman carine"

        devient :

        action = "Organiser..."
        strategy = ""
        date = "Octobre-novembre..."
        participants = "la communauté"
        responsible = "Déo et maman carine"
        """

        # --------------------------------------------------------
        # Date mal placée
        # --------------------------------------------------------

        date_fields = [
            "action",
            "objective",
            "strategy",
            "location",
            "participants",
            "responsible",
            "result",
            "needs",
        ]

        for field in date_fields:
            value = data.get(field, "")

            if value and cls.looks_like_date(value):
                if not data.get("date"):
                    data["date"] = value
                    data[field] = ""

        # --------------------------------------------------------
        # Budget mal placé
        # --------------------------------------------------------

        budget_fields = [
            "action",
            "objective",
            "strategy",
            "location",
            "date",
            "participants",
            "responsible",
            "result",
        ]

        for field in budget_fields:
            value = data.get(field, "")

            if value and cls.looks_like_budget(value):
                if not data.get("needs"):
                    data["needs"] = value
                    data[field] = ""

        # --------------------------------------------------------
        # Une date existe : identifier les champs voisins
        # --------------------------------------------------------

        if data.get("date"):
            # "Chaque cycle", "1er cycle" sont des dates/plannings
            # même sans date calendaire.
            pass

        # --------------------------------------------------------
        # Responsable manifestement placé dans location
        # --------------------------------------------------------

        responsible_candidates = [
            "responsible",
            "location",
            "participants",
            "strategy",
            "objective",
        ]

        if not data.get("responsible"):
            for field in responsible_candidates:
                value = data.get(field, "")

                if not value:
                    continue

                if cls.looks_like_person_or_group(value):
                    data["responsible"] = value
                    data[field] = ""
                    break

        return data

    # ============================================================
    # PERSONNES / GROUPES
    # ============================================================

    @classmethod
    def looks_like_person_or_group(cls, value: str) -> bool:
        text = cls.clean(value)

        if not text:
            return False

        normalized = cls.normalize(text)

        if cls.looks_like_date(text):
            return False

        if cls.looks_like_budget(text):
            return False

        patterns = [
            r"\bmaman\b",
            r"\bm\.\b",
            r"\bmonsieur\b",
            r"\bmme\b",
            r"\basl\b",
            r"\bcomite\b",
            r"\bcomité\b",
            r"\bresponsable\b",
            r"\bcheffe\b",
            r"\bchef\b",
        ]

        if any(re.search(p, normalized) for p in patterns):
            return True

        # Liste de personnes
        if "," in text and len(text.split()) >= 2:
            return True

        return False

    # ============================================================
    # VALIDATION D'UNE ACTIVITÉ
    # ============================================================

    @classmethod
    def validate_activity(
        cls,
        data: Dict[str, str],
    ) -> Tuple[bool, float, List[str]]:

        errors: List[str] = []

        action = cls.clean(data.get("action"))
        objective = cls.clean(data.get("objective"))
        strategy = cls.clean(data.get("strategy"))
        date = cls.clean(data.get("date"))
        location = cls.clean(data.get("location"))
        participants = cls.clean(data.get("participants"))
        responsible = cls.clean(data.get("responsible"))
        result = cls.clean(data.get("result"))
        needs = cls.clean(data.get("needs"))

        # ========================================================
        # ACTION
        # ========================================================

        if not action:
            errors.append(
                "Aucune action identifiable."
            )
            return False, 0.0, errors

        if cls.is_non_activity_title(action):
            errors.append(
                "Le titre correspond à une statistique ou un indicateur."
            )
            return False, 0.0, errors

        # ========================================================
        # SCORE
        # ========================================================

        score = 0.45

        # Verbe d'action
        if cls.contains_action_verb(action):
            score += 0.15

        # Autres informations
        if objective:
            score += 0.08

        if strategy:
            score += 0.08

        if date:
            score += 0.08

        if location:
            score += 0.05

        if participants:
            score += 0.04

        if responsible:
            score += 0.04

        if result:
            score += 0.05

        if needs:
            score += 0.03

        score = max(
            0.0,
            min(1.0, score)
        )

        return True, round(score, 2), errors

    # ============================================================
    # LIGNE DE CONTINUATION
    # ============================================================

    @classmethod
    def is_continuation_row(
        cls,
        row: List[Any],
        data: Dict[str, str],
    ) -> bool:
        values = cls.non_empty_values(row)

        if not values:
            return False

        # Pas d'action mais plusieurs autres informations.
        if not data.get("action"):
            meaningful = [
                data.get(field)
                for field in [
                    "strategy",
                    "date",
                    "responsible",
                    "location",
                    "result",
                    "needs",
                ]
                if data.get(field)
            ]

            if meaningful:
                return True

        return False

    @classmethod
    def merge_continuation(
        cls,
        previous: Dict[str, str],
        current: Dict[str, str],
    ) -> Dict[str, str]:

        result = dict(previous)

        for field in [
            "action",
            "objective",
            "strategy",
            "location",
            "date",
            "participants",
            "responsible",
            "result",
            "needs",
        ]:
            current_value = cls.clean(current.get(field))

            if not current_value:
                continue

            previous_value = cls.clean(result.get(field))

            if not previous_value:
                result[field] = current_value

            elif current_value not in previous_value:
                result[field] = (
                    previous_value
                    + " "
                    + current_value
                )

        return result

    # ============================================================
    # SCORE DE COHÉRENCE
    # ============================================================

    @classmethod
    def consistency_score(
        cls,
        data: Dict[str, str],
    ) -> float:

        score = 1.0

        action = data.get("action", "")
        objective = data.get("objective", "")
        strategy = data.get("strategy", "")
        date = data.get("date", "")
        responsible = data.get("responsible", "")
        needs = data.get("needs", "")

        if action and cls.looks_like_date(action):
            score -= 0.30

        if objective and cls.looks_like_date(objective):
            score -= 0.20

        if strategy and cls.looks_like_date(strategy):
            score -= 0.20

        if responsible and cls.looks_like_date(responsible):
            score -= 0.20

        if needs and not cls.looks_like_budget(needs):
            # Ne pas pénaliser fortement les besoins textuels.
            score -= 0.02

        if date and not cls.looks_like_date(date):
            score -= 0.05

        if (
            action
            and objective
            and cls.normalize(action) == cls.normalize(objective)
        ):
            score -= 0.05

        return round(max(0.0, min(1.0, score)), 2)

    # ============================================================
    # CONFIANCE
    # ============================================================

    @classmethod
    def confidence(
        cls,
        data: Dict[str, str],
        consistency: float,
    ) -> float:

        valid, base, _ = cls.validate_activity(data)

        if not valid:
            return 0.0

        score = base

        # Cohérence influence le score mais ne doit jamais
        # supprimer une vraie activité.
        score = (score * 0.75) + (consistency * 0.25)

        return round(max(0.0, min(1.0, score)), 2)

    # ============================================================
    # STATUT
    # ============================================================

    @classmethod
    def status_from_confidence(
        cls,
        confidence: float,
    ) -> str:

        if confidence >= 0.65:
            return "DETECTED"

        if confidence >= 0.40:
            return "REVIEW"

        return "REVIEW"

    # ============================================================
    # EXTRACTION DES DONNÉES D'UNE TABLE
    # ============================================================

    @classmethod
    def extract_table_rows(
        cls,
        table: ExtractedTable,
    ) -> List[List[Any]]:

        # Le projet possède déjà l'extraction.
        # On essaye plusieurs noms de champs possibles
        # pour rester compatible avec les modèles actuels.

        for attr in [
            "data",
            "rows",
            "content",
            "table_data",
            "extracted_data",
        ]:
            if hasattr(table, attr):
                value = getattr(table, attr)

                if callable(value):
                    try:
                        value = value()
                    except TypeError:
                        continue

                if isinstance(value, list):
                    return value

        return []

    # ============================================================
    # CRÉATION / MISE À JOUR
    # ============================================================

    @classmethod
    def build_event_payload(
        cls,
        document: DocumentImport,
        page: Optional[DocumentPage],
        data: Dict[str, str],
        confidence: float,
        consistency: float,
        row_index: int,
        category: Optional[str],
        raw_row: List[Any],
    ) -> Dict[str, Any]:

        payload = {
            "document": document,
            "page": page,

            "action": data.get("action", ""),
            "objective": data.get("objective", ""),
            "strategy": data.get("strategy", ""),
            "location": data.get("location", ""),
            "date": data.get("date", ""),
            "participants": data.get("participants", ""),
            "responsible": data.get("responsible", ""),
            "result": data.get("result", ""),
            "needs": data.get("needs", ""),

            "confidence": confidence,
            "consistency": consistency,
            "status": cls.status_from_confidence(confidence),

            # Champs techniques si le modèle les accepte.
            "_raw_row": raw_row,
            "_category": category,
            "_row_index": row_index,
        }

        return payload

    @classmethod
    def save_event(
        cls,
        payload: Dict[str, Any],
    ) -> Optional[DetectedEvent]:

        print()
        print("[EventDetector] ===== SAVE EVENT =====")

        # ========================================================
        # Champs réellement présents dans le modèle
        # ========================================================

        model_fields = {
            field.name
            for field in DetectedEvent._meta.get_fields()
            if hasattr(field, "name")
        }

        print(
            f"[EventDetector] Champs modèle : "
            f"{sorted(model_fields)}"
        )

        # ========================================================
        # Conversion du schéma EventDetector
        # vers le schéma réel DetectedEvent
        # ========================================================

        action = cls.clean(payload.get("action"))
        objective = cls.clean(payload.get("objective"))
        strategy = cls.clean(payload.get("strategy"))
        location = cls.clean(payload.get("location"))
        date = cls.clean(payload.get("date"))
        participants = cls.clean(payload.get("participants"))
        responsible = cls.clean(payload.get("responsible"))
        result = cls.clean(payload.get("result"))
        needs = cls.clean(payload.get("needs"))

        # L'action devient le titre de l'événement.
        title = action

        if not title:
            title = objective

        if not title:
            print(
                "[EventDetector] SAVE ABANDONNÉ : "
                "aucun titre/action"
            )
            return None

        # ========================================================
        # Description
        # ========================================================

        description_parts = []

        if objective and objective != title:
            description_parts.append(
                f"Objectif : {objective}"
            )

        if strategy:
            description_parts.append(
                f"Stratégie : {strategy}"
            )

        if participants:
            description_parts.append(
                f"Participants : {participants}"
            )

        if result:
            description_parts.append(
                f"Résultat attendu : {result}"
            )

        if needs:
            description_parts.append(
                f"Besoins : {needs}"
            )

        description = "\n".join(description_parts)

        # ========================================================
        # Payload compatible avec DetectedEvent
        # ========================================================

        cleaned = {}

        field_values = {
            "document": payload.get("document"),
            "page": payload.get("page"),

            "title": title,
            "objective": objective,
            "description": description,

            "location": location,
            "responsible": responsible,

            "confidence": payload.get(
                "confidence",
                0.0,
            ),

            "status": payload.get(
                "status",
                "REVIEW",
            ),

            "category": payload.get(
                "_category"
            ),

            "raw_data": payload.get(
                "_raw_row"
            ),

            "source_reference": (
                f"document:{payload.get('document').id}"
                f"|page:{getattr(payload.get('page'), 'id', '')}"
                f"|row:{payload.get('_row_index', '')}"
            ),
        }

        # ========================================================
        # Date
        # ========================================================

        # On ne convertit pas encore les dates textuelles comme
        # "Du 05 au 19 mai" en datetime.
        #
        # On laisse event_date vide tant qu'une vraie date exploitable
        # n'est pas disponible.
        #
        # Cela permet de conserver l'activité même sans date.

        # ========================================================
        # Ne garder que les champs existants
        # ========================================================

        for key, value in field_values.items():

            if key not in model_fields:
                continue

            if value in [
                None,
                "",
            ]:
                continue

            cleaned[key] = value

        print(
            f"[EventDetector] Titre : {title!r}"
        )

        print(
            f"[EventDetector] Payload compatible : "
            f"{cleaned}"
        )

        # ========================================================
        # Recherche d'un événement existant
        # ========================================================

        lookup = {
            "document": payload.get("document"),
            "title": title,
        }

        if "page" in model_fields:
            lookup["page"] = payload.get("page")

        print(
            f"[EventDetector] Lookup : {lookup}"
        )

        try:

            event = DetectedEvent.objects.filter(
                **lookup
            ).first()

            # ====================================================
            # Mise à jour
            # ====================================================

            if event:

                print(
                    f"[EventDetector] "
                    f"ÉVÉNEMENT EXISTANT : id={event.id}"
                )

                for key, value in cleaned.items():

                    if key in {
                        "document",
                        "page",
                    }:
                        continue

                    setattr(
                        event,
                        key,
                        value,
                    )

                event.save()

                print(
                    f"[EventDetector] "
                    f"MISE À JOUR OK : id={event.id}"
                )

                return event

            # ====================================================
            # Création
            # ====================================================

            print(
                "[EventDetector] CRÉATION..."
            )

            event = DetectedEvent.objects.create(
                **cleaned
            )

            print(
                f"[EventDetector] "
                f"CRÉATION OK : id={event.id}"
            )

            return event

        except Exception as exc:

            print()
            print(
                "[EventDetector] ❌ ERREUR SAUVEGARDE"
            )
            print(
                f"[EventDetector] Type : "
                f"{type(exc).__name__}"
            )
            print(
                f"[EventDetector] Message : "
                f"{exc}"
            )

            return None
            
    # ============================================================
    # ANALYSE PRINCIPALE
    # ============================================================

    @classmethod
    @transaction.atomic
    def analyze_document(
        cls,
        document_id: int,
    ) -> List[DetectedEvent]:

        document = DocumentImport.objects.get(
            pk=document_id
        )

        print()
        print("=" * 70)
        print(
            f"[EventDetector] DOCUMENT : "
            f"{getattr(document, 'filename', str(document))}"
        )
        print(
            f"[EventDetector] ID : {document.id}"
        )

        tables = ExtractedTable.objects.filter(
            page__document=document
        ).select_related("page")

        print(
            f"[EventDetector] TABLEAUX : {tables.count()}"
        )
        print(
            f"[EventDetector] VERSION : {cls.VERSION}"
        )
        print("=" * 70)

        detected_events: List[DetectedEvent] = []

        # Contexte global entre lignes
        current_category = None
        current_mapping = None
        previous_event_data = None

        for table in tables:

            page = getattr(table, "page", None)

            rows = cls.extract_table_rows(table)

            if not rows:
                continue

            table_number = getattr(
                table,
                "table_index",
                getattr(table, "number", "?"),
            )

            page_number = getattr(
                page,
                "page_number",
                getattr(page, "number", "?"),
            )

            print()
            print(
                f"[EventDetector] ===== TABLE "
                f"{table_number} / PAGE {page_number} ====="
            )

            print(
                f"[EventDetector] Nombre de lignes : "
                f"{len(rows)}"
            )

            current_mapping = None
            previous_event_data = None

            for row_index, row in enumerate(rows):

                # Toujours transformer en liste.
                if not isinstance(row, list):
                    try:
                        row = list(row)
                    except TypeError:
                        row = [row]

                print(
                    f"[EventDetector] Ligne {row_index} : "
                    f"{row}"
                )

                if cls.is_empty_row(row):
                    print(
                        f"[EventDetector] Ligne {row_index} "
                        f"-> VIDE"
                    )
                    continue

                # =================================================
                # HEADER
                # =================================================

                is_header, mapping, header_score = (
                    cls.detect_header(row)
                )

                if is_header:
                    current_mapping = mapping

                    print(
                        f"[EventDetector] Ligne {row_index} "
                        f"-> HEADER (score={header_score})"
                    )

                    print(
                        f"[EventDetector] Column map : "
                        f"{mapping}"
                    )

                    previous_event_data = None

                    continue

                # =================================================
                # SECTION
                # =================================================

                section = cls.detect_section(row)

                if section:
                    current_category = section

                    print(
                        f"[EventDetector] Ligne {row_index} "
                        f"-> SECTION : {section}"
                    )

                    previous_event_data = None

                    continue

                # =================================================
                # STATISTIQUE
                # =================================================

                if cls.is_statistic_row(row):
                    print(
                        f"[EventDetector] Ligne {row_index} "
                        f"-> STATISTIQUE ignorée"
                    )
                    continue

                # =================================================
                # EXTRACTION
                # =================================================

                data = cls.infer_row_mapping(
                    row,
                    current_mapping,
                )

                data = cls.repair_mapping(data)

                # =================================================
                # CAS SPÉCIAL : TABLE AVEC HEADER DÉCALÉ
                # =================================================

                # Si l'action détectée est vide, chercher dans toute
                # la ligne un texte qui ressemble à une action.
                if not data.get("action"):

                    candidates = []

                    for value in row:
                        value = cls.clean(value)

                        if not value:
                            continue

                        if cls.looks_like_date(value):
                            continue

                        if cls.looks_like_budget(value):
                            continue

                        if cls.is_non_activity_title(value):
                            continue

                        if cls.contains_action_verb(value):
                            candidates.append(value)

                    if candidates:
                        data["action"] = candidates[0]

                # =================================================
                # CONTINUATION
                # =================================================

                if (
                    previous_event_data
                    and cls.is_continuation_row(row, data)
                ):
                    merged = cls.merge_continuation(
                        previous_event_data,
                        data,
                    )

                    # On utilise la fusion uniquement si elle
                    # donne réellement une activité.
                    valid, _, _ = cls.validate_activity(
                        merged
                    )

                    if valid:
                        data = merged

                        print(
                            f"[EventDetector] Ligne {row_index} "
                            f"-> HÉRITAGE DU CONTEXTE"
                        )

                # =================================================
                # VALIDATION
                # =================================================

                valid, base_score, errors = (
                    cls.validate_activity(data)
                )

                if not valid:

                    # Dernière tentative :
                    # rechercher explicitement un titre d'activité
                    # dans la ligne.
                    candidates = [
                        cls.clean(v)
                        for v in row
                        if cls.looks_like_activity_title(v)
                    ]

                    if candidates:

                        candidate = candidates[0]

                        # Ne jamais utiliser un faux indicateur.
                        if not cls.is_non_activity_title(
                            candidate
                        ):
                            data["action"] = candidate

                            valid, base_score, errors = (
                                cls.validate_activity(data)
                            )

                if not valid:

                    print(
                        f"[EventDetector] Ligne {row_index} "
                        f"-> ACTIVITÉ INVALIDE"
                    )

                    continue

                # =================================================
                # COHÉRENCE
                # =================================================

                consistency = cls.consistency_score(
                    data
                )

                confidence = cls.confidence(
                    data,
                    consistency,
                )

                status = cls.status_from_confidence(
                    confidence
                )

                print(
                    f"[EventDetector] Ligne {row_index} "
                    f"-> COHÉRENCE : {consistency}"
                )

                # =================================================
                # AVERTISSEMENTS
                # =================================================

                for error in errors:
                    print(
                        f"[EventDetector]   [WARNING] "
                        f"{error}"
                    )

                # =================================================
                # PAYLOAD
                # =================================================

                payload = cls.build_event_payload(
                    document=document,
                    page=page,
                    data=data,
                    confidence=confidence,
                    consistency=consistency,
                    row_index=row_index,
                    category=current_category,
                    raw_row=row,
                )

                # =================================================
                # SAUVEGARDE
                # =================================================

                event = cls.save_event(
                    payload
                )

                if event:

                    detected_events.append(event)

                    print(
                        f"[EventDetector] "
                        f"CRÉÉ / MIS À JOUR : "
                        f"{data.get('action')} "
                        f"| confidence={confidence} "
                        f"| consistency={consistency} "
                        f"| status={status}"
                    )

                    previous_event_data = data

        # ========================================================
        # RÉSULTAT
        # ========================================================

        print()
        print("=" * 70)
        print(
            f"[EventDetector] TOTAL : "
            f"{len(detected_events)} événement(s)"
        )
        print("=" * 70)

        return detected_events
