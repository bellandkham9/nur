from datetime import date

from apps.bahai_calendar.services.calendar import BahaiCalendar


calendar = BahaiCalendar()

dates = [
    date(2026, 3, 21),
    date(2026, 4, 9),
    date(2026, 8, 8),
    date(2027, 3, 20),
]


for d in dates:

    bahai = calendar.from_gregorian(d)

    print(
        f"{d} → "
        f"{bahai.day} "
        f"{bahai.month_name} "
        f"{bahai.year} BE"
    )