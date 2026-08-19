import os
import re
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand
from django.db import transaction

from apps.quiz.models import QuizQuestion


class Command(BaseCommand):

    help = (
        "Répare automatiquement les références "
        "d'images des questions du quiz."
    )

    def handle(self, *args, **options):

        # ======================================================
        # DOSSIER DES IMAGES
        # ======================================================

        images_dir = (
            Path(settings.MEDIA_ROOT)
            / "quiz"
            / "questions"
        )

        if not images_dir.exists():

            self.stdout.write(
                self.style.ERROR(
                    f"Dossier introuvable : {images_dir}"
                )
            )

            return

        self.stdout.write("")
        self.stdout.write("=" * 70)
        self.stdout.write(
            "       CORRECTION DES IMAGES DU QUIZ"
        )
        self.stdout.write("=" * 70)
        self.stdout.write("")

        self.stdout.write(
            f"📁 Dossier : {images_dir}"
        )

        # ======================================================
        # FICHIERS PHYSIQUES
        # ======================================================

        physical_files = [
            file
            for file in images_dir.iterdir()
            if file.is_file()
        ]

        self.stdout.write(
            f"🖼️ Fichiers trouvés : "
            f"{len(physical_files)}"
        )

        # ======================================================
        # QUESTIONS AVEC IMAGE
        # ======================================================

        questions = (
            QuizQuestion.objects
            .exclude(image="")
            .exclude(image__isnull=True)
        )

        self.stdout.write(
            f"🗃️ Images en base : "
            f"{questions.count()}"
        )

        self.stdout.write("")

        # ======================================================
        # STATISTIQUES
        # ======================================================

        already_ok = []
        corrected = []
        not_found = []
        ambiguous = []

        # ======================================================
        # TRAITEMENT
        # ======================================================

        for question in questions:

            db_name = question.image.name

            if not db_name:
                continue

            db_filename = os.path.basename(
                db_name
            )

            current_path = (
                Path(settings.MEDIA_ROOT)
                / db_name
            )

            # --------------------------------------------------
            # IMAGE DÉJÀ CORRECTE
            # --------------------------------------------------

            if current_path.exists():

                already_ok.append(
                    (
                        question.id,
                        db_filename,
                    )
                )

                continue

            # --------------------------------------------------
            # NOM DU FICHIER
            # --------------------------------------------------

            original_stem = Path(
                db_filename
            ).stem

            extension = Path(
                db_filename
            ).suffix.lower()

            # --------------------------------------------------
            # SUPPRESSION DU SUFFIXE DJANGO
            #
            # Exemple :
            #
            # tombeau_bab_ldRsM13.jpg
            #
            # devient :
            #
            # tombeau_bab.jpg
            # --------------------------------------------------

            clean_stem = re.sub(
                r"_[A-Za-z0-9]{6,}$",
                "",
                original_stem,
            )

            # --------------------------------------------------
            # RECHERCHE DU FICHIER RÉEL
            # --------------------------------------------------

            candidates = [
                file
                for file in physical_files
                if file.stem.lower()
                == clean_stem.lower()
                and file.suffix.lower()
                == extension
            ]

            # --------------------------------------------------
            # UNE SEULE CORRESPONDANCE
            # --------------------------------------------------

            if len(candidates) == 1:

                real_file = candidates[0]

                old_name = question.image.name

                new_name = (
                    "quiz/questions/"
                    + real_file.name
                )

                # ----------------------------------------------
                # SAUVEGARDE
                # ----------------------------------------------

                with transaction.atomic():

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

            # --------------------------------------------------
            # AUCUN FICHIER
            # --------------------------------------------------

            elif len(candidates) == 0:

                not_found.append(
                    (
                        question.id,
                        db_filename,
                        clean_stem,
                    )
                )

            # --------------------------------------------------
            # PLUSIEURS FICHIERS
            # --------------------------------------------------

            else:

                ambiguous.append(
                    (
                        question.id,
                        db_filename,
                        [
                            file.name
                            for file in candidates
                        ],
                    )
                )

        # ======================================================
        # RAPPORT
        # ======================================================

        self.stdout.write("")
        self.stdout.write("=" * 70)
        self.stdout.write("                     RÉSULTAT")
        self.stdout.write("=" * 70)

        self.stdout.write(
            f"✅ Déjà correctes       : "
            f"{len(already_ok)}"
        )

        self.stdout.write(
            self.style.SUCCESS(
                f"🔧 Corrigées            : "
                f"{len(corrected)}"
            )
        )

        self.stdout.write(
            self.style.WARNING(
                f"⚠️ Introuvables         : "
                f"{len(not_found)}"
            )
        )

        self.stdout.write(
            self.style.WARNING(
                f"⚠️ Ambiguës             : "
                f"{len(ambiguous)}"
            )
        )

        # ======================================================
        # CORRECTIONS
        # ======================================================

        if corrected:

            self.stdout.write("")
            self.stdout.write(
                "🔧 CORRECTIONS EFFECTUÉES"
            )
            self.stdout.write("-" * 70)

            for (
                question_id,
                old_name,
                new_name,
            ) in corrected:

                self.stdout.write(
                    f"Question {question_id}"
                )

                self.stdout.write(
                    f"   ❌ {old_name}"
                )

                self.stdout.write(
                    f"   ✅ {new_name}"
                )

        # ======================================================
        # INTROUVABLES
        # ======================================================

        if not_found:

            self.stdout.write("")
            self.stdout.write(
                "⚠️ IMAGES INTROUVABLES"
            )
            self.stdout.write("-" * 70)

            for (
                question_id,
                filename,
                clean_stem,
            ) in not_found:

                self.stdout.write(
                    f"Question {question_id} : "
                    f"{filename}"
                )

        # ======================================================
        # AMBIGUËS
        # ======================================================

        if ambiguous:

            self.stdout.write("")
            self.stdout.write(
                "⚠️ CORRESPONDANCES AMBIGUËS"
            )
            self.stdout.write("-" * 70)

            for (
                question_id,
                filename,
                candidates,
            ) in ambiguous:

                self.stdout.write(
                    f"Question {question_id} : "
                    f"{filename}"
                )

                for candidate in candidates:

                    self.stdout.write(
                        f"   → {candidate}"
                    )

        # ======================================================
        # FIN
        # ======================================================

        self.stdout.write("")
        self.stdout.write("=" * 70)
        self.stdout.write(
            self.style.SUCCESS(
                "✅ CORRECTION TERMINÉE."
            )
        )
        self.stdout.write("=" * 70)