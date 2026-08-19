import csv
import os

from django.conf import settings
from django.core.files import File
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from apps.quiz.models import (
    QuizCategory,
    QuizQuestion,
    QuizAnswer,
    QuizUserAnswer,
    QuizSession,
    QuizProgress,
    QuizUserBadge,
)


class Command(BaseCommand):
    help = "Importe les questions du quiz depuis data/quiz/questions.csv"

    def add_arguments(self, parser):

        parser.add_argument(
            "--limit",
            type=int,
            default=None,
            help="Nombre maximum de questions à importer.",
        )

        parser.add_argument(
            "--reset",
            action="store_true",
            help=(
                "Supprime toutes les données du quiz "
                "avant import."
            ),
        )

    def handle(self, *args, **options):

        limit = options["limit"]
        reset = options["reset"]

        # ==========================================================
        # CHEMINS
        # ==========================================================

        csv_path = os.path.join(
            settings.BASE_DIR,
            "data",
            "quiz",
            "questions.csv",
        )

        images_dir = os.path.join(
            settings.BASE_DIR,
            "data",
            "quiz",
            "images",
        )

        if not os.path.exists(csv_path):
            raise CommandError(
                f"Fichier CSV introuvable : {csv_path}"
            )

        if not os.path.exists(images_dir):
            self.stdout.write(
                self.style.WARNING(
                    f"Dossier images introuvable : {images_dir}"
                )
            )

        # ==========================================================
        # RESET
        # ==========================================================

        if reset:

            self.stdout.write("")
            self.stdout.write(
                self.style.WARNING(
                    "⚠️ RESET DU QUIZ"
                )
            )

            self.stdout.write(
                "Suppression des anciennes données..."
            )

            # ------------------------------------------------------
            # IMPORTANT :
            # Les QuizUserAnswer utilisent PROTECT vers QuizAnswer.
            # Ils doivent donc être supprimés en premier.
            # ------------------------------------------------------

            deleted_user_answers, _ = (
                QuizUserAnswer.objects.all().delete()
            )

            self.stdout.write(
                f"  ✓ Réponses utilisateurs supprimées : "
                f"{deleted_user_answers}"
            )

            # ------------------------------------------------------
            # SESSIONS
            # ------------------------------------------------------

            deleted_sessions, _ = (
                QuizSession.objects.all().delete()
            )

            self.stdout.write(
                f"  ✓ Sessions supprimées : "
                f"{deleted_sessions}"
            )

            # ------------------------------------------------------
            # BADGES UTILISATEURS
            # ------------------------------------------------------

            deleted_user_badges, _ = (
                QuizUserBadge.objects.all().delete()
            )

            self.stdout.write(
                f"  ✓ Badges utilisateurs supprimés : "
                f"{deleted_user_badges}"
            )

            # ------------------------------------------------------
            # PROGRESSION
            # ------------------------------------------------------

            deleted_progress, _ = (
                QuizProgress.objects.all().delete()
            )

            self.stdout.write(
                f"  ✓ Progressions supprimées : "
                f"{deleted_progress}"
            )

            # ------------------------------------------------------
            # RÉPONSES
            # ------------------------------------------------------

            deleted_answers, _ = (
                QuizAnswer.objects.all().delete()
            )

            self.stdout.write(
                f"  ✓ Réponses du quiz supprimées : "
                f"{deleted_answers}"
            )

            # ------------------------------------------------------
            # QUESTIONS
            # ------------------------------------------------------

            deleted_questions, _ = (
                QuizQuestion.objects.all().delete()
            )

            self.stdout.write(
                f"  ✓ Questions supprimées : "
                f"{deleted_questions}"
            )

            # ------------------------------------------------------
            # CATÉGORIES
            # ------------------------------------------------------

            deleted_categories, _ = (
                QuizCategory.objects.all().delete()
            )

            self.stdout.write(
                f"  ✓ Catégories supprimées : "
                f"{deleted_categories}"
            )

            self.stdout.write("")

            self.stdout.write(
                self.style.SUCCESS(
                    "✅ Anciennes données supprimées."
                )
            )

        # ==========================================================
        # IMPORT
        # ==========================================================

        self.stdout.write("")
        self.stdout.write("=" * 60)
        self.stdout.write("        IMPORT DU QUIZ BAHA'I")
        self.stdout.write("=" * 60)
        self.stdout.write("")

        self.stdout.write(
            f"CSV    : {csv_path}"
        )

        self.stdout.write(
            f"Images : {images_dir}"
        )

        self.stdout.write("")

        # ==========================================================
        # COMPTEURS
        # ==========================================================

        imported_questions = 0
        created_questions = 0
        skipped_questions = 0

        created_categories = 0
        created_answers = 0

        questions_with_images = 0
        questions_without_images = 0

        missing_images = []

        # ==========================================================
        # LECTURE CSV
        # ==========================================================

        with open(
            csv_path,
            "r",
            encoding="utf-8-sig",
            newline="",
        ) as csv_file:

            reader = csv.DictReader(csv_file)

            # ------------------------------------------------------
            # COLONNES OBLIGATOIRES
            # ------------------------------------------------------

            required_columns = {
                "id",
                "theme",
                "question_text",
                "option_a",
                "option_b",
                "option_c",
                "option_d",
                "correct_answer",
                "image_url",
            }

            missing_columns = (
                required_columns
                - set(reader.fieldnames or [])
            )

            if missing_columns:

                raise CommandError(
                    "Colonnes manquantes dans le CSV : "
                    + ", ".join(
                        sorted(missing_columns)
                    )
                )

            # ======================================================
            # PARCOURS DES QUESTIONS
            # ======================================================

            for row in reader:

                if (
                    limit is not None
                    and imported_questions >= limit
                ):
                    break

                imported_questions += 1

                # --------------------------------------------------
                # DONNÉES
                # --------------------------------------------------

                question_text = (
                    row.get("question_text", "")
                    or ""
                ).strip()

                theme = (
                    row.get("theme", "")
                    or "Général"
                ).strip()

                correct_answer = (
                    row.get("correct_answer", "")
                    or ""
                ).strip()

                image_name = (
                    row.get("image_url", "")
                    or ""
                ).strip()

                # --------------------------------------------------
                # VALIDATION QUESTION
                # --------------------------------------------------

                if not question_text:

                    self.stdout.write(
                        self.style.WARNING(
                            f"Ligne {imported_questions} ignorée : "
                            "question vide."
                        )
                    )

                    skipped_questions += 1
                    continue

                # --------------------------------------------------
                # OPTIONS
                # --------------------------------------------------

                options_answers = [
                    (
                        row.get("option_a", "")
                        or ""
                    ).strip(),

                    (
                        row.get("option_b", "")
                        or ""
                    ).strip(),

                    (
                        row.get("option_c", "")
                        or ""
                    ).strip(),

                    (
                        row.get("option_d", "")
                        or ""
                    ).strip(),
                ]

                if not all(options_answers):

                    self.stdout.write(
                        self.style.WARNING(
                            "Question ignorée : "
                            f"{question_text[:60]}..."
                            " → option vide."
                        )
                    )

                    skipped_questions += 1
                    continue

                # --------------------------------------------------
                # RÉPONSE CORRECTE
                # --------------------------------------------------

                if correct_answer not in options_answers:

                    self.stdout.write(
                        self.style.WARNING(
                            "Question ignorée : "
                            f"{question_text[:60]}..."
                            " → réponse correcte "
                            "introuvable."
                        )
                    )

                    skipped_questions += 1
                    continue

                # ==================================================
                # CATÉGORIE
                # ==================================================

                category_code = (
                    theme.lower()
                    .replace(" ", "_")
                    .replace("'", "")
                    .replace("’", "")
                    .replace("-", "_")
                )

                category, category_created = (
                    QuizCategory.objects.get_or_create(
                        code=category_code,
                        defaults={
                            "name": theme,
                            "description": (
                                f"Questions sur le thème : "
                                f"{theme}"
                            ),
                        },
                    )
                )

                if category_created:
                    created_categories += 1

                # ==================================================
                # NOM DE L'IMAGE
                # ==================================================

                image_filename = ""

                if image_name:

                    image_filename = os.path.basename(
                        image_name
                    )

                # ==================================================
                # DÉTECTION DES DOUBLONS
                # ==================================================
                #
                # IMPORTANT :
                #
                # Avant :
                #
                # question + catégorie
                #
                # Cela supprimait par exemple :
                #
                # "Quel est ce lieu saint bahá’í ?"
                # + tombeau_bab.jpg
                #
                # "Quel est ce lieu saint bahá’í ?"
                # + chicago.png
                #
                # Maintenant :
                #
                # question + catégorie + image
                #
                # sont considérés pour déterminer un doublon.
                # ==================================================

                existing_questions = (
                    QuizQuestion.objects.filter(
                        question=question_text,
                        category=category,
                    )
                )

                duplicate = False

                if image_filename:

                    duplicate = (
                        existing_questions
                        .filter(
                            image__icontains=image_filename
                        )
                        .exists()
                    )

                else:

                    duplicate = (
                        existing_questions
                        .filter(
                            image=""
                        )
                        .exists()
                    )

                if duplicate:

                    skipped_questions += 1

                    self.stdout.write(
                        self.style.WARNING(
                            "Doublon ignoré : "
                            f"{question_text[:70]}"
                            + (
                                f" [{image_filename}]"
                                if image_filename
                                else ""
                            )
                        )
                    )

                    continue

                # ==================================================
                # CRÉATION
                # ==================================================

                with transaction.atomic():

                    # ------------------------------------------------
                    # QUESTION
                    # ------------------------------------------------

                    question = (
                        QuizQuestion.objects.create(
                            category=category,
                            question=question_text,
                            difficulty=(
                                QuizQuestion
                                .Difficulty
                                .MEDIUM
                            ),
                            xp_reward=10,
                            active=True,
                            order=imported_questions,
                        )
                    )

                    created_questions += 1

                    # ------------------------------------------------
                    # RÉPONSES
                    # ------------------------------------------------

                    for index, answer_text in enumerate(
                        options_answers,
                        start=1,
                    ):

                        is_correct = (
                            answer_text
                            == correct_answer
                        )

                        QuizAnswer.objects.create(
                            question=question,
                            text=answer_text,
                            is_correct=is_correct,
                            order=index,
                        )

                        created_answers += 1

                    # ------------------------------------------------
                    # IMAGE
                    # ------------------------------------------------

                    if image_filename:

                        image_path = os.path.join(
                            images_dir,
                            image_filename,
                        )

                        if os.path.exists(image_path):

                            with open(
                                image_path,
                                "rb",
                            ) as image_file:

                                question.image.save(
                                    image_filename,
                                    File(image_file),
                                    save=True,
                                )

                            questions_with_images += 1

                            self.stdout.write(
                                self.style.SUCCESS(
                                    f"  ✓ Image : "
                                    f"{image_filename}"
                                )
                            )

                        else:

                            missing_images.append(
                                image_filename
                            )

                            questions_without_images += 1

                            self.stdout.write(
                                self.style.WARNING(
                                    f"  ⚠ Image introuvable : "
                                    f"{image_filename}"
                                )
                            )

                    else:

                        questions_without_images += 1

        # ==========================================================
        # RÉSULTAT
        # ==========================================================

        self.stdout.write("")

        self.stdout.write("=" * 60)
        self.stdout.write("              RÉSULTAT")
        self.stdout.write("=" * 60)

        self.stdout.write("")

        self.stdout.write(
            f"Questions lues       : "
            f"{imported_questions}"
        )

        self.stdout.write(
            self.style.SUCCESS(
                f"Questions créées     : "
                f"{created_questions}"
            )
        )

        self.stdout.write(
            f"Questions ignorées   : "
            f"{skipped_questions}"
        )

        self.stdout.write(
            f"Catégories créées    : "
            f"{created_categories}"
        )

        self.stdout.write(
            f"Réponses créées      : "
            f"{created_answers}"
        )

        self.stdout.write("")

        self.stdout.write(
            self.style.SUCCESS(
                f"Questions avec image : "
                f"{questions_with_images}"
            )
        )

        self.stdout.write(
            f"Questions sans image : "
            f"{questions_without_images}"
        )

        # ==========================================================
        # IMAGES INTROUVABLES
        # ==========================================================

        if missing_images:

            self.stdout.write("")

            self.stdout.write(
                self.style.WARNING(
                    "Images introuvables :"
                )
            )

            for image in sorted(
                set(missing_images)
            ):

                self.stdout.write(
                    f"  - {image}"
                )

        # ==========================================================
        # FIN
        # ==========================================================

        self.stdout.write("")

        self.stdout.write("=" * 60)

        self.stdout.write(
            self.style.SUCCESS(
                "✅ IMPORT TERMINÉ."
            )
        )

        self.stdout.write("=" * 60)