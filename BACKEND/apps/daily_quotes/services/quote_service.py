from datetime import date
from typing import Optional

from apps.daily_quotes.models import DailyQuote
from apps.bahai_calendar.services.calendar import BahaiCalendar


class QuoteService:
    """
    Service métier des citations quotidiennes.
    """

    # ============================================================
    # CALENDRIER
    # ============================================================

    @staticmethod
    def get_bahai_date(
        gregorian_date: date,
    ):
        """
        Convertit une date grégorienne en date bahá'íe
        en utilisant le calendrier officiel de l'application.
        """

        calendar = BahaiCalendar()

        return calendar.from_gregorian(
            gregorian_date
        )

    # ============================================================
    # CITATION PAR DATE + MOMENT
    # ============================================================

    @staticmethod
    def get_quote(
        quote_date: date,
        moment: str,
    ) -> Optional[DailyQuote]:
        """
        Retourne la citation active correspondant
        à une date et un moment donnés.
        """

        return (
            DailyQuote.objects
            .filter(
                date=quote_date,
                moment=moment,
                is_active=True,
            )
            .first()
        )

    # ============================================================
    # CITATION DU MATIN
    # ============================================================

    @staticmethod
    def get_morning_quote(
        quote_date: date,
    ) -> Optional[DailyQuote]:
        """
        Retourne la citation du matin.
        """

        return QuoteService.get_quote(
            quote_date=quote_date,
            moment=DailyQuote.Moment.MORNING,
        )

    # ============================================================
    # CITATION DU SOIR
    # ============================================================

    @staticmethod
    def get_evening_quote(
        quote_date: date,
    ) -> Optional[DailyQuote]:
        """
        Retourne la citation du soir.
        """

        return QuoteService.get_quote(
            quote_date=quote_date,
            moment=DailyQuote.Moment.EVENING,
        )

    # ============================================================
    # CITATIONS D'UNE DATE
    # ============================================================

    @staticmethod
    def get_quotes_for_date(
        quote_date: date,
    ) -> dict:
        """
        Retourne les citations du matin et du soir
        ainsi que les informations du calendrier bahá'í.
        """

        bahai_date = QuoteService.get_bahai_date(
            quote_date
        )

        return {
            "date": quote_date,
            "bahai_date": bahai_date,
            "morning": QuoteService.get_morning_quote(
                quote_date
            ),
            "evening": QuoteService.get_evening_quote(
                quote_date
            ),
        }