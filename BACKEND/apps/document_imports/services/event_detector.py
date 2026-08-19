from datetime import datetime
import re
import unicodedata

from ..models import (
    DocumentImport,
    ExtractedTable,
    DetectedEvent,
)


class EventDetector:
    """
    Détecteur générique d'événements à partir de tableaux extraits.

    V2

    Principes :
    - Détection dynamique des colonnes.
    - Headers différents selon les sections.
    - Détection dynamique des sections.
    - Gestion des lignes sans header.
    - Gestion des lignes de continuation.
    - Héritage contrôlé des données.
    - Réinitialisation du contexte lors d'une nouvelle section.
    - Ignorance des lignes statistiques.
    - Aucun stockage de données temporaires dans DetectedEvent.
    """

    # ==========================================================
    # ALIAS DES CHAMPS
    # ==========================================================

    FIELD_ALIASES = {

        "action": [
            "ligne d'action",
            "ligne action",
            "action",
            "activité",
            "activite",
            "activité à réaliser",
            "activite a realiser",
            "activité prévue",
            "activité planifiée",
            "activité planifiee",
            "tâche",
            "tache",
            "actions à mener",
            "actions",
            "action à mener",
            "action a mener",
        ],

        "objective": [
            "objectif",
            "objectifs",
            "but",
            "finalité",
            "finalite",
            "résultat recherché",
            "resultat recherche",
            "résultat recherche",
            "resultat recherché",
        ],

        "strategy": [
            "stratégie",
            "strategie",
            "stratégies",
            "strategie proposée",
            "stratégie proposée",
            "moyen",
            "moyens",
            "méthode",
            "methode",
            "approche",
            "étape",
            "etape",
        ],

        "responsible": [
            "responsable",
            "responsables",
            "chargé",
            "charge",
            "chargée",
            "chargee",
            "personne responsable",
            "responsable de l'activité",
            "responsable activité",
            "équipe",
            "equipe",
            "coordinateur",
            "coordonnateur",
        ],

        "date": [
            "date",
            "dates",
            "échéance",
            "echeance",
            "période",
            "periode",
            "calendrier",
            "quand",
            "moment",
            "fréquence",
            "frequence",
            "cycle",
        ],

        "location": [
            "lieu",
            "lieux",
            "localisation",
            "emplacement",
            "endroit",
            "site",
            "sites",
            "lieux",
        ],

        "participants": [
            "participant",
            "participants",
            "public",
            "bénéficiaires",
            "beneficiaires",
            "personnes concernées",
            "personnes concernees",
            "groupe cible",
            "cible",
            "public cible",
            "population",
            "communauté",
            "communaute",
        ],

        "result": [
            "résultat",
            "resultat",
            "résultats",
            "resultats",
            "résultat attendu",
            "resultat attendu",
            "résultats attendus",
            "resultats attendus",
            "indicateur",
            "indicateurs",
            "objectif atteint",
        ],

        "needs": [
            "besoin",
            "besoins",
            "ressources",
            "matériel",
            "materiel",
            "moyens nécessaires",
            "moyens necessaires",
        ],

        "budget": [
            "budget",
            "coût",
            "cout",
            "prix",
            "montant",
            "financement",
            "ressources financières",
            "ressources financieres",
        ],
    }

    # ==========================================================
    # MOTS INDICATEURS D'ACTIVITÉ
    # ==========================================================

    EVENT_KEYWORDS = [
        "organiser",
        "organise",
        "organisee",
        "organisation",
        "visiter",
        "visite",
        "visites",
        "rencontrer",
        "rencontre",
        "former",
        "formation",
        "creer",
        "creation",
        "participer",
        "participation",
        "conference",
        "reunion",
        "journee",
        "fete",
        "campagne",
        "enseigner",
        "enseignement",
        "salubrite",
        "accompagner",
        "preparer",
        "reprendre contact",
        "identifier",
        "envoyer",
        "consulter",
        "planifier",
        "plannifier",
        "mettre en place",
        "developper",
        "realiser",
        "tenir",
        "lancer",
        "sensibiliser",
        "impliquer",
        "encourager",
        "suivre",
        "animer",
        "animation",
        "etude",
        "etudier",
        "renforcer",
        "maintenir",
        "continuer",
        "contacter",
        "contact",
        "accompagner",
        "créer",
        "faire",
    ]

    # ==========================================================
    # MOTS STATISTIQUES
    # ==========================================================

    STATISTICAL_KEYWORDS = [
        "nombre",
        "population",
        "objectif",
        "total",
        "ancien",
        "nouveau",
        "contacts",
        "declaration",
        "déclaration",
        "l1",
        "l2",
        "l3",
        "l4",
        "l5",
        "l6",
        "l7",
        "l8",
        "l9",
        "l10",
        "l11",
        "l12",
        "l13",
    ]

    # ==========================================================
    # SECTIONS
    # ==========================================================

    SECTION_ALIASES = {

        "Expansion et consolidation": [
            "expansion et consolidation",
            "expansion",
            "consolidation",
        ],

        "Action sociale": [
            "action sociale",
            "actions sociales",
            "service social",
        ],

        "Vie communautaire": [
            "vie communautaire",
            "activités communautaires",
            "activites communautaires",
        ],

        "Discours dans la société": [
            "discours dans la société",
            "discours dans la societe",
            "discours en cours dans la société",
            "discours en cours dans la societe",
            "discours dans la communauté",
            "discours dans la communaute",
        ],

        "Formation": [
            "formation",
            "formations",
            "institut ruhi",
        ],
    }

    # ==========================================================
    # CHAMPS
    # ==========================================================

    DATA_FIELDS = [
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
    ]

    # ==========================================================
    # ANALYSE DOCUMENT
    # ==========================================================

    @classmethod
    def analyze_document(cls, document_id):

        document = DocumentImport.objects.get(
            id=document_id
        )

        tables = (
            ExtractedTable.objects
            .filter(page__document=document)
            .select_related("page")
            .order_by("page_id", "id")
        )

        detected_events = []

        print("\n" + "=" * 70)
        print(
            f"[EventDetector] DOCUMENT : {document}"
        )
        print(
            f"[EventDetector] ID : {document_id}"
        )
        print(
            f"[EventDetector] TABLEAUX : {tables.count()}"
        )
        print("=" * 70)

        for table in tables:

            print(
                f"\n[EventDetector] "
                f"===== TABLE {table.id} / PAGE {table.page_id} ====="
            )

            try:

                events = cls.analyze_table(table)

                detected_events.extend(events)

            except Exception as exc:

                print(
                    f"[EventDetector] ERREUR TABLE "
                    f"{table.id} : "
                    f"{type(exc).__name__}: {exc}"
                )

                continue

        print("\n" + "=" * 70)
        print(
            f"[EventDetector] TOTAL : "
            f"{len(detected_events)} événement(s)"
        )
        print("=" * 70)

        return detected_events

    # ==========================================================
    # ANALYSE TABLEAU
    # ==========================================================
    @classmethod
    def _is_real_activity_row(self, row, section, column_map):
        """
        Détermine si une ligne correspond réellement à une activité
        et non à une ligne statistique, un sous-total ou une continuation.
        """

        cells = [
            str(cell).strip()
            for cell in row
            if cell is not None
        ]

        non_empty = [c for c in cells if c]

        if not non_empty:
            return False

        text = " ".join(non_empty).lower()

        # Lignes qui ne sont jamais des activités
        ignored = [
            "total",
            "objectif général",
            "nombre",
            "population baha'ie",
            "population baha'ie pour les livres superieurs",
            "membre de l'asl",
            "nouvelle ressource",
        ]

        if any(text.startswith(x) for x in ignored):
            return False

        # Lignes contenant essentiellement des niveaux de formation
        if all(
            c.upper() in {
                "L1", "L2", "L3", "L4", "L5", "L6",
                "L7", "L8", "L9", "L10", "L11", "L12", "L13"
            }
            for c in non_empty
        ):
            return False

        # Ligne statistique composée principalement de nombres
        numeric_count = 0

        for value in non_empty:
            try:
                float(
                    value.replace(" ", "")
                        .replace(",", ".")
                        .replace("%", "")
                )
                numeric_count += 1
            except ValueError:
                pass

        if numeric_count == len(non_empty):
            return False

        # Une vraie activité doit avoir une action exploitable
        action_index = column_map.get("action")

        if action_index is not None and action_index < len(row):
            action = str(row[action_index] or "").strip()

            if action:
                return True

        # Sinon on cherche une cellule textuelle suffisamment descriptive
        for value in non_empty:
            if len(value) >= 15:
                return True

        return False

   
    @classmethod
    def analyze_table(cls, table):

        rows = table.rows or []

        if not rows:
            return []

        print(
            f"[EventDetector] "
            f"Nombre de lignes : {len(rows)}"
        )

        events = []

        # ==================================================
        # DONNÉES DE LA DERNIÈRE VRAIE ACTIVITÉ
        # ==================================================

        previous_data = None

        # ==================================================
        # CONTEXTE ACTUEL
        # ==================================================

        context = {
            "category": "Autre",
            "headers": [],
            "column_map": {},
        }

        # ==================================================
        # PARCOURS DES LIGNES
        # ==================================================

        for row_index, original_row in enumerate(rows):

            row = cls.clean_row(original_row)

            if not cls.has_content(row):
                continue

            # ==================================================
            # SECTION
            # ==================================================

            section = cls.detect_section(row)

            if section:

                context["category"] = section

                # Une nouvelle section démarre un nouveau bloc
                previous_data = None

                context["headers"] = []
                context["column_map"] = {}

                print(
                    f"[EventDetector] "
                    f"Ligne {row_index} -> SECTION : {section}"
                )

                continue

            # ==================================================
            # HEADER
            # ==================================================

            score = cls.header_score(row)

            if score >= 2:

                column_map = cls.build_column_map(row)

                if len(column_map) >= 2:

                    context["headers"] = row
                    context["column_map"] = column_map

                    # IMPORTANT :
                    # un nouveau tableau logique commence
                    previous_data = None

                    print(
                        f"[EventDetector] "
                        f"Ligne {row_index} -> HEADER "
                        f"(score={score})"
                    )

                    print(
                        f"[EventDetector] "
                        f"Column map : {column_map}"
                    )

                    continue

            # ==================================================
            # LIGNES STATISTIQUES
            # ==================================================

            if cls.is_statistical_row(row, context):

                print(
                    f"[EventDetector] "
                    f"Ligne {row_index} -> STATISTIQUE ignorée"
                )

                continue

            # ==================================================
            # VALIDATION DE LA LIGNE AVANT EXTRACTION
            # ==================================================
            #
            # C'est LE point important.
            #
            # On ne doit surtout pas faire :
            #
            #     inherit_previous_values()
            #
            # avant de savoir si la ligne contient réellement
            # une activité.
            #
            # Sinon une ligne vide ou secondaire récupère
            # le titre de l'activité précédente.
            #
            # ==================================================

            if not cls._is_real_activity_row(
                row=row,
                section=context["category"],
                column_map=context["column_map"],
            ):

                print(
                    f"[EventDetector] "
                    f"Ligne {row_index} -> "
                    f"PAS UNE ACTIVITÉ"
                )

                continue

            # ==================================================
            # EXTRACTION
            # ==================================================

            if context["column_map"]:

                data = cls.extract_row_data(
                    row=row,
                    column_map=context["column_map"],
                )

            else:

                data = cls.infer_row_structure(row)

            # ==================================================
            # CONTEXTE
            # ==================================================

            data["_category"] = context["category"]
            data["_raw_row"] = row

            # ==================================================
            # CONTINUATION
            # ==================================================
            #
            # Maintenant seulement, puisque la ligne a déjà
            # été reconnue comme une vraie activité.
            #
            # ==================================================

            continuation = cls.is_continuation_row(
                data=data,
                row=row,
                previous_data=previous_data,
            )

            if continuation and previous_data:

                data = cls.inherit_previous_values(
                    data=data,
                    previous_data=previous_data,
                )

                print(
                    f"[EventDetector] "
                    f"Ligne {row_index} -> CONTINUATION"
                )

            # ==================================================
            # VÉRIFICATION ACTIVITÉ
            # ==================================================

            if not cls.is_event_row(data):

                print(
                    f"[EventDetector] "
                    f"Ligne {row_index} -> "
                    f"ACTIVITÉ INVALIDE APRÈS EXTRACTION"
                )

                continue

            # ==================================================
            # EXTRACTION ÉVÉNEMENT
            # ==================================================

            event_data = cls.extract_event_data(data)

            if not event_data.get("title"):

                print(
                    f"[EventDetector] "
                    f"Ligne {row_index} -> "
                    f"ACTIVITÉ SANS TITRE"
                )

                continue

            # ==================================================
            # CATÉGORIE
            # ==================================================

            if (
                event_data.get("category") == "Autre"
                and context["category"] != "Autre"
            ):

                event_data["category"] = (
                    context["category"]
                )

            # ==================================================
            # LOG
            # ==================================================

            print(
                f"[EventDetector] "
                f"ÉVÉNEMENT ligne {row_index} : "
                f"{event_data['title']}"
            )

            # ==================================================
            # CRÉATION
            # ==================================================

            event = cls.create_detected_event(
                table=table,
                event_data=event_data,
                row_index=row_index,
            )

            if event:

                events.append(event)

                # ==================================================
                # IMPORTANT
                # ==================================================
                #
                # previous_data ne doit être mis à jour QUE
                # lorsqu'un véritable événement a été créé.
                #
                # ==================================================

                previous_data = cls.copy_data(data)

        return events

    # ==========================================================
    # NETTOYAGE
    # ==========================================================

    @staticmethod
    def clean_row(row):

        if not row:
            return []

        result = []

        for value in row:

            if value is None:

                result.append("")

                continue

            value = str(value)

            value = re.sub(
                r"\s+",
                " ",
                value,
            ).strip()

            result.append(value)

        return result

    # ==========================================================
    # CONTENU
    # ==========================================================

    @staticmethod
    def has_content(row):

        return any(
            str(value).strip()
            for value in row
            if value is not None
        )

    # ==========================================================
    # NORMALISATION
    # ==========================================================

    @staticmethod
    def normalize_text(text):

        if text is None:

            return ""

        text = str(text).lower()

        text = unicodedata.normalize(
            "NFD",
            text,
        )

        text = "".join(
            char
            for char in text
            if unicodedata.category(char) != "Mn"
        )

        text = re.sub(
            r"\s+",
            " ",
            text,
        )

        return text.strip()

    # ==========================================================
    # SECTION
    # ==========================================================

    @classmethod
    def detect_section(cls, row):

        non_empty = [
            cls.normalize_text(cell)
            for cell in row
            if cell and str(cell).strip()
        ]

        if not non_empty:

            return None

        text = cls.normalize_text(
            " ".join(non_empty)
        )

        if len(text.split()) > 10:

            return None

        if len(non_empty) > 2:

            return None

        for category, aliases in cls.SECTION_ALIASES.items():

            for alias in aliases:

                alias_normalized = (
                    cls.normalize_text(alias)
                )

                if text == alias_normalized:

                    return category

        return None

    # ==========================================================
    # HEADER SCORE
    # ==========================================================

    @classmethod
    def header_score(cls, row):

        score = 0
        already_found = set()

        for cell in row:

            normalized = cls.normalize_text(cell)

            if not normalized:
                continue

            best_field = None
            best_score = 0

            for field, aliases in cls.FIELD_ALIASES.items():

                for alias in aliases:

                    alias_normalized = (
                        cls.normalize_text(alias)
                    )

                    if normalized == alias_normalized:

                        current_score = 100

                    elif alias_normalized in normalized:

                        current_score = len(
                            alias_normalized
                        )

                    else:

                        continue

                    if current_score > best_score:

                        best_score = current_score
                        best_field = field

            if (
                best_field
                and best_field not in already_found
            ):

                score += 1
                already_found.add(best_field)

        return score

    # ==========================================================
    # COLUMN MAP
    # ==========================================================

    @classmethod
    def build_column_map(cls, headers):

        column_map = {}

        for index, header in enumerate(headers):

            normalized = cls.normalize_text(header)

            if not normalized:

                continue

            best_field = None
            best_score = 0

            for field, aliases in cls.FIELD_ALIASES.items():

                for alias in aliases:

                    alias_normalized = (
                        cls.normalize_text(alias)
                    )

                    if normalized == alias_normalized:

                        score = 100

                    elif alias_normalized in normalized:

                        score = len(alias_normalized)

                    else:

                        continue

                    if score > best_score:

                        best_score = score
                        best_field = field

            if best_field is not None:

                column_map.setdefault(
                    best_field,
                    index,
                )

        return column_map

    # ==========================================================
    # EXTRACTION AVEC HEADER
    # ==========================================================

    @classmethod
    def extract_row_data(
        cls,
        row,
        column_map,
    ):

        data = {
            field: ""
            for field in cls.DATA_FIELDS
        }

        for field, index in column_map.items():

            if index >= len(row):

                continue

            value = row[index]

            if value is None:

                value = ""

            data[field] = str(value).strip()

        data["_raw_row"] = row

        return data

    # ==========================================================
    # DÉDUCTION SANS HEADER
    # ==========================================================

    @classmethod
    def infer_row_structure(cls, row):

        data = {
            field: ""
            for field in cls.DATA_FIELDS
        }

        data["_raw_row"] = row

        non_empty = [
            (index, str(value).strip())
            for index, value in enumerate(row)
            if value is not None
            and str(value).strip()
        ]

        if not non_empty:

            return data

        # DATE
        for index, value in non_empty:

            if cls.looks_like_date(value):

                data["date"] = value

                break

        # BUDGET
        for index, value in non_empty:

            normalized = cls.normalize_text(value)

            if (
                "fcfa" in normalized
                or "f cfa" in normalized
                or re.search(
                    r"\d[\d\s.,]*\s*(fcfa|f)\b",
                    normalized,
                )
            ):

                data["budget"] = value

                break

        # ACTION
        action_candidates = []

        for index, value in non_empty:

            normalized = cls.normalize_text(value)

            if cls.contains_event_keyword(normalized):

                action_candidates.append(
                    (index, value)
                )

        if action_candidates:

            data["action"] = (
                action_candidates[0][1]
            )

        # Fallback action
        if not data["action"]:

            for index, value in non_empty:

                if value == data["date"]:
                    continue

                if value == data["budget"]:
                    continue

                if len(value.split()) >= 2:

                    data["action"] = value

                    break

        # Autres textes
        remaining = []

        for index, value in non_empty:

            if value == data["action"]:
                continue

            if value == data["date"]:
                continue

            if value == data["budget"]:
                continue

            remaining.append(value)

        if remaining:

            data["objective"] = remaining[0]

        if len(remaining) >= 2:

            data["strategy"] = remaining[1]

        if len(remaining) >= 3:

            data["result"] = remaining[2]

        if len(remaining) >= 4:

            data["location"] = remaining[3]

        return data

    # ==========================================================
    # CONTINUATION
    # ==========================================================

    @classmethod
    def is_continuation_row(
        cls,
        data,
        row,
        previous_data=None,
    ):

        if not previous_data:

            return False

        action = (
            data.get("action", "")
            or ""
        ).strip()

        # Une nouvelle action commence un nouvel événement.
        if action:

            return False

        # Compter les informations présentes
        informative_fields = [
            "objective",
            "strategy",
            "responsible",
            "date",
            "location",
            "participants",
            "result",
            "needs",
            "budget",
        ]

        count = sum(
            1
            for field in informative_fields
            if data.get(field)
        )

        return count >= 1

    # ==========================================================
    # HÉRITAGE CONTRÔLÉ
    # ==========================================================

    @classmethod
    def inherit_previous_values(
        cls,
        data,
        previous_data,
    ):

        if not previous_data:

            return data

        fields = [
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
        ]

        for field in fields:

            if data.get(field):

                continue

            previous_value = previous_data.get(
                field,
                "",
            )

            if previous_value:

                data[field] = previous_value

        return data

    # ==========================================================
    # COPIE
    # ==========================================================

    @classmethod
    def copy_data(cls, data):

        result = {}

        for field in cls.DATA_FIELDS:

            result[field] = (
                data.get(field, "")
                or ""
            )

        result["_category"] = (
            data.get(
                "_category",
                "Autre",
            )
        )

        return result

    # ==========================================================
    # LIGNE STATISTIQUE
    # ==========================================================

    @classmethod
    def is_statistical_row(
        cls,
        row,
        context,
    ):

        text = cls.normalize_text(
            " ".join(
                str(x)
                for x in row
                if x
            )
        )

        if not text:

            return True

        # Une ligne avec un header actif
        # et une vraie action n'est pas statistique.
        if context.get("column_map"):

            action_index = context[
                "column_map"
            ].get("action")

            if action_index is not None:

                if (
                    action_index < len(row)
                    and row[action_index]
                    and cls.contains_event_keyword(
                        row[action_index]
                    )
                ):

                    return False

        words = text.split()

        statistical_count = sum(
            1
            for word in cls.STATISTICAL_KEYWORDS
            if word in text
        )

        numeric_count = sum(
            1
            for value in row
            if value
            and re.fullmatch(
                r"[\d\s.,]+",
                str(value).strip(),
            )
        )

        # Beaucoup de nombres + mots statistiques
        if (
            statistical_count >= 1
            and numeric_count >= 1
            and not cls.contains_event_keyword(text)
        ):

            return True

        # Ligne "Total Action sociale"
        if text.startswith("total "):

            return True

        # Lignes purement numériques
        if numeric_count >= 2:

            return True

        return False

    # ==========================================================
    # DONNÉES SIGNIFICATIVES
    # ==========================================================

    @classmethod
    def has_meaningful_data(cls, data):

        for field in cls.DATA_FIELDS:

            value = data.get(field, "")

            if value and str(value).strip():

                return True

        return False

    # ==========================================================
    # DÉTECTION ACTIVITÉ
    # ==========================================================

    @classmethod
    def is_event_row(cls, data):

        action = cls.normalize_text(
            data.get("action", "")
        )

        objective = cls.normalize_text(
            data.get("objective", "")
        )

        strategy = cls.normalize_text(
            data.get("strategy", "")
        )

        result = cls.normalize_text(
            data.get("result", "")
        )

        text = cls.normalize_text(
            " ".join(
                value
                for value in [
                    action,
                    objective,
                    strategy,
                    result,
                ]
                if value
            )
        )

        if not text:

            return False

        # ==================================================
        # EXCLUSIONS
        # ==================================================

        excluded_exact = [
            "total action",
            "total budget",
            "detail du budget",
            "realisation",
            "ecart",
            "objectif annuel",
            "objectif general",
            "ligne d'action",
            "nombre",
            "population",
        ]

        for word in excluded_exact:

            if text == cls.normalize_text(word):

                return False

        # Si la ligne ne contient pas de verbe/action
        # et ressemble à une statistique
        if cls.looks_like_statistical_content(data):

            return False

        # ==================================================
        # MOT D'ACTION
        # ==================================================

        if cls.contains_event_keyword(text):

            return True

        # ==================================================
        # ACTION + DATE
        # ==================================================

        if (
            action
            and data.get("date")
        ):

            return True

        # ==================================================
        # ACTION + OBJECTIF
        # ==================================================

        if action and objective:

            return True

        # ==================================================
        # ACTION seule suffisamment descriptive
        # ==================================================

        if action and len(action.split()) >= 2:

            return True

        return False

    # ==========================================================
    # STATISTIQUE DANS LES DONNÉES
    # ==========================================================

    @classmethod
    def looks_like_statistical_content(cls, data):

        action = cls.normalize_text(
            data.get("action", "")
        )

        objective = cls.normalize_text(
            data.get("objective", "")
        )

        text = cls.normalize_text(
            " ".join(
                [
                    action,
                    objective,
                ]
            )
        )

        if not text:

            return True

        statistical_terms = [
            "nombre",
            "population",
            "objectif",
            "contacts",
            "declaration",
            "ancien",
            "nouveau",
        ]

        if any(
            term in text
            for term in statistical_terms
        ):

            # Sauf si c'est clairement une action
            if not cls.contains_event_keyword(text):

                return True

        return False

    # ==========================================================
    # MOT D'ACTION
    # ==========================================================

    @classmethod
    def contains_event_keyword(cls, text):

        normalized = cls.normalize_text(text)

        for keyword in cls.EVENT_KEYWORDS:

            keyword_normalized = (
                cls.normalize_text(keyword)
            )

            if keyword_normalized in normalized:

                return True

        return False

    # ==========================================================
    # DATE
    # ==========================================================

    @staticmethod
    def looks_like_date(value):

        if not value:

            return False

        text = str(value).strip().lower()

        patterns = [

            r"\b\d{1,2}/\d{1,2}/\d{2,4}\b",

            r"\b\d{1,2}-\d{1,2}-\d{2,4}\b",

            r"\b\d{4}-\d{1,2}-\d{1,2}\b",

            r"\b\d{1,2}\s+"
            r"(janvier|février|fevrier|mars|avril|mai|juin|"
            r"juillet|août|aout|septembre|octobre|novembre|"
            r"décembre|decembre)\b",

            r"\b(lundi|mardi|mercredi|jeudi|vendredi|"
            r"samedi|dimanche)\b",

            r"\bchaque\s+"
            r"(jour|semaine|mois|cycle|dimanche)\b",

            r"\b(janvier|février|fevrier|mars|avril|mai|juin|"
            r"juillet|août|aout|septembre|octobre|novembre|"
            r"décembre|decembre)\b",
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
    # EXTRACTION ÉVÉNEMENT
    # ==========================================================

    @classmethod
    def extract_event_data(cls, data):

        action = (
            data.get("action", "")
            or ""
        ).strip()

        objective = (
            data.get("objective", "")
            or ""
        ).strip()

        strategy = (
            data.get("strategy", "")
            or ""
        ).strip()

        location = (
            data.get("location", "")
            or ""
        ).strip()

        date_text = (
            data.get("date", "")
            or ""
        ).strip()

        responsible = (
            data.get("responsible", "")
            or ""
        ).strip()

        result = (
            data.get("result", "")
            or ""
        ).strip()

        participants = (
            data.get("participants", "")
            or ""
        ).strip()

        needs = (
            data.get("needs", "")
            or ""
        ).strip()

        budget = (
            data.get("budget", "")
            or ""
        ).strip()

        # ==================================================
        # TITRE
        # ==================================================

        title = (
            action
            or objective
            or strategy
            or result
        )

        title = cls.clean_title(title)

        # ==================================================
        # DESCRIPTION
        # ==================================================

        description_parts = []

        if objective and objective != title:

            description_parts.append(
                f"Objectif : {objective}"
            )

        if strategy:

            description_parts.append(
                f"Stratégie : {strategy}"
            )

        if result:

            description_parts.append(
                f"Résultat attendu : {result}"
            )

        if participants:

            description_parts.append(
                f"Participants : {participants}"
            )

        if needs:

            description_parts.append(
                f"Besoins : {needs}"
            )

        if budget:

            description_parts.append(
                f"Budget : {budget}"
            )

        description = "\n".join(
            description_parts
        )

        # ==================================================
        # CATÉGORIE
        # ==================================================

        category = cls.detect_category(
            objective,
            action,
            strategy,
        )

        # ==================================================
        # DATE
        # ==================================================

        event_date = cls.parse_date(
            date_text
        )

        return {

            "title": title[:255],

            "description": description,

            "event_date": event_date,

            "location": location[:255],

            "responsible": responsible[:255],

            "objective": objective,

            "category": category,

            "confidence": cls.calculate_confidence(
                data
            ),

            "raw_data": data,

            "source_reference": date_text[:255],
        }

    # ==========================================================
    # TITRE
    # ==========================================================

    @staticmethod
    def clean_title(title):

        if not title:

            return ""

        title = re.sub(
            r"\s+",
            " ",
            str(title),
        ).strip()

        return title

    # ==========================================================
    # CATÉGORIE
    # ==========================================================

    @classmethod
    def detect_category(
        cls,
        objective,
        action,
        strategy,
    ):

        text = cls.normalize_text(
            " ".join(
                [
                    objective or "",
                    action or "",
                    strategy or "",
                ]
            )
        )

        if any(
            word in text
            for word in [
                "expansion",
                "enseignement",
                "enseigner",
                "visite",
                "visiter",
            ]
        ):

            return "Expansion et consolidation"

        if any(
            word in text
            for word in [
                "orphelinat",
                "social",
                "salubrite",
                "service social",
            ]
        ):

            return "Action sociale"

        if any(
            word in text
            for word in [
                "discours",
                "chef",
                "mairie",
                "police",
                "zone",
                "quartier",
            ]
        ):

            return "Discours dans la société"

        if any(
            word in text
            for word in [
                "formation",
                "cercle",
                "institut ruhi",
            ]
        ):

            return "Formation"

        if any(
            word in text
            for word in [
                "sport",
                "journee sportive",
                "communautaire",
            ]
        ):

            return "Vie communautaire"

        return "Autre"

    # ==========================================================
    # CONFIANCE
    # ==========================================================

    @classmethod
    def calculate_confidence(cls, data):

        score = 0.0

        if data.get("action"):

            score += 0.30

        if data.get("objective"):

            score += 0.20

        if data.get("strategy"):

            score += 0.10

        if data.get("location"):

            score += 0.10

        if data.get("date"):

            score += 0.10

        if data.get("responsible"):

            score += 0.10

        if data.get("result"):

            score += 0.10

        return round(
            min(score, 1.0),
            2,
        )

    # ==========================================================
    # CRÉATION / MISE À JOUR
    # ==========================================================

    @classmethod
    def create_detected_event(
        cls,
        table,
        event_data,
        row_index,
    ):

        document = table.page.document

        existing = (
            DetectedEvent.objects
            .filter(
                document=document,
                title=event_data["title"],
            )
            .first()
        )

        # ==================================================
        # EXISTANT
        # ==================================================

        if existing:

            changed = False

            fields_to_update = [
                "description",
                "event_date",
                "location",
                "responsible",
                "objective",
                "category",
                "confidence",
                "source_reference",
            ]

            for field in fields_to_update:

                new_value = event_data.get(
                    field
                )

                if new_value is None:

                    continue

                old_value = getattr(
                    existing,
                    field,
                    None,
                )

                if new_value != old_value:

                    setattr(
                        existing,
                        field,
                        new_value,
                    )

                    changed = True

            if changed:

                existing.save()

            return existing

        # ==================================================
        # NOUVEAU
        # ==================================================

        return DetectedEvent.objects.create(

            document=document,

            page=table.page,

            title=event_data["title"],

            description=event_data["description"],

            event_date=event_data["event_date"],

            location=event_data["location"],

            responsible=event_data["responsible"],

            objective=event_data["objective"],

            category=event_data["category"],

            confidence=event_data["confidence"],

            status=DetectedEvent.Status.DETECTED,

            raw_data={
                "row_index": row_index,
                **event_data["raw_data"],
            },

            source_reference=event_data[
                "source_reference"
            ],
        )

    # ==========================================================
    # PARSING DATE
    # ==========================================================

    @classmethod
    def parse_date(cls, value):

        if not value:

            return None

        text = str(value).strip()

        formats = [
            "%d/%m/%Y",
            "%d/%m/%y",
            "%d-%m-%Y",
            "%d-%m-%y",
            "%Y-%m-%d",
        ]

        for date_format in formats:

            try:

                return datetime.strptime(
                    text,
                    date_format,
                ).date()

            except ValueError:

                pass

        normalized = cls.normalize_text(
            text
        )

        french_months = {

            "janvier": 1,
            "fevrier": 2,
            "mars": 3,
            "avril": 4,
            "mai": 5,
            "juin": 6,
            "juillet": 7,
            "aout": 8,
            "septembre": 9,
            "octobre": 10,
            "novembre": 11,
            "decembre": 12,
        }

        match = re.search(
            r"(\d{1,2})\s+"
            r"(janvier|fevrier|mars|avril|mai|juin|"
            r"juillet|aout|septembre|octobre|novembre|"
            r"decembre)\s+"
            r"(\d{4})",
            normalized,
        )

        if match:

            day = int(
                match.group(1)
            )

            month_name = (
                match.group(2)
            )

            year = int(
                match.group(3)
            )

            month = french_months.get(
                month_name
            )

            if month:

                try:

                    return datetime(
                        year,
                        month,
                        day,
                    ).date()

                except ValueError:

                    pass

        return None
