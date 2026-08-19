from dataclasses import dataclass
from datetime import date, timedelta

from .calendar_data import (
    get_naw_ruz,
    get_ayyam_i_ha_period,
)


# ============================================================
# MOIS BAHÁ'ÍS
# ============================================================

@dataclass(frozen=True)
class BahaiMonth:
    number: int
    name: str
    meaning: str


BAHAI_MONTHS = (
    BahaiMonth(1, "Bahá", "Splendeur"),
    BahaiMonth(2, "Jalál", "Gloire"),
    BahaiMonth(3, "Jamál", "Beauté"),
    BahaiMonth(4, "'Azamat", "Grandeur"),
    BahaiMonth(5, "Núr", "Lumière"),
    BahaiMonth(6, "Rahmat", "Miséricorde"),
    BahaiMonth(7, "Kalimát", "Paroles"),
    BahaiMonth(8, "Kamál", "Perfection"),
    BahaiMonth(9, "Asmá'", "Noms"),
    BahaiMonth(10, "'Izzat", "Puissance"),
    BahaiMonth(11, "Mashíyyat", "Volonté"),
    BahaiMonth(12, "'Ilm", "Connaissance"),
    BahaiMonth(13, "Qudrat", "Pouvoir"),
    BahaiMonth(14, "Qawl", "Parole"),
    BahaiMonth(15, "Masá'il", "Questions"),
    BahaiMonth(16, "Sharaf", "Honneur"),
    BahaiMonth(17, "Sultán", "Souveraineté"),
    BahaiMonth(18, "Mulk", "Domination"),
    BahaiMonth(19, "'Alá", "Élévation"),
)


def get_bahai_month(month_number: int) -> BahaiMonth:
    if not 1 <= month_number <= 19:
        raise ValueError(
            "Le numéro du mois bahá'í doit être compris "
            "entre 1 et 19."
        )

    return BAHAI_MONTHS[month_number - 1]


# ============================================================
# DATE BAHÁ'ÍE
# ============================================================

@dataclass(frozen=True)
class BahaiDate:
    year: int
    month: int
    day: int

    @property
    def month_info(self) -> BahaiMonth:
        if self.month == 0:
            raise ValueError(
                "Ayyám-i-Há n'est pas un mois bahá'í."
            )

        return get_bahai_month(self.month)

    @property
    def month_name(self) -> str:
        if self.month == 0:
            return "Ayyám-i-Há"

        return self.month_info.name

    @property
    def month_meaning(self) -> str:
        if self.month == 0:
            return "Jours intercalaires"

        return self.month_info.meaning

    def __str__(self) -> str:
        if self.month == 0:
            return (
                f"{self.day} Ayyám-i-Há "
                f"{self.year} BE"
            )

        return (
            f"{self.day} {self.month_name} "
            f"{self.year} BE"
        )


# ============================================================
# CALENDRIER BAHÁ'Í
# ============================================================

class BahaiCalendar:

    def __init__(self, naw_ruz: date | None = None):
        """
        naw_ruz permet d'injecter une date personnalisée
        pour les tests.

        En production, les données de calendar_data.py
        sont utilisées.
        """
        self.naw_ruz_override = naw_ruz

    # ========================================================
    # NAW-RÚZ
    # ========================================================

    def get_naw_ruz(self, gregorian_year: int) -> date:

        if (
            self.naw_ruz_override is not None
            and self.naw_ruz_override.year == gregorian_year
        ):
            return self.naw_ruz_override

        return get_naw_ruz(gregorian_year)

    # ========================================================
    # ANNÉE BAHÁ'ÍE
    # ========================================================

    def get_bahai_year(self, gregorian_date: date) -> int:
        """
        Retourne l'année bahá'íe correspondant
        à une date grégorienne.
        """

        try:
            current_naw_ruz = self.get_naw_ruz(
                gregorian_date.year
            )
        except ValueError:
            current_naw_ruz = None

        if (
            current_naw_ruz is not None
            and gregorian_date >= current_naw_ruz
        ):
            return current_naw_ruz.year - 1843

        previous_naw_ruz = self.get_naw_ruz(
            gregorian_date.year - 1
        )

        return previous_naw_ruz.year - 1843

    # ========================================================
    # AYYÁM-I-HÁ
    # ========================================================

    def get_ayyam_i_ha_period(
        self,
        gregorian_year: int,
    ) -> tuple[date, date]:

        return get_ayyam_i_ha_period(
            gregorian_year
        )

    def get_ayyam_i_ha_days(
        self,
        gregorian_year: int,
    ) -> int:

        start, end = self.get_ayyam_i_ha_period(
            gregorian_year
        )

        return (end - start).days + 1

    # ========================================================
    # DÉBUT D'UN MOIS BAHÁ'Í
    # ========================================================

    def get_bahai_month_start(
        self,
        gregorian_year: int,
        month_number: int,
    ) -> date:

        if not 1 <= month_number <= 19:
            raise ValueError(
                "Le numéro du mois bahá'í doit être compris "
                "entre 1 et 19."
            )

        naw_ruz = self.get_naw_ruz(
            gregorian_year
        )

        # Mois 1 à 18
        if month_number <= 18:
            return naw_ruz + timedelta(
                days=(month_number - 1) * 19
            )

        # Mois 19
        _, ayyam_end = self.get_ayyam_i_ha_period(
            gregorian_year
        )

        return ayyam_end + timedelta(days=1)

    # ========================================================
    # GRÉGORIEN → BAHÁ'Í
    # ========================================================

    def from_gregorian(
        self,
        gregorian_date: date,
    ) -> BahaiDate:

        """
        Convertit une date grégorienne
        en date bahá'íe.

        Le mois 0 représente Ayyám-i-Há.
        """

        # ----------------------------------------------------
        # Déterminer Naw-Rúz
        # ----------------------------------------------------

        try:
            naw_ruz = self.get_naw_ruz(
                gregorian_date.year
            )

        except ValueError:
            naw_ruz = self.get_naw_ruz(
                gregorian_date.year - 1
            )

        if gregorian_date < naw_ruz:
            naw_ruz = self.get_naw_ruz(
                gregorian_date.year - 1
            )

        bahai_year = naw_ruz.year - 1843

        # Nombre de jours depuis Naw-Rúz
        day_of_year = (
            gregorian_date - naw_ruz
        ).days

        # ----------------------------------------------------
        # Mois 1 à 18
        # ----------------------------------------------------

        first_18_months_days = 18 * 19

        if day_of_year < first_18_months_days:

            month = (
                day_of_year // 19
            ) + 1

            day = (
                day_of_year % 19
            ) + 1

            return BahaiDate(
                year=bahai_year,
                month=month,
                day=day,
            )

        # ----------------------------------------------------
        # Ayyám-i-Há
        # ----------------------------------------------------

        ayyam_start, ayyam_end = (
            self.get_ayyam_i_ha_period(
                naw_ruz.year
            )
        )

        if (
            ayyam_start
            <= gregorian_date
            <= ayyam_end
        ):

            day = (
                gregorian_date - ayyam_start
            ).days + 1

            return BahaiDate(
                year=bahai_year,
                month=0,
                day=day,
            )

        # ----------------------------------------------------
        # Mois 19 : 'Alá
        # ----------------------------------------------------

        ala_start = (
            ayyam_end + timedelta(days=1)
        )

        day = (
            gregorian_date - ala_start
        ).days + 1

        return BahaiDate(
            year=bahai_year,
            month=19,
            day=day,
        )

    # ========================================================
    # BAHÁ'Í → GRÉGORIEN
    # ========================================================

    def to_gregorian(
        self,
        bahai_date: BahaiDate,
    ) -> date:

        if not 0 <= bahai_date.month <= 19:
            raise ValueError(
                "Le mois bahá'í doit être compris "
                "entre 0 et 19."
            )

        if bahai_date.year < 1:
            raise ValueError(
                "L'année bahá'íe doit être positive."
            )

        # Exemple :
        # 183 BE → 2026
        gregorian_year = (
            bahai_date.year + 1843
        )

        naw_ruz = self.get_naw_ruz(
            gregorian_year
        )

        # ----------------------------------------------------
        # Mois 1 à 18
        # ----------------------------------------------------

        if 1 <= bahai_date.month <= 18:

            if not 1 <= bahai_date.day <= 19:
                raise ValueError(
                    "Un jour bahá'í doit être compris "
                    "entre 1 et 19."
                )

            days_from_naw_ruz = (
                (bahai_date.month - 1) * 19
                + (bahai_date.day - 1)
            )

            return (
                naw_ruz
                + timedelta(days=days_from_naw_ruz)
            )

        # ----------------------------------------------------
        # Ayyám-i-Há
        # ----------------------------------------------------

        if bahai_date.month == 0:

            ayyam_days = (
                self.get_ayyam_i_ha_days(
                    gregorian_year
                )
            )

            if not 1 <= bahai_date.day <= ayyam_days:
                raise ValueError(
                    f"Ayyám-i-Há comporte "
                    f"{ayyam_days} jours."
                )

            start, _ = (
                self.get_ayyam_i_ha_period(
                    gregorian_year
                )
            )

            return (
                start
                + timedelta(
                    days=bahai_date.day - 1
                )
            )

        # ----------------------------------------------------
        # Mois 19 : 'Alá
        # ----------------------------------------------------

        if not 1 <= bahai_date.day <= 19:
            raise ValueError(
                "Un jour bahá'í doit être compris "
                "entre 1 et 19."
            )

        _, ayyam_end = (
            self.get_ayyam_i_ha_period(
                gregorian_year
            )
        )

        ala_start = (
            ayyam_end
            + timedelta(days=1)
        )

        return (
            ala_start
            + timedelta(
                days=bahai_date.day - 1
            )
        )