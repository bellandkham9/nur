import re
import unicodedata

from dataclasses import dataclass
from datetime import date


# ============================================================
# DONNÉE PARSÉE
# ============================================================

@dataclass
class ParsedQuote:
    """
    Citation extraite de quotes.txt.

    IMPORTANT
    ----------
    quotes.txt est la source de vérité.

    Le parser ne tente PAS de recalculer la date bahá'íe
    à partir de la date grégorienne.

    Il conserve simplement ce qui est écrit dans le fichier.
    """

    date: date

    # Informations bahá'íes présentes dans le fichier.
    #
    # bahai_year reste à 0 car le fichier ne fournit pas
    # explicitement l'année BE dans l'en-tête.
    bahai_year: int
    bahai_month: int
    bahai_day: int

    moment: str

    text: str

    author: str
    source: str
    source_reference: str


# ============================================================
# PARSER
# ============================================================

class QuoteParser:
    """
    Parse quotes.txt.

    Exemple :

        10 juin - 10 Nur / Lumière

    devient :

        date        = 2026-06-10
        bahai_day   = 10
        bahai_month = 5

    Exemple :

        29 février - 4 Ayyam-i-Ha / ...

    devient :

        date        = prochaine année bissextile
        bahai_day   = 4
        bahai_month = 0

    Le calendrier bahá'í n'est jamais utilisé pour valider
    ou corriger les informations du fichier.
    """

    # ========================================================
    # CONFIGURATION
    # ========================================================

    DEFAULT_GREGORIAN_YEAR = 2026

    # ========================================================
    # EXPRESSIONS RÉGULIÈRES
    # ========================================================

    DATE_PATTERN = re.compile(
        r"""
        ^
        \s*
        (?P<gregorian_day>\d{1,2})
        \s+
        (?P<gregorian_month>[A-Za-zÀ-ÿ]+)
        \s*-\s*
        (?P<bahai_day>\d+(?:er|e)?)
        \s+
        (?P<bahai_month>
            [A-Za-zÀ-ÿ'’‘`-]+
            (?:\s+[A-Za-zÀ-ÿ'’‘`-]+)*
        )
        (?:\s*/\s*(?P<bahai_meaning>.*))?
        \s*
        $
        """,
        re.IGNORECASE | re.VERBOSE,
    )

    MOMENT_PATTERN = re.compile(
        r"^\s*\*\s*(Matin|Soir)\s*:\s*$",
        re.IGNORECASE,
    )

    # ========================================================
    # AUTEURS CONNUS
    # ========================================================

    KNOWN_AUTHORS = (
        "Baha’u’llah",
        "Bahá’u’lláh",
        "Bahá'u'lláh",
        "Baha'u'llah",
        "Bahaullah",

        "Abdu’l-Baha",
        "‘Abdu’l-Bahá",
        "‘Abdu'l-Bahá",
        "Abdu'l-Baha",
        "Abdu’l-Bahá",

        "Shoghi Effendi",

        "Le Bab",
        "Le Báb",
    )

    # ========================================================
    # MOIS BAHÁ'ÍS
    # ========================================================

    BAHAI_MONTHS = {
        "baha": 1,
        "jalal": 2,
        "jamal": 3,
        "azamat": 4,
        "nur": 5,
        "rahmat": 6,
        "kalimat": 7,
        "kamal": 8,
        "asma": 9,
        "izzat": 10,
        "mashiyyat": 11,
        "ilm": 12,
        "qudrat": 13,
        "qawl": 14,
        "masail": 15,
        "sharaf": 16,
        "sultan": 17,
        "mulk": 18,
        "ala": 19,
    }

    # ========================================================
    # AYYÁM-I-HÁ
    # ========================================================

    AYYAM_I_HA_NAMES = {
        "ayyam i ha",
        "ayyam",
    }

    # ========================================================
    # MOIS GRÉGORIENS
    # ========================================================

    GREGORIAN_MONTHS = {
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

    # ========================================================
    # CONSTRUCTEUR
    # ========================================================

    def __init__(
        self,
        gregorian_year: int = DEFAULT_GREGORIAN_YEAR,
    ):
        self.gregorian_year = gregorian_year

    # ========================================================
    # NORMALISATION
    # ========================================================

    @staticmethod
    def _normalize_text(
        value: str,
    ) -> str:
        """
        Normalise un texte uniquement pour les comparaisons.

        Exemple :

            Bahá       -> baha
            Núr        -> nur
            Masá'il    -> masail
            Ayyám-i-Há -> ayyam-i-ha
        """

        if not value:
            return ""

        value = value.lower().strip()

        value = (
            value
            .replace("’", "")
            .replace("‘", "")
            .replace("'", "")
            .replace("`", "")
        )

        value = unicodedata.normalize(
            "NFD",
            value,
        )

        value = "".join(
            char
            for char in value
            if unicodedata.category(char) != "Mn"
        )

        return value

    # ========================================================
    # FICHIER
    # ========================================================

    def parse_file(
        self,
        file_path: str,
    ) -> list[ParsedQuote]:

        with open(
            file_path,
            "r",
            encoding="utf-8-sig",
        ) as file:

            content = file.read()

        return self.parse(content)

    # ========================================================
    # AYYÁM-I-HÁ
    # ========================================================

    @classmethod
    def _is_ayyam_i_ha(
        cls,
        month_name: str,
    ) -> bool:

        normalized = cls._normalize_text(
            month_name
        )

        normalized = (
            normalized
            .replace("-", " ")
            .replace("_", " ")
        )

        normalized = re.sub(
            r"\s+",
            " ",
            normalized,
        ).strip()

        return normalized in cls.AYYAM_I_HA_NAMES

    # ========================================================
    # PARSING PRINCIPAL
    # ========================================================

    def parse(
        self,
        content: str,
    ) -> list[ParsedQuote]:

        lines = content.splitlines()

        quotes: list[ParsedQuote] = []

        current_date: date | None = None
        current_bahai_date: tuple[int, int, int] | None = None
        current_moment: str | None = None

        current_text_lines: list[str] = []

        # Année grégorienne actuellement utilisée.
        current_year = self.gregorian_year

        # Dernier mois grégorien rencontré.
        previous_month_number: int | None = None

        for raw_line in lines:

            line = raw_line.strip()

            # =================================================
            # LIGNE VIDE
            # =================================================

            if not line:

                if (
                    current_text_lines
                    and current_moment
                ):
                    current_text_lines.append("")

                continue

            # =================================================
            # EN-TÊTE DE MOIS
            # =================================================

            if self._is_month_header(line):
                continue

            # =================================================
            # NOUVELLE DATE
            # =================================================

            date_match = self.DATE_PATTERN.match(line)

            if date_match:

                # ---------------------------------------------
                # Finaliser citation précédente
                # ---------------------------------------------

                if (
                    current_text_lines
                    and current_moment
                    and current_date
                    and current_bahai_date
                ):

                    quote = self._build_quote(
                        quote_date=current_date,
                        bahai_date=current_bahai_date,
                        moment=current_moment,
                        lines=current_text_lines,
                    )

                    if quote:
                        quotes.append(quote)

                # ---------------------------------------------
                # Réinitialisation
                # ---------------------------------------------

                current_text_lines = []
                current_moment = None

                # ---------------------------------------------
                # Date grégorienne
                # ---------------------------------------------

                day = int(
                    date_match.group(
                        "gregorian_day"
                    )
                )

                gregorian_month_name = (
                    date_match.group(
                        "gregorian_month"
                    )
                )

                normalized_month = (
                    self._normalize_text(
                        gregorian_month_name
                    )
                )

                month_number = (
                    self.GREGORIAN_MONTHS.get(
                        normalized_month
                    )
                )

                if month_number is None:
                    raise ValueError(
                        "Mois grégorien inconnu : "
                        f"{gregorian_month_name}"
                    )

                # ---------------------------------------------
                # Passage à l'année suivante
                #
                # Exemple :
                #
                # 28 février 2027
                # 1er mars 2027
                #
                # ou :
                #
                # 31 décembre 2026
                # 1er janvier 2027
                # ---------------------------------------------

                if (
                    previous_month_number is not None
                    and month_number < previous_month_number
                ):
                    current_year += 1

                # ---------------------------------------------
                # CAS SPÉCIAL : 29 FÉVRIER
                # ---------------------------------------------
                #
                # Si l'année courante n'est pas bissextile,
                # on cherche la prochaine année qui possède
                # réellement le 29 février.
                #
                # Exemple :
                #
                # fichier :
                #
                # 29 février
                #
                # année courante :
                #
                # 2027
                #
                # résultat :
                #
                # 29 février 2028
                #
                # IMPORTANT :
                # current_year reste ensuite à 2028.
                # Le 1er mars suivant sera donc bien :
                #
                # 1er mars 2028
                # ---------------------------------------------

                if (
                    month_number == 2
                    and day == 29
                ):

                    while not self._is_leap_year(
                        current_year
                    ):
                        current_year += 1

                # ---------------------------------------------
                # Construire date
                # ---------------------------------------------

                current_date = (
                    self._parse_gregorian_date(
                        day=day,
                        month_name=gregorian_month_name,
                        year=current_year,
                    )
                )

                previous_month_number = month_number

                # ---------------------------------------------
                # Date bahá'íe DU FICHIER
                # ---------------------------------------------

                bahai_day_text = (
                    date_match.group(
                        "bahai_day"
                    )
                )

                bahai_month_name = (
                    date_match.group(
                        "bahai_month"
                    )
                )

                current_bahai_date = (
                    self._parse_bahai_date_from_header(
                        bahai_day_text=bahai_day_text,
                        bahai_month_name=bahai_month_name,
                    )
                )

                continue

            # =================================================
            # MATIN / SOIR
            # =================================================

            moment_match = (
                self.MOMENT_PATTERN.match(line)
            )

            if moment_match:

                # ---------------------------------------------
                # Finaliser citation précédente
                # ---------------------------------------------

                if (
                    current_text_lines
                    and current_moment
                    and current_date
                    and current_bahai_date
                ):

                    quote = self._build_quote(
                        quote_date=current_date,
                        bahai_date=current_bahai_date,
                        moment=current_moment,
                        lines=current_text_lines,
                    )

                    if quote:
                        quotes.append(quote)

                # ---------------------------------------------
                # Nouvelle citation
                # ---------------------------------------------

                current_text_lines = []

                moment_name = (
                    moment_match
                    .group(1)
                    .lower()
                    .strip()
                )

                if moment_name == "matin":
                    current_moment = "MORNING"
                else:
                    current_moment = "EVENING"

                continue

            # =================================================
            # TEXTE
            # =================================================

            if (
                current_date
                and current_moment
            ):

                current_text_lines.append(
                    raw_line.rstrip()
                )

        # ====================================================
        # DERNIÈRE CITATION
        # ====================================================

        if (
            current_text_lines
            and current_moment
            and current_date
            and current_bahai_date
        ):

            quote = self._build_quote(
                quote_date=current_date,
                bahai_date=current_bahai_date,
                moment=current_moment,
                lines=current_text_lines,
            )

            if quote:
                quotes.append(quote)

        return quotes

    # ========================================================
    # ANNÉE BISSEXTILE
    # ========================================================

    @staticmethod
    def _is_leap_year(
        year: int,
    ) -> bool:

        return (
            year % 4 == 0
            and (
                year % 100 != 0
                or year % 400 == 0
            )
        )

    # ========================================================
    # EN-TÊTE DE MOIS
    # ========================================================

    @staticmethod
    def _is_month_header(
        line: str,
    ) -> bool:

        return bool(
            re.match(
                r"^\s*MOIS\s+\d+\s*-",
                line,
                re.IGNORECASE,
            )
        )

    # ========================================================
    # CONSTRUCTION CITATION
    # ========================================================

    def _build_quote(
        self,
        quote_date: date,
        bahai_date: tuple[int, int, int],
        moment: str,
        lines: list[str],
    ) -> ParsedQuote | None:

        cleaned_lines = [
            line.rstrip()
            for line in lines
        ]

        # ---------------------------------------------
        # Nettoyage début
        # ---------------------------------------------

        while (
            cleaned_lines
            and not cleaned_lines[0].strip()
        ):
            cleaned_lines.pop(0)

        # ---------------------------------------------
        # Nettoyage fin
        # ---------------------------------------------

        while (
            cleaned_lines
            and not cleaned_lines[-1].strip()
        ):
            cleaned_lines.pop()

        if not cleaned_lines:
            return None

        # =================================================
        # RECHERCHE MÉTADONNÉES
        # =================================================

        metadata_index = None

        for index in range(
            len(cleaned_lines) - 1,
            -1,
            -1,
        ):

            line = cleaned_lines[index].strip()

            if self._looks_like_metadata(line):
                metadata_index = index
                break

        # =================================================
        # MÉTADONNÉES SUR LIGNE SÉPARÉE
        # =================================================

        if metadata_index is not None:

            text_lines = cleaned_lines[
                :metadata_index
            ]

            metadata_line = cleaned_lines[
                metadata_index
            ].strip()

        # =================================================
        # MÉTADONNÉES INLINE
        # =================================================

        else:

            last_line = cleaned_lines[-1].strip()

            extracted = (
                self._extract_inline_metadata(
                    last_line
                )
            )

            if extracted is None:

                preview = "\n".join(
                    cleaned_lines[-3:]
                )

                raise ValueError(
                    "Impossible de trouver la source "
                    "de la citation du "
                    f"{quote_date} ({moment}).\n"
                    "Dernières lignes trouvées :\n"
                    f"{preview}"
                )

            (
                text_before_metadata,
                metadata_line,
            ) = extracted

            cleaned_lines = cleaned_lines[:-1]

            if text_before_metadata.strip():

                cleaned_lines.append(
                    text_before_metadata.rstrip()
                )

            text_lines = cleaned_lines

        # =================================================
        # TEXTE
        # =================================================

        text = self._clean_quote_text(
            text_lines
        )

        if not text:
            return None

        # =================================================
        # MÉTADONNÉES
        # =================================================

        (
            author,
            source,
            reference,
        ) = self._parse_metadata(
            metadata_line
        )

        # =================================================
        # DATE BAHÁ'ÍE
        # =================================================

        (
            bahai_year,
            bahai_month,
            bahai_day,
        ) = bahai_date

        # =================================================
        # OBJET FINAL
        # =================================================

        return ParsedQuote(
            date=quote_date,

            bahai_year=bahai_year,
            bahai_month=bahai_month,
            bahai_day=bahai_day,

            moment=moment,

            text=text,

            author=author,
            source=source,
            source_reference=reference,
        )

    # ========================================================
    # MÉTADONNÉES INLINE
    # ========================================================

    @classmethod
    def _extract_inline_metadata(
        cls,
        line: str,
    ) -> tuple[str, str] | None:

        authors_pattern = "|".join(
            re.escape(author)
            for author in cls.KNOWN_AUTHORS
        )

        pattern = re.compile(
            rf"(?P<text>.*?)"
            rf"(?P<metadata>"
            rf"(?:{authors_pattern})"
            rf"\s*,\s*"
            rf".+?"
            rf")"
            rf"\s*$",
            re.IGNORECASE,
        )

        match = pattern.search(line)

        if not match:
            return None

        text = match.group(
            "text"
        ).rstrip()

        metadata = match.group(
            "metadata"
        ).strip()

        if not cls._looks_like_metadata(
            metadata
        ):
            return None

        return (
            text,
            metadata,
        )

    # ========================================================
    # DÉTECTION MÉTADONNÉES
    # ========================================================

    @classmethod
    def _looks_like_metadata(
        cls,
        line: str,
    ) -> bool:

        if "," not in line:
            return False

        first_part = (
            line
            .split(",", 1)[0]
            .strip()
        )

        normalized_first_part = (
            cls._normalize_text(
                first_part
            )
        )

        for author in cls.KNOWN_AUTHORS:

            normalized_author = (
                cls._normalize_text(
                    author
                )
            )

            if (
                normalized_first_part
                == normalized_author
            ):
                return True

        return False

    # ========================================================
    # PARSING MÉTADONNÉES
    # ========================================================

    @classmethod
    def _parse_metadata(
        cls,
        line: str,
    ) -> tuple[str, str, str]:

        parts = [
            part.strip()
            for part in line.split(",")
            if part.strip()
        ]

        if not parts:
            return "", "", ""

        author = parts[0]

        if len(parts) == 1:
            return author, "", ""

        # ----------------------------------------------------
        # Cas :
        #
        # Baha’u’llah, dans Shoghi Effendi,
        # L’Ordre mondial de Baha’u’llah, p. 113.
        # ----------------------------------------------------

        if (
            len(parts) >= 3
            and cls._normalize_text(
                parts[1]
            ).startswith("dans ")
        ):

            source = (
                parts[1]
                + ", "
                + parts[2]
            )

            reference = ""

            if len(parts) >= 4:
                reference = ", ".join(
                    parts[3:]
                )

            return (
                author,
                source,
                reference,
            )

        # ----------------------------------------------------
        # Cas normal
        # ----------------------------------------------------

        source = parts[1]

        reference = ""

        if len(parts) >= 3:
            reference = ", ".join(
                parts[2:]
            )

        return (
            author,
            source,
            reference,
        )

    # ========================================================
    # NETTOYAGE TEXTE
    # ========================================================

    @staticmethod
    def _clean_quote_text(
        lines: list[str],
    ) -> str:

        text = "\n".join(lines)

        text = re.sub(
            r"\n{3,}",
            "\n\n",
            text,
        )

        return text.strip()

    # ========================================================
    # DATE GRÉGORIENNE
    # ========================================================

    @classmethod
    def _parse_gregorian_date(
        cls,
        day: int,
        month_name: str,
        year: int,
    ) -> date:

        normalized = cls._normalize_text(
            month_name
        )

        month_number = (
            cls.GREGORIAN_MONTHS.get(
                normalized
            )
        )

        if month_number is None:

            raise ValueError(
                "Mois grégorien inconnu : "
                f"{month_name}"
            )

        try:

            return date(
                year,
                month_number,
                day,
            )

        except ValueError as exc:

            raise ValueError(
                "Date grégorienne invalide : "
                f"{day} {month_name} {year}"
            ) from exc

    # ========================================================
    # DATE BAHÁ'ÍE
    # ========================================================

    def _parse_bahai_date_from_header(
        self,
        bahai_day_text: str,
        bahai_month_name: str,
    ) -> tuple[int, int, int]:

        # ----------------------------------------------------
        # Jour
        # ----------------------------------------------------

        match = re.search(
            r"(\d+)",
            bahai_day_text,
        )

        if not match:

            raise ValueError(
                "Jour bahá'í introuvable : "
                f"{bahai_day_text}"
            )

        day = int(
            match.group(1)
        )

        # ----------------------------------------------------
        # Ayyám-i-Há
        # ----------------------------------------------------

        if self._is_ayyam_i_ha(
            bahai_month_name
        ):

            return (
                0,
                0,
                day,
            )

        # ----------------------------------------------------
        # Mois bahá'í normal
        # ----------------------------------------------------

        normalized = self._normalize_text(
            bahai_month_name
        )

        month_number = (
            self.BAHAI_MONTHS.get(
                normalized
            )
        )

        if month_number is None:

            raise ValueError(
                "Mois bahá'í inconnu : "
                f"{bahai_month_name}"
            )

        # ----------------------------------------------------
        # L'année BE n'est volontairement PAS calculée.
        # ----------------------------------------------------

        return (
            0,
            month_number,
            day,
        )