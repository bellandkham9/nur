import os
import re
from pathlib import Path

from django.conf import settings
from apps.quiz.models import QuizQuestion


# ============================================================
# CONFIGURATION
# ============================================================

media_questions_dir = Path(
    settings.MEDIA_ROOT
) / "quiz" / "questions"

print("📁 Dossier images :", media_questions_dir)
print("📁 Existe :", media_questions_dir.exists())

if not media_questions_dir.exists():
    print("❌ Le dossier des images n'existe pas.")
else:

    # Tous les fichiers physiques disponibles
    physical_files = [
        p for p in media_questions_dir.iterdir()
        if p.is_file()
    ]

    print(
        f"🖼️ Fichiers physiques trouvés : "
        f"{len(physical_files)}"
    )

    # ========================================================
    # QUESTIONS AVEC IMAGE
    # ========================================================

    questions = (
        QuizQuestion.objects
        .exclude(image="")
        .exclude(image__isnull=True)
    )

    print(
        f"🗃️ Questions avec image en base : "
        f"{questions.count()}"
    )

    corrected = []
    already_ok = []
    not_found = []
    ambiguous = []

    # ========================================================
    # TRAITEMENT
    # ========================================================

    for question in questions:

        db_name = question.image.name

        if not db_name:
            continue

        db_filename = os.path.basename(db_name)

        # ----------------------------------------------------
        # FICHIER EXISTANT ?
        # ----------------------------------------------------

        current_path = (
            Path(settings.MEDIA_ROOT) / db_name
        )

        if current_path.exists():

            already_ok.append(
                (
                    question.id,
                    db_filename,
                )
            )

            continue

        # ----------------------------------------------------
        # NOM SANS EXTENSION
        # ----------------------------------------------------

        stem = Path(db_filename).stem
        extension = Path(db_filename).suffix.lower()

        # ----------------------------------------------------
        # RETIRER LE SUFFIXE DJANGO
        #
        # Exemple :
        #
        # tombeau_bab_ldRsM13
        #
        # devient :
        #
        # tombeau_bab
        # ----------------------------------------------------

        clean_stem = re.sub(
            r"_[A-Za-z0-9]{6,}$",
            "",
            stem,
        )

        # ----------------------------------------------------
        # RECHERCHE EXACTE
        # ----------------------------------------------------

        candidates = [
            p
            for p in physical_files
            if p.stem.lower() == clean_stem.lower()
            and p.suffix.lower() == extension
        ]

        # ----------------------------------------------------
        # UNE SEULE CORRESPONDANCE
        # ----------------------------------------------------

        if len(candidates) == 1:

            real_file = candidates[0]

            new_name = (
                f"quiz/questions/{real_file.name}"
            )

            old_name = question.image.name

            question.image.name = new_name

            question.save(
                update_fields=["image"]
            )

            corrected.append(
                (
                    question.id,
                    old_name,
                    new_name,
                )
            )

        # ----------------------------------------------------
        # AUCUNE CORRESPONDANCE
        # ----------------------------------------------------

        elif len(candidates) == 0:

            not_found.append(
                (
                    question.id,
                    db_filename,
                    clean_stem,
                )
            )

        # ----------------------------------------------------
        # PLUSIEURS CORRESPONDANCES
        # ----------------------------------------------------

        else:

            ambiguous.append(
                (
                    question.id,
                    db_filename,
                    [
                        p.name
                        for p in candidates
                    ],
                )
            )

    # ========================================================
    # RAPPORT
    # ========================================================

    print()
    print("=" * 70)
    print("                    RÉSULTAT")
    print("=" * 70)

    print(
        f"✅ Images déjà correctes : "
        f"{len(already_ok)}"
    )

    print(
        f"🔧 Images corrigées       : "
        f"{len(corrected)}"
    )

    print(
        f"⚠️ Images introuvables    : "
        f"{len(not_found)}"
    )

    print(
        f"⚠️ Correspondances ambiguës : "
        f"{len(ambiguous)}"
    )

    # ========================================================
    # DÉTAIL DES CORRECTIONS
    # ========================================================

    if corrected:

        print()
        print("🔧 CORRECTIONS EFFECTUÉES")
        print("-" * 70)

        for question_id, old_name, new_name in corrected:

            print(
                f"Question {question_id}:"
            )

            print(
                f"  ❌ {old_name}"
            )

            print(
                f"  ✅ {new_name}"
            )

    # ========================================================
    # IMAGES INTROUVABLES
    # ========================================================

    if not_found:

        print()
        print("⚠️ IMAGES INTROUVABLES")
        print("-" * 70)

        for question_id, filename, clean_name in not_found:

            print(
                f"Question {question_id} : "
                f"{filename}"
            )

    # ========================================================
    # IMAGES AMBIGUËS
    # ========================================================

    if ambiguous:

        print()
        print("⚠️ CORRESPONDANCES AMBIGUËS")
        print("-" * 70)

        for question_id, filename, candidates in ambiguous:

            print(
                f"Question {question_id} : "
                f"{filename}"
            )

            for candidate in candidates:

                print(
                    f"   → {candidate}"
                )

    print()
    print("=" * 70)
    print("✅ Vérification terminée.")
    print("=" * 70)