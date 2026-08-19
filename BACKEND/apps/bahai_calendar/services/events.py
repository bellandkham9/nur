from dataclasses import dataclass
from datetime import date

from .calendar import BahaiCalendar, get_bahai_month


# ============================================================
# TYPES D'ÉVÉNEMENTS
# ============================================================

FEAST = "FEAST"
HOLY_DAY = "HOLY_DAY"


# ============================================================
# ÉVÉNEMENT BAHÁ'Í
# ============================================================

@dataclass(frozen=True)
class BahaiEvent:
    """
    Représente un événement du calendrier bahá'í.

    Les événements sont générés dynamiquement à partir
    des règles du calendrier.
    """

    date: date
    event_type: str
    name: str
    description: str = ""
    icon: str = "📅"
    work_suspension: bool = False

    # ========================================================
    # IDENTIFIANT STABLE
    # ========================================================

    @property
    def code(self) -> str:
        """
        Code stable utilisable par le frontend,
        les notifications et les URLs.
        """

        if self.event_type == FEAST:
            month_name = self.name.replace(
                "Fête de ",
                "",
            )

            return (
                "FEAST_"
                + month_name
                .upper()
                .replace(" ", "_")
                .replace("'", "")
                .replace("’", "")
            )

        if self.event_type == HOLY_DAY:

            holy_day_codes = {
                "Naw-Rúz": "HOLY_DAY_NAW_RUZ",
                "1er jour de Ridván": "HOLY_DAY_FIRST_RIDVAN",
                "9e jour de Ridván": "HOLY_DAY_NINTH_RIDVAN",
                "12e jour de Ridván": "HOLY_DAY_TWELFTH_RIDVAN",
                "Déclaration du Báb": "HOLY_DAY_DECLARATION_BAB",
                "Ascension de Bahá'u'lláh": "HOLY_DAY_ASCENSION_BAHAULLAH",
                "Martyre du Báb": "HOLY_DAY_MARTYRDOM_BAB",
                "Naissance du Báb": "HOLY_DAY_BIRTH_BAB",
                "Naissance de Bahá'u'lláh": "HOLY_DAY_BIRTH_BAHAULLAH",
                "Jour de l'Alliance": "HOLY_DAY_COVENANT",
                "Ascension de 'Abdu'l-Bahá": "HOLY_DAY_ASCENSION_ABDUL_BAHA",
            }

            return holy_day_codes.get(
                self.name,
                "HOLY_DAY_UNKNOWN",
            )

        return self.event_type

    # ========================================================
    # JOUR SAINT
    # ========================================================

    @property
    def is_holy_day(self) -> bool:
        """
        Indique si l'événement est un Jour saint.
        """

        return self.event_type == HOLY_DAY

    # ========================================================
    # SERIALISATION
    # ========================================================

    def to_dict(self) -> dict:
        """
        Transforme l'événement en dictionnaire.

        On expose volontairement :
        - id
        - code
        - work_suspension
        - work_suspended

        afin de rester compatible avec :
        - les serializers Django existants ;
        - le frontend PWA ;
        - les futures notifications.
        """

        return {
            # Identifiant principal attendu par le serializer
            "id": self.code,

            # Code métier stable
            "code": self.code,

            # Informations principales
            "date": self.date.isoformat(),
            "event_type": self.event_type,
            "name": self.name,
            "description": self.description,
            "icon": self.icon,

            # Compatibilité frontend
            "work_suspension": self.work_suspension,

            # Compatibilité avec le serializer actuel
            "work_suspended": self.work_suspension,

            # Indique s'il s'agit d'un Jour saint
            "is_holy_day": self.is_holy_day,
        }


# ============================================================
# FÊTES DES DIX-NEUF JOURS
# ============================================================

def get_feasts(gregorian_year: int) -> list[BahaiEvent]:
    """
    Retourne les 19 Fêtes des Dix-Neuf Jours
    correspondant à l'année bahá'íe commençant
    à Naw-Rúz de l'année grégorienne donnée.
    """

    calendar = BahaiCalendar()

    events: list[BahaiEvent] = []

    for month_number in range(1, 20):

        month = get_bahai_month(month_number)

        start_date = calendar.get_bahai_month_start(
            gregorian_year,
            month_number,
        )

        events.append(
            BahaiEvent(
                date=start_date,
                event_type=FEAST,
                name=f"Fête de {month.name}",
                description=(
                    f"Fête du mois de {month.name} "
                    f"({month.meaning})."
                ),
                icon="🕊️",
                work_suspension=False,
            )
        )

    return events


# ============================================================
# JOURS SAINTS
# ============================================================

def get_holy_days(gregorian_year: int) -> list[BahaiEvent]:
    """
    Retourne les Jours saints bahá'ís
    correspondant à l'année grégorienne donnée.
    """

    events = [
        # ----------------------------------------------------
        # NAW-RÚZ
        # ----------------------------------------------------

        BahaiEvent(
            date=date(gregorian_year, 3, 21),
            event_type=HOLY_DAY,
            name="Naw-Rúz",
            description=(
                "Nouvel An bahá'í et premier jour "
                "du mois de Bahá."
            ),
            icon="🌟",
            work_suspension=True,
        ),

        # ----------------------------------------------------
        # RIDVÁN
        # ----------------------------------------------------

        BahaiEvent(
            date=date(gregorian_year, 4, 21),
            event_type=HOLY_DAY,
            name="1er jour de Ridván",
            description=(
                "Commémoration de la déclaration "
                "de Bahá'u'lláh dans le jardin de Ridván."
            ),
            icon="🌹",
            work_suspension=True,
        ),

        BahaiEvent(
            date=date(gregorian_year, 4, 29),
            event_type=HOLY_DAY,
            name="9e jour de Ridván",
            description=(
                "Commémoration du 9e jour de Ridván."
            ),
            icon="🌹",
            work_suspension=True,
        ),

        BahaiEvent(
            date=date(gregorian_year, 5, 2),
            event_type=HOLY_DAY,
            name="12e jour de Ridván",
            description=(
                "Commémoration du 12e jour de Ridván."
            ),
            icon="🌹",
            work_suspension=True,
        ),

        # ----------------------------------------------------
        # DÉCLARATION DU BÁB
        # ----------------------------------------------------

        BahaiEvent(
            date=date(gregorian_year, 5, 23),
            event_type=HOLY_DAY,
            name="Déclaration du Báb",
            description=(
                "Commémoration de la déclaration du Báb."
            ),
            icon="⭐",
            work_suspension=True,
        ),

        # ----------------------------------------------------
        # ASCENSION DE BAHÁ'U'LLÁH
        # ----------------------------------------------------

        BahaiEvent(
            date=date(gregorian_year, 5, 29),
            event_type=HOLY_DAY,
            name="Ascension de Bahá'u'lláh",
            description=(
                "Commémoration de l'ascension "
                "de Bahá'u'lláh."
            ),
            icon="⭐",
            work_suspension=True,
        ),

        # ----------------------------------------------------
        # MARTYRE DU BÁB
        # ----------------------------------------------------

        BahaiEvent(
            date=date(gregorian_year, 7, 9),
            event_type=HOLY_DAY,
            name="Martyre du Báb",
            description=(
                "Commémoration du martyre du Báb."
            ),
            icon="⭐",
            work_suspension=True,
        ),

        # ----------------------------------------------------
        # NAISSANCE DU BÁB
        # ----------------------------------------------------

        BahaiEvent(
            date=date(gregorian_year, 10, 20),
            event_type=HOLY_DAY,
            name="Naissance du Báb",
            description=(
                "Commémoration de la naissance du Báb."
            ),
            icon="⭐",
            work_suspension=True,
        ),

        # ----------------------------------------------------
        # NAISSANCE DE BAHÁ'U'LLÁH
        # ----------------------------------------------------

        BahaiEvent(
            date=date(gregorian_year, 10, 21),
            event_type=HOLY_DAY,
            name="Naissance de Bahá'u'lláh",
            description=(
                "Commémoration de la naissance "
                "de Bahá'u'lláh."
            ),
            icon="⭐",
            work_suspension=True,
        ),

        # ----------------------------------------------------
        # JOUR DE L'ALLIANCE
        # ----------------------------------------------------

        BahaiEvent(
            date=date(gregorian_year, 11, 26),
            event_type=HOLY_DAY,
            name="Jour de l'Alliance",
            description=(
                "Commémoration du Jour de l'Alliance."
            ),
            icon="🤝",
            work_suspension=False,
        ),

        # ----------------------------------------------------
        # ASCENSION DE 'ABDU'L-BAHÁ
        # ----------------------------------------------------

        BahaiEvent(
            date=date(gregorian_year, 11, 28),
            event_type=HOLY_DAY,
            name="Ascension de 'Abdu'l-Bahá",
            description=(
                "Commémoration de l'ascension "
                "de 'Abdu'l-Bahá."
            ),
            icon="⭐",
            work_suspension=False,
        ),
    ]

    return events


# ============================================================
# TOUS LES ÉVÉNEMENTS D'UNE ANNÉE
# ============================================================

def get_all_events(gregorian_year: int) -> list[dict]:
    """
    Retourne tous les événements bahá'ís
    d'une année grégorienne.

    Les événements sont triés chronologiquement.
    """

    events = [
        *get_feasts(gregorian_year),
        *get_holy_days(gregorian_year),
    ]

    events.sort(
        key=lambda event: event.date
    )

    return [
        event.to_dict()
        for event in events
    ]


# ============================================================
# ÉVÉNEMENTS ENTRE DEUX DATES
# ============================================================

def get_events_between(
    start_date: date,
    end_date: date,
) -> list[dict]:
    """
    Retourne tous les événements compris
    entre start_date et end_date inclusivement.
    """

    if start_date > end_date:
        raise ValueError(
            "La date de début doit être antérieure "
            "ou égale à la date de fin."
        )

    years = range(
        start_date.year,
        end_date.year + 1,
    )

    events: list[BahaiEvent] = []

    for year in years:

        yearly_events = get_all_events(year)

        for event in yearly_events:

            events.append(
                BahaiEvent(
                    date=date.fromisoformat(
                        event["date"]
                    ),
                    event_type=event["event_type"],
                    name=event["name"],
                    description=event["description"],
                    icon=event["icon"],
                    work_suspension=event[
                        "work_suspension"
                    ],
                )
            )

    # --------------------------------------------------------
    # FILTRAGE
    # --------------------------------------------------------

    events = [
        event
        for event in events
        if start_date <= event.date <= end_date
    ]

    # --------------------------------------------------------
    # TRI
    # --------------------------------------------------------

    events.sort(
        key=lambda event: event.date
    )

    return [
        event.to_dict()
        for event in events
    ]


# ============================================================
# PROCHAIN ÉVÉNEMENT
# ============================================================

def get_next_event(
    from_date: date | None = None,
) -> dict | None:
    """
    Retourne le prochain événement bahá'í
    à partir de la date indiquée.

    La date de référence est incluse.

    Exemple :

        get_next_event(date(2026, 8, 19))

    cherchera un événement à partir
    du 19 août 2026 inclus.
    """

    if from_date is None:
        from_date = date.today()

    # --------------------------------------------------------
    # On couvre l'année courante et les deux suivantes.
    # --------------------------------------------------------

    for year in range(
        from_date.year,
        from_date.year + 3,
    ):

        events = get_all_events(year)

        for event in events:

            event_date = date.fromisoformat(
                event["date"]
            )

            if event_date >= from_date:
                return event

    return None