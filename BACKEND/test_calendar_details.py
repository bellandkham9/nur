from apps.bahai_calendar.services.calendar import BahaiCalendar, get_bahai_month
from apps.bahai_calendar.services.calendar import (
    BahaiCalendar,
    BahaiDate,
)

calendar = BahaiCalendar()

print("=" * 55)
print("TEST DU CALENDRIER BAHÁ'Í")
print("=" * 55)

# Naw-Rúz
naw_ruz = calendar.get_naw_ruz(2026)

print()
print(f"Naw-Rúz 2026 : {naw_ruz}")


# Ayyám-i-Há
start, end = calendar.get_ayyam_i_ha_period()

print()
print(f"Ayyám-i-Há : {start} → {end}")
print(
    f"Nombre de jours : "
    f"{calendar.get_ayyam_i_ha_days()}"
)


# 19e mois
alá = calendar.get_bahai_month_start(2026, 19)
print()
print(f"1er jour de 'Alá : {alá}")


print()
print("✓ Test terminé")


print()
print("=" * 60)
print("TEST BAHÁ'Í → GRÉGORIEN")
print("=" * 60)

bahai_dates = [
    BahaiDate(183, 1, 1),
    BahaiDate(183, 2, 1),
    BahaiDate(183, 8, 8),
    BahaiDate(183, 0, 1),
    BahaiDate(183, 0, 4),
    BahaiDate(183, 19, 1),
    BahaiDate(183, 19, 19),
]

for bahai_date in bahai_dates:

    gregorian_date = calendar.to_gregorian(
        bahai_date
    )

    print(
        f"{bahai_date} → "
        f"{gregorian_date}"
    )

print()
print("=" * 60)
print("TEST MULTI-ANNÉES")
print("=" * 60)

for year in range(2026, 2030):

    naw_ruz = calendar.get_naw_ruz(year)

    ayyam_start, ayyam_end = (
        calendar.get_ayyam_i_ha_period(year)
    )

    print()
    print(f"Année grégorienne : {year}")
    print(f"Naw-Rúz           : {naw_ruz}")
    print(f"Ayyám-i-Há        : {ayyam_start} → {ayyam_end}")
    print(
        f"Nombre de jours   : "
        f"{calendar.get_ayyam_i_ha_days(year)}"
    )

print()
print("=" * 60)
print("TEST DES DÉBUTS DES MOIS BAHÁ'ÍS")
print("=" * 60)

for month_number in range(1, 20):

    month = get_bahai_month(month_number)

    start = calendar.get_bahai_month_start(
        2026,
        month_number,
    )

    print(
        f"{month.number:02d} | "
        f"{month.name:12} | "
        f"{month.meaning:15} | "
        f"{start}"
    )