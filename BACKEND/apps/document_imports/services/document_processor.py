from pathlib import Path
from .event_detector import EventDetector
from django.db import transaction

from ..models import (
    DocumentImport,
    DocumentPage,
    ExtractedImage,
    ExtractedTable,
)

from .extractors.base_extractor import (
    ExtractionResult,
)

from .extractors.pdf_extractor import (
    PDFExtractor,
)

from .extractors.docx_extractor import (
    DOCXExtractor,
)

from .extractors.xlsx_extractor import (
    XLSXExtractor,
)

from .extractors.image_extractor import (
    ImageExtractor,
)


class DocumentProcessor:
    """
    Orchestrateur principal du traitement des documents.

    Il :
    - détecte le type de document ;
    - choisit l'extracteur approprié ;
    - lance l'extraction ;
    - sauvegarde les pages ;
    - sauvegarde les tableaux ;
    - sauvegarde les images ;
    - met à jour le statut du document.
    """

    def __init__(self):
        self.extractors = [
            PDFExtractor(),
            DOCXExtractor(),
            XLSXExtractor(),
            ImageExtractor(),
        ]

    def process(
        self,
        document: DocumentImport,
    ) -> DocumentImport:
        """
        Traite complètement un DocumentImport.
        """

        self._set_processing(document)

        try:
            file_path = self._get_file_path(
                document
            )

            extractor = self._find_extractor(
                file_path
            )

            if extractor is None:
                raise ValueError(
                    "Aucun extracteur disponible pour "
                    f"le fichier : {document.original_name}"
                )

            result = extractor.extract(
                file_path
            )

            if not result.success:
                raise RuntimeError(
                    result.error
                    or "Erreur inconnue pendant l'extraction."
                )

            with transaction.atomic():

                self._save_extraction_result(
                    document,
                    result,
                )

                document.page_count = (
                    result.page_count
                )

                document.save(
                    update_fields=[
                        "page_count",
                        "updated_at",
                    ]
                )

            # ============================================================
            # DÉTECTION DES ÉVÉNEMENTS
            # ============================================================

            EventDetector().analyze_document(
                document.id
            )

            # ============================================================
            # DOCUMENT TERMINÉ
            # ============================================================

            document.status = (
                DocumentImport.Status.COMPLETED
            )

            document.error_message = ""

            document.save(
                update_fields=[
                    "status",
                    "error_message",
                    "updated_at",
                ]
            )

            return document

        except Exception as exc:

            self._set_failed(
                document,
                str(exc),
            )

            raise

    def _get_file_path(
        self,
        document: DocumentImport,
    ) -> str:
        """
        Retourne le chemin physique du fichier.
        """

        if not document.file:
            raise ValueError(
                "Le document ne contient aucun fichier."
            )

        return document.file.path

    def _find_extractor(
        self,
        file_path: str,
    ):
        """
        Trouve l'extracteur capable de traiter
        le fichier fourni.
        """

        for extractor in self.extractors:

            if extractor.supports(file_path):
                return extractor

        return None

    def _save_extraction_result(
        self,
        document: DocumentImport,
        result: ExtractionResult,
    ):
        """
        Transforme le résultat de l'extraction
        en objets Django.
        """

        # Si le traitement est relancé,
        # on supprime les anciennes données.
        document.pages.all().delete()

        for extracted_page in result.pages:

            page = DocumentPage.objects.create(
                document=document,
                page_number=(
                    extracted_page.page_number
                ),
                extracted_text=(
                    extracted_page.text
                ),
                has_tables=bool(
                    extracted_page.tables
                ),
                has_images=bool(
                    extracted_page.images
                ),
            )

            self._save_tables(
                page,
                extracted_page.tables,
            )

            self._save_images(
                page,
                extracted_page.images,
            )

    def _save_tables(
        self,
        page: DocumentPage,
        tables: list[dict],
    ):
        """
        Sauvegarde les tableaux extraits.
        """

        for index, table in enumerate(
            tables,
            start=1,
        ):

            ExtractedTable.objects.create(
                page=page,
                table_index=table.get(
                    "table_index",
                    index,
                ),
                headers=table.get(
                    "headers",
                    [],
                ),
                rows=table.get(
                    "rows",
                    [],
                ),
                raw_data=table.get(
                    "raw_data",
                    {},
                ),
            )

    def _save_images(
        self,
        page: DocumentPage,
        images: list[dict],
    ):
        """
        Sauvegarde les informations sur les images.

        Pour l'instant, les fichiers images eux-mêmes
        ne sont pas copiés.

        Nous ajouterons leur gestion complète ensuite.
        """

        # Pour l'instant, on ne crée pas encore
        # ExtractedImage automatiquement ici.
        #
        # La gestion physique des images sera ajoutée
        # dans une prochaine étape.
        return

    def _set_processing(
        self,
        document: DocumentImport,
    ):
        """
        Passe le document en état PROCESSING.
        """

        document.status = (
            DocumentImport.Status.PROCESSING
        )

        document.error_message = ""

        document.save(
            update_fields=[
                "status",
                "error_message",
                "updated_at",
            ]
        )

    def _set_failed(
        self,
        document: DocumentImport,
        error: str,
    ):
        """
        Passe le document en état FAILED.
        """

        document.status = (
            DocumentImport.Status.FAILED
        )

        document.error_message = error

        document.save(
            update_fields=[
                "status",
                "error_message",
                "updated_at",
            ]
        )