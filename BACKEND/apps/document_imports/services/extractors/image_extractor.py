from pathlib import Path
from typing import Any

from PIL import Image
import pytesseract

from .base_extractor import (
    BaseExtractor,
    ExtractedPage,
    ExtractionResult,
)


class ImageExtractor(BaseExtractor):
    """
    Extracteur d'images avec OCR.

    Formats supportés :
    - JPG
    - JPEG
    - PNG
    - WEBP

    Le texte est extrait grâce à Tesseract OCR.
    """

    SUPPORTED_EXTENSIONS = {
        ".jpg",
        ".jpeg",
        ".png",
        ".webp",
    }

    def supports(
        self,
        file_path: str,
    ) -> bool:
        """
        Vérifie si le fichier est une image supportée.
        """

        extension = (
            Path(file_path)
            .suffix
            .lower()
        )

        return extension in self.SUPPORTED_EXTENSIONS

    def extract(
        self,
        file_path: str,
    ) -> ExtractionResult:
        """
        Extrait le texte d'une image avec OCR.
        """

        if not self.supports(file_path):
            return ExtractionResult(
                success=False,
                error=(
                    "Le fichier fourni n'est pas "
                    "une image supportée."
                ),
            )

        try:
            image = Image.open(file_path)

            image = self._prepare_image(image)

            text = pytesseract.image_to_string(
                image,
                lang="fra",
            )

            metadata = {
                "source_type": "image",
                "format": image.format,
                "width": image.width,
                "height": image.height,
                "mode": image.mode,
            }

            page = ExtractedPage(
                page_number=1,
                text=text.strip(),
                images=[
                    {
                        "image_path": file_path,
                        "ocr_text": text.strip(),
                    }
                ],
                metadata=metadata,
            )

            image.close()

            return ExtractionResult(
                success=True,
                pages=[page],
                page_count=1,
                metadata=metadata,
            )

        except Exception as exc:

            return ExtractionResult(
                success=False,
                error=str(exc),
            )

    def _prepare_image(
        self,
        image: Image.Image,
    ) -> Image.Image:
        """
        Prépare l'image avant OCR.

        Pour l'instant nous faisons une préparation
        simple et sûre. Nous pourrons ensuite ajouter :
        - redimensionnement ;
        - amélioration du contraste ;
        - suppression du bruit ;
        - rotation automatique ;
        - correction de perspective.
        """

        if image.mode != "RGB":
            image = image.convert("RGB")

        return image