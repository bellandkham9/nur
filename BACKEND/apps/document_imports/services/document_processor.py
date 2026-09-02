from pathlib import Path

from django.db import transaction

from ..models import (
    DocumentImport,
    DocumentPage,
    ExtractedImage,
    ExtractedTable,
)

from .event_detector import EventDetector

from .DocumentSchemaAnalyzer import (
    DocumentSchemaAnalyzer,
)

from .extraction_confidence_engine import (
    ExtractionConfidenceEngine,
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

    Pipeline :

        Document
            ↓
        Extractor
            ↓
        Schema Analyzer
            ↓
        Field Assignment
            ↓
        Consistency Checker
            ↓
        Confidence Engine
            ↓
        Sauvegarde
            ↓
        EventDetector
    """

    def __init__(self):

        self.extractors = [
            PDFExtractor(),
            DOCXExtractor(),
            XLSXExtractor(),
            ImageExtractor(),
        ]

        self.schema_analyzer = (
            DocumentSchemaAnalyzer()
        )

        self.confidence_engine = (
            ExtractionConfidenceEngine()
        )

    # ==========================================================
    # TRAITEMENT PRINCIPAL
    # ==========================================================

    def process(
        self,
        document: DocumentImport,
    ) -> DocumentImport:

        self._set_processing(
            document
        )

        try:

            file_path = self._get_file_path(
                document
            )

            extractor = self._find_extractor(
                file_path
            )

            if extractor is None:

                raise ValueError(
                    "Format de document non supporté : "
                    f"{document.original_name}"
                )

            result = extractor.extract(
                file_path
            )

            if not result.success:

                raise RuntimeError(
                    result.error
                    or
                    "Erreur inconnue pendant l'extraction."
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

            # ==============================================
            # DÉTECTION DES ÉVÉNEMENTS
            # ==============================================

            detector_error = ""

            try:

                EventDetector().analyze_document(
                    document.id
                )

            except Exception as exc:

                detector_error = (
                    "Extraction terminée, "
                    "mais erreur pendant la "
                    "détection des événements : "
                    f"{exc}"
                )

            # ==============================================
            # DOCUMENT TERMINÉ
            # ==============================================

            document.status = (
                DocumentImport.Status.COMPLETED
            )

            document.error_message = (
                detector_error
            )

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
    # ==========================================================
    # CHEMIN DU FICHIER
    # ==========================================================

    def _get_file_path(
        self,
        document: DocumentImport,
    ) -> str:

        if not document.file:

            raise ValueError(
                "Le document ne contient aucun fichier."
            )

        return document.file.path

    # ==========================================================
    # EXTRACTEUR
    # ==========================================================

    def _find_extractor(
        self,
        file_path: str,
    ):

        for extractor in self.extractors:

            if extractor.supports(
                file_path
            ):

                return extractor

        return None

    # ==========================================================
    # SAUVEGARDE
    # ==========================================================

    def _save_extraction_result(
        self,
        document: DocumentImport,
        result: ExtractionResult,
    ):

        # ------------------------------------------------------
        # Suppression des anciennes données
        # ------------------------------------------------------

        document.pages.all().delete()

        # ------------------------------------------------------
        # Pages
        # ------------------------------------------------------

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

            # --------------------------------------------------
            # TABLEAUX
            # --------------------------------------------------

            self._save_tables(
                page,
                extracted_page.tables,
            )

            # --------------------------------------------------
            # IMAGES
            # --------------------------------------------------

            self._save_images(
                page,
                extracted_page.images,
            )

    # ==========================================================
    # TABLEAUX
    # ==========================================================

    def _save_tables(
        self,
        page: DocumentPage,
        tables: list[dict],
    ):

        for index, table in enumerate(
            tables,
            start=1,
        ):

            headers = table.get(
                "headers",
                [],
            )

            rows = table.get(
                "rows",
                [],
            )

            # ==================================================
            # ANALYSE DU SCHÉMA
            # ==================================================

            schema_analysis = (
                self.schema_analyzer.analyze(
                    headers=headers,
                    rows=rows,
                )
            )

            # ==================================================
            # COLONNES ANALYSÉES
            # ==================================================

            columns = []

            for column in schema_analysis.columns:

                columns.append(
                    {
                        "index": column.index,
                        "original_header": str(
                            column.header
                        )
                        if column.header is not None
                        else "",

                        "normalized_header": (
                            column.normalized_header
                        ),

                        "field": column.field,

                        "confidence": (
                            column.confidence
                        ),

                        "reason": column.reason,

                        "sample_values": [
                            str(value)
                            for value
                            in column.sample_values
                        ],

                        "detected_types": (
                            column.detected_types
                        ),

                        "ambiguous": (
                            column.ambiguous
                        ),
                    }
                )

            # ==================================================
            # ANALYSE DES LIGNES
            # ==================================================

            processed_rows = []

            for row_index, row in enumerate(
                rows,
                start=1,
            ):

                extracted_fields = {}

                confidence_fields = {}

                for column in schema_analysis.columns:

                    if column.field is None:
                        continue

                    value = ""

                    if column.index < len(row):

                        value = row[
                            column.index
                        ]

                    extracted_fields[
                        column.field
                    ] = value

                    confidence_fields[
                        column.field
                    ] = {
                        "value": value,

                        "assignment_confidence": (
                            column.confidence
                        ),

                        "header_confidence": (
                            column.confidence
                        ),

                        "value_confidence": (
                            1.0
                            if value not in (
                                None,
                                "",
                            )
                            else 0.0
                        ),

                        "consistency_confidence": (
                            1.0
                        ),

                        "consistency_ok": True,

                        "reasons": [
                            column.reason
                        ],
                    }

                confidence_result = (
                    self.confidence_engine
                    .evaluate_extraction(
                        confidence_fields
                    )
                )

                processed_rows.append(
                    {
                        "row_index": row_index,

                        "fields": (
                            extracted_fields
                        ),

                        "confidence": (
                            confidence_result
                            .global_confidence
                        ),

                        "accepted": (
                            confidence_result
                            .accepted
                        ),

                        "warnings": (
                            confidence_result
                            .warnings
                        ),

                        "field_confidence": {
                            field_name: {
                                "value": (
                                    field.value
                                ),

                                "confidence": (
                                    field.confidence
                                ),

                                "accepted": (
                                    field.accepted
                                ),

                                "reasons": (
                                    field.reasons
                                ),
                            }

                            for (
                                field_name,
                                field,
                            )
                            in confidence_result
                            .fields.items()
                        },
                    }
                )

            # ==================================================
            # MÉTADONNÉES DU SCHÉMA
            # ==================================================

            schema_data = {

                "columns": columns,

                "field_to_columns": (
                    schema_analysis
                    .field_to_columns
                ),

                "unresolved_columns": (
                    schema_analysis
                    .unresolved_columns
                ),

                "ambiguous_columns": (
                    schema_analysis
                    .ambiguous_columns
                ),

                "confidence": (
                    schema_analysis
                    .confidence
                ),

                "structure_type": (
                    schema_analysis
                    .structure_type
                ),

                "warnings": (
                    schema_analysis
                    .warnings
                ),

                "processed_rows": (
                    processed_rows
                ),
            }

            # ==================================================
            # DONNÉES ORIGINALES
            # ==================================================

            raw_data = table.get(
                "raw_data",
                {},
            )

            if not isinstance(
                raw_data,
                dict,
            ):

                raw_data = {
                    "original": raw_data,
                }

            raw_data = {
                **raw_data,

                "original_headers": headers,

                "original_rows": rows,

                "schema_analysis": (
                    schema_data
                ),
            }

            # ==================================================
            # SAUVEGARDE
            # ==================================================

            ExtractedTable.objects.create(
                page=page,

                table_index=table.get(
                    "table_index",
                    index,
                ),

                headers=headers,

                rows=rows,

                raw_data=raw_data,
            )
    # ==========================================================
    # IMAGES
    # ==========================================================

    def _save_images(
        self,
        page: DocumentPage,
        images: list[dict],
    ):

        # Pour l'instant on conserve
        # le comportement existant.

        return

    # ==========================================================
    # PROCESSING
    # ==========================================================

    def _set_processing(
        self,
        document: DocumentImport,
    ):

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

    # ==========================================================
    # FAILED
    # ==========================================================

    def _set_failed(
        self,
        document: DocumentImport,
        error: str,
    ):

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