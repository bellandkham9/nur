from rest_framework import serializers

from .models import (
    DocumentImport,
    DocumentPage,
    ExtractedTable,
    ExtractedImage,
    ExtractedInformation,
    DetectedEvent,
)


class DocumentImportSerializer(serializers.ModelSerializer):

    class Meta:
        model = DocumentImport
        fields = "__all__"
        fields = [
            "id",
            "file",
            "original_name",
            "document_type",
            "status",
            "page_count",
            "error_message",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "original_name",
            "document_type",
            "status",
            "page_count",
            "error_message",
            "created_at",
            "updated_at",
        ]

    def create(self, validated_data):

        uploaded_file = validated_data["file"]

        original_name = uploaded_file.name

        extension = (
            original_name
            .lower()
            .split(".")[-1]
        )

        document_types = {
            "pdf": DocumentImport.DocumentType.PDF,
            "docx": DocumentImport.DocumentType.DOCX,
            "xlsx": DocumentImport.DocumentType.XLSX,
            "jpg": DocumentImport.DocumentType.IMAGE,
            "jpeg": DocumentImport.DocumentType.IMAGE,
            "png": DocumentImport.DocumentType.IMAGE,
            "webp": DocumentImport.DocumentType.IMAGE,
        }

        document_type = document_types.get(
            extension,
            DocumentImport.DocumentType.UNKNOWN,
        )

        instance = DocumentImport.objects.create(
            file=uploaded_file,
            original_name=original_name,
            document_type=document_type,
        )

        return instance


class DocumentPageSerializer(serializers.ModelSerializer):

    class Meta:
        model = DocumentPage
        fields = "__all__"


class ExtractedTableSerializer(serializers.ModelSerializer):

    class Meta:
        model = ExtractedTable
        fields = "__all__"


class ExtractedImageSerializer(serializers.ModelSerializer):

    class Meta:
        model = ExtractedImage
        fields = "__all__"


class ExtractedInformationSerializer(serializers.ModelSerializer):

    class Meta:
        model = ExtractedInformation
        fields = "__all__"


class DetectedEventSerializer(serializers.ModelSerializer):

    class Meta:
        model = DetectedEvent
        fields = "__all__"