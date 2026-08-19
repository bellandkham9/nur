from datetime import date, timedelta


# ============================================================
# DONNÉES DU CALENDRIER BAHÁ'Í
# ============================================================
#
# Les dates sont celles du calendrier bahá'í moderne.
#
# Cette couche contient uniquement les données calendaires.
# La logique de conversion se trouve dans calendar.py.
#
# ============================================================


# ============================================================
# NAW-RÚZ
# ============================================================

NAW_RUZ_DATES: dict[int, date] = {
    2026: date(2026, 3, 21),
    2027: date(2027, 3, 21),
    2028: date(2028, 3, 20),
    2029: date(2029, 3, 20),
    2030: date(2030, 3, 20),
}


# ============================================================
# DÉBUT DES MOIS BAHÁ'ÍS
# ============================================================

BAHAI_MONTH_STARTS: dict[int, date] = {

    # Année bahá'íe 183 BE
    1: date(2026, 3, 21),    # Bahá
    2: date(2026, 4, 9),     # Jalál
    3: date(2026, 4, 28),    # Jamál
    4: date(2026, 5, 17),    # 'Azamat
    5: date(2026, 6, 5),     # Núr
    6: date(2026, 6, 24),    # Rahmat
    7: date(2026, 7, 13),    # Kalimát
    8: date(2026, 8, 1),     # Kamál
    9: date(2026, 8, 20),    # Asmá'
    10: date(2026, 9, 8),    # 'Izzat
    11: date(2026, 9, 27),   # Mashíyyat
    12: date(2026, 10, 16),  # 'Ilm
    13: date(2026, 11, 4),   # Qudrat
    14: date(2026, 11, 23),  # Qawl
    15: date(2026, 12, 12),  # Masá'il
    16: date(2026, 12, 31),  # Sharaf

    # Année grégorienne suivante
    17: date(2027, 1, 19),   # Sultán
    18: date(2027, 2, 7),    # Mulk
    19: date(2027, 3, 2),    # 'Alá
}


# ============================================================
# AYYÁM-I-HÁ
# ============================================================
#
# Ayyám-i-Há se situe entre le 18e mois (Mulk)
# et le 19e mois ('Alá).
#
# Pour l'année bahá'íe 183 BE :
#
# 26 février 2027 → 1er jour
# 27 février 2027 → 2e jour
# 28 février 2027 → 3e jour
# 1er mars 2027    → 4e jour
#
# ============================================================

AYYAM_I_HA_PERIODS: dict[int, tuple[date, date]] = {

    # Année bahá'íe 183 BE
    2026: (
        date(2027, 2, 26),
        date(2027, 3, 1),
    ),

    # Année bahá'íe 184 BE
    2027: (
        date(2028, 2, 26),
        date(2028, 2, 29),
    ),

    # Année bahá'íe 185 BE
    2028: (
        date(2029, 2, 25),
        date(2029, 2, 28),
    ),

    # Année bahá'íe 186 BE
    2029: (
        date(2030, 2, 25),
        date(2030, 2, 28),
    ),
}


# ============================================================
# FONCTIONS
# ============================================================

def get_naw_ruz(gregorian_year: int) -> date:
    """
    Retourne la date de Naw-Rúz pour l'année grégorienne donnée.
    """

    try:
        return NAW_RUZ_DATES[gregorian_year]

    except KeyError:
        raise ValueError(
            f"La date de Naw-Rúz pour {gregorian_year} "
            "n'est pas encore configurée."
        )


# ============================================================
# AYYÁM-I-HÁ
# ============================================================

def get_ayyam_i_ha_period(
    gregorian_year: int,
) -> tuple[date, date]:
    """
    Retourne le début et la fin d'Ayyám-i-Há.

    Le paramètre correspond à l'année grégorienne
    dans laquelle commence l'année bahá'íe.

    Exemple :

        get_ayyam_i_ha_period(2026)

    retourne :

        2027-02-26 → 2027-03-01
    """

    try:
        return AYYAM_I_HA_PERIODS[gregorian_year]

    except KeyError:
        raise ValueError(
            f"La période d'Ayyám-i-Há pour "
            f"{gregorian_year} n'est pas encore configurée."
        )


# ============================================================
# NOMBRE DE JOURS D'Ayyám-i-Há
# ============================================================

def get_ayyam_i_ha_days(
    gregorian_year: int,
) -> int:
    """
    Retourne le nombre de jours d'Ayyám-i-Há.
    """

    start, end = get_ayyam_i_ha_period(
        gregorian_year
    )

    return (end - start).days + 1


# ============================================================
# DÉBUT D'UN MOIS BAHÁ'Í
# ============================================================
def get_bahai_month_start(
    gregorian_year: int,
    month_number: int,
) -> date:
    """
    Retourne la date grégorienne du premier jour
    d'un mois bahá'í donné.

    Les mois 1 à 18 sont calculés directement
    depuis Naw-Rúz.

    Le mois 19 ('Alá) commence après Ayyám-i-Há.
    """

    if not 1 <= month_number <= 19:
        raise ValueError(
            "Le numéro du mois bahá'í doit être compris "
            "entre 1 et 19."
        )

    naw_ruz = get_naw_ruz(gregorian_year)

    # Mois Bahá à Mulk
    if month_number <= 18:
        return naw_ruz + timedelta(
            days=(month_number - 1) * 19
        )

    # Mois 'Alá
    _, ayyam_end = get_ayyam_i_ha_period(
        gregorian_year
    )

    return ayyam_end + timedelta(days=1)