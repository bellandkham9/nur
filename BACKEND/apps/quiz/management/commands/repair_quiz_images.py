import shutil
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand

from apps.quiz.models import QuizQuestion


class Command(BaseCommand):
    help = "Répare les images des questions du quiz."

    def handle(self, *args, **options):

        source_dir = settings.BASE_DIR / "data" / "quiz" / "images"
        media_dir = settings.MEDIA_ROOT / "quiz" / "questions"

        media_dir.mkdir(
            parents=True,
            exist_ok=True,
        )

        if not source_dir.exists():
            self.stdout.write(
                self.style.ERROR(
                    f"Dossier source introuvable : {source_dir}"
                )
            )
            return

        questions = QuizQuestion.objects.exclude(
            image=""
        ).exclude(
            image__isnull=True
        )

        total = questions.count()
        copied = 0
        missing = 0
        already_present = 0

        self.stdout.write(
            f"Questions avec image : {total}"
        )

        for question in questions:

            image_name = Path(question.image.name).name

            if not image_name:
                continue

            source_file = source_dir / image_name
            destination_file = media_dir / image_name

            if not source_file.exists():
                self.stdout.write(
                    self.style.WARNING(
                        f"Image source introuvable : {image_name}"
                    )
                )
                missing += 1
                continue

            if destination_file.exists():
                already_present += 1
                continue

            shutil.copy2(
                source_file,
                destination_file,
            )

            copied += 1

            self.stdout.write(
                self.style.SUCCESS(
                    f"✓ {image_name}"
                )
            )

        self.stdout.write("")
        self.stdout.write(
            self.style.SUCCESS(
                "========== TERMINÉ =========="
            )
        )
        self.stdout.write(
            f"Questions avec image : {total}"
        )
        self.stdout.write(
            f"Images copiées       : {copied}"
        )
        self.stdout.write(
            f"Déjà présentes       : {already_present}"
        )
        self.stdout.write(
            f"Images introuvables  : {missing}"
        )