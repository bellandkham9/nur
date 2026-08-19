from apps.daily_quotes.services.quote_parser import (
    QuoteParser,
)


parser = QuoteParser()

quotes = parser.parse_file(
    "quotes.txt"
)

print()
print("=" * 70)
print("NOMBRE DE CITATIONS :", len(quotes))
print("=" * 70)

for quote in quotes[:4]:

    print()
    print("DATE :", quote.date)
    print(
        "DATE BAHÁ'ÍE :",
        quote.bahai_day,
        quote.bahai_month,
        quote.bahai_year,
    )
    print("MOMENT :", quote.moment)
    print("AUTEUR :", quote.author)
    print("SOURCE :", quote.source)
    print("RÉFÉRENCE :", quote.source_reference)
    print("TEXTE :")
    print(quote.text[:300])
    print("-" * 70)