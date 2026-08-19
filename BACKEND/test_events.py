from apps.bahai_calendar.services.events import (
    get_nineteen_day_feasts,
    get_holy_days,
    get_events,
)


print("=" * 70)
print("TEST DES ÉVÉNEMENTS BAHÁ'ÍS")
print("=" * 70)


# ============================================================
# FÊTES
# ============================================================

print("\n")
print("FÊTES DES DIX-NEUF JOURS")
print("-" * 70)

feasts = get_nineteen_day_feasts(2026)

for event in feasts:
    print(
        f"{event.date} | "
        f"{event.name:<25} | "
        f"{event.icon}"
    )


# ============================================================
# JOURS SAINTS
# ============================================================

print("\n")
print("JOURS SAINTS")
print("-" * 70)

holy_days = get_holy_days(2026)

for event in holy_days:
    print(
        f"{event.date} | "
        f"{event.name:<30} | "
        f"Suspension : "
        f"{'OUI' if event.work_suspension else 'NON'}"
    )


# ============================================================
# TOUS LES ÉVÉNEMENTS
# ============================================================

print("\n")
print("TOUS LES ÉVÉNEMENTS")
print("-" * 70)

events = get_events(2026)

for event in events:
    print(
        f"{event.date} | "
        f"{event.event_type:<10} | "
        f"{event.name}"
    )


print("\n")
print("=" * 70)
print(f"TOTAL : {len(events)} événements")
print("=" * 70)