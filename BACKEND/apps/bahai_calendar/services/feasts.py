from dataclasses import dataclass
from datetime import date, timedelta

from .calendar import BahaiCalendar, get_bahai_month


@dataclass(frozen=True)
class BahaiFeast:
    month_number: int
    month_name: str
    meaning: str
    date: date

    @property
    def name(self) -> str:
        return f"Fête de {self.month_name}"

    def __str__(self) -> str:
        return (
            f"{self.name} — "
            f"{self.date.strftime('%d/%m/%Y')}"
        )


def get_feasts(gregorian_year: int) -> list[BahaiFeast]:
    """
    Retourne les Fêtes des Dix-Neuf Jours
    associées à l'année grégorienne demandée.

    Une Fête est le premier jour de chacun
    des 19 mois bahá'ís.
    """

    calendar = BahaiCalendar()
    feasts: list[BahaiFeast] = []

    # On regarde deux années bahá'íes :
    # celle qui commence pendant l'année demandée
    # et celle qui a commencé l'année précédente.
    for bahai_year in (
        gregorian_year - 1843,
        gregorian_year - 1844,
    ):

        naw_ruz = calendar.get_naw_ruz(
            bahai_year + 1843
        )

        # Premier jour du mois de Bahá
        month_start = naw_ruz

        for month_number in range(1, 20):

            month = get_bahai_month(month_number)

            feast_date = month_start + timedelta(
                days=(month_number - 1) * 19
            )

            # Nous ne gardons que les dates appartenant
            # à l'année grégorienne demandée.
            if feast_date.year != gregorian_year:
                continue

            feasts.append(
                BahaiFeast(
                    month_number=month.number,
                    month_name=month.name,
                    meaning=month.meaning,
                    date=feast_date,
                )
            )

    # Évite les doublons et trie chronologiquement.
    unique = {
        (feast.month_number, feast.date): feast
        for feast in feasts
    }

    return sorted(
        unique.values(),
        key=lambda feast: feast.date,
    )