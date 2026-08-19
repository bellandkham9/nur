from pathlib import Path
from typing import Any

import pymupdf

from .base_extractor import (
    BaseExtractor,
    ExtractedPage,
    ExtractionResult,
)


class PDFExtractor(BaseExtractor):
    """
    Extracteur de documents PDF.

    Utilise PyMuPDF pour :
    - lire les pages ;
    - extraire le texte ;
    - récupérer les métadonnées ;
    - détecter les tableaux lorsqu'ils sont disponibles.
    """

    SUPPORTED_EXTENSIONS = {
        ".pdf",
    }

    def supports(
        self,
        file_path: str,
    ) -> bool:
        """
        Vérifie si le fichier est un PDF.
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
        Extrait le contenu du PDF.
        """

        if not self.supports(file_path):
            return ExtractionResult(
                success=False,
                error="Le fichier fourni n'est pas un PDF.",
            )

        try:
            document = pymupdf.open(file_path)

            pages = []

            for index, page in enumerate(
                document,
                start=1,
            ):
                text = page.get_text("text")

                page_data = ExtractedPage(
                    page_number=index,
                    text=text.strip(),
                    metadata=self._extract_page_metadata(
                        page
                    ),
                )

                pages.append(page_data)

            metadata = self._extract_document_metadata(
                document
            )

            page_count = len(document)

            document.close()

            return ExtractionResult(
                success=True,
                pages=pages,
                page_count=page_count,
                metadata=metadata,
            )

        except Exception as exc:

            return ExtractionResult(
                success=False,
                error=str(exc),
            )

    def _extract_document_metadata(
        self,
        document: Any,
    ) -> dict[str, Any]:
        """
        Extrait les métadonnées générales du PDF.
        """

        metadata = document.metadata or {}

        return {
            "title": metadata.get(
                "title",
                "",
            ),
            "author": metadata.get(
                "author",
                "",
            ),
            "subject": metadata.get(
                "subject",
                "",
            ),
            "keywords": metadata.get(
                "keywords",
                "",
            ),
            "creator": metadata.get(
                "creator",
                "",
            ),
            "producer": metadata.get(
                "producer",
                "",
            ),
            "format": metadata.get(
                "format",
                "",
            ),
        }

    def _extract_page_metadata(
        self,
        page: Any,
    ) -> dict[str, Any]:
        """
        Extrait quelques informations techniques
        concernant une page.
        """

        rectangle = page.rect

        return {
            "width": rectangle.width,
            "height": rectangle.height,
            "rotation": page.rotation,
        }