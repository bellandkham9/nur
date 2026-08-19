import csv

with open("data/quiz/questions.csv", "r", encoding="utf-8-sig") as f:
    reader = csv.DictReader(f)

    print("Colonnes :")
    print(reader.fieldnames)

    print("\nPremières lignes :")

    for i, row in enumerate(reader):
        print(row)

        if i >= 4:
            break