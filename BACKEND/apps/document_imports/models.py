from django.db import models
from django.conf import settings

class DocumentImport(models.Model):
    """
    Document importé par l'utilisateur.

    Peut être un PDF, Word, Excel ou une image.
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="document_imports",
        null=True,
        blank=True,
    )

    class Status(models.TextChoices):
        PENDING = "PENDING", "En attente"
        PROCESSING = "PROCESSING", "Traitement"
        COMPLETED = "COMPLETED", "Terminé"
        FAILED = "FAILED", "Échec"

    class DocumentType(models.TextChoices):
        PDF = "PDF", "PDF"
        DOCX = "DOCX", "Word"
        XLSX = "XLSX", "Excel"
        IMAGE = "IMAGE", "Image"
        UNKNOWN = "UNKNOWN", "Inconnu"

    file = models.FileField(
        upload_to="document_imports/%Y/%m/"
    )

    original_name = models.CharField(
        max_length=255
    )

    document_type = models.CharField(
        max_length=20,
        choices=DocumentType.choices,
        default=DocumentType.UNKNOWN,
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )

    page_count = models.PositiveIntegerField(
        default=0
    )

    error_message = models.TextField(
        blank=True,
        default=""
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.original_name


class DocumentPage(models.Model):
    """
    Représente une page d'un document.
    """

    document = models.ForeignKey(
        DocumentImport,
        on_delete=models.CASCADE,
        related_name="pages",
    )

    page_number = models.PositiveIntegerField()

    extracted_text = models.TextField(
        blank=True,
        default=""
    )

    ocr_text = models.TextField(
        blank=True,
        default=""
    )

    has_tables = models.BooleanField(
        default=False
    )

    has_images = models.BooleanField(
        default=False
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    class Meta:
        ordering = ["page_number"]
        constraints = [
            models.UniqueConstraint(
                fields=["document", "page_number"],
                name="unique_document_page",
            )
        ]

    def __str__(self):
        return (
            f"{self.document.original_name} "
            f"- Page {self.page_number}"
        )


class ExtractedTable(models.Model):
    """
    Tableau détecté dans un document.
    """

    page = models.ForeignKey(
        DocumentPage,
        on_delete=models.CASCADE,
        related_name="tables",
    )

    table_index = models.PositiveIntegerField(
        default=0
    )

    headers = models.JSONField(
        default=list,
        blank=True,
    )

    rows = models.JSONField(
        default=list,
        blank=True,
    )

    raw_data = models.JSONField(
        default=dict,
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return (
            f"Tableau {self.table_index} "
            f"- {self.page.document.original_name}"
        )


class ExtractedImage(models.Model):
    """
    Image détectée dans un document.
    """

    page = models.ForeignKey(
        DocumentPage,
        on_delete=models.CASCADE,
        related_name="images",
    )

    image = models.ImageField(
        upload_to="document_images/%Y/%m/"
    )

    image_index = models.PositiveIntegerField(
        default=0
    )

    ocr_text = models.TextField(
        blank=True,
        default=""
    )

    description = models.TextField(
        blank=True,
        default=""
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return (
            f"Image {self.image_index} "
            f"- Page {self.page.page_number}"
        )


class ExtractedInformation(models.Model):
    """
    Information individuelle extraite du document.
    """

    class SourceType(models.TextChoices):
        TEXT = "TEXT", "Texte"
        TABLE = "TABLE", "Tableau"
        IMAGE = "IMAGE", "Image"
        OCR = "OCR", "OCR"
        AI = "AI", "IA"

    document = models.ForeignKey(
        DocumentImport,
        on_delete=models.CASCADE,
        related_name="extracted_information",
    )

    page = models.ForeignKey(
        DocumentPage,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="extracted_information",
    )

    field_name = models.CharField(
        max_length=100
    )

    value = models.TextField()

    normalized_value = models.TextField(
        blank=True,
        default=""
    )

    source_type = models.CharField(
        max_length=20,
        choices=SourceType.choices,
        default=SourceType.TEXT,
    )

    confidence = models.FloatField(
        default=1.0
    )

    source_reference = models.CharField(
        max_length=255,
        blank=True,
        default=""
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return f"{self.field_name}: {self.value}"


class DetectedEvent(models.Model):
    """
    Événement détecté automatiquement dans un document.

    Ce n'est pas encore un PersonalEvent.
    """

    class Status(models.TextChoices):
        DETECTED = "DETECTED", "Détecté"
        REVIEW = "REVIEW", "À vérifier"
        CONFIRMED = "CONFIRMED", "Confirmé"
        REJECTED = "REJECTED", "Rejeté"

    document = models.ForeignKey(
        DocumentImport,
        on_delete=models.CASCADE,
        related_name="detected_events",
    )

    page = models.ForeignKey(
        DocumentPage,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="detected_events",
    )

    title = models.CharField(
        max_length=255
    )

    description = models.TextField(
        blank=True,
        default=""
    )

    event_date = models.DateField(
        null=True,
        blank=True
    )

    event_date_end = models.DateField(
        null=True,
        blank=True
    )

    start_time = models.TimeField(
        null=True,
        blank=True
    )

    end_time = models.TimeField(
        null=True,
        blank=True
    )

    reminder_enabled = models.BooleanField(
    default=True
)

    reminder_minutes = models.PositiveIntegerField(
        default=30
    )


    location = models.CharField(
        max_length=255,
        blank=True,
        default=""
    )

    responsible = models.CharField(
        max_length=255,
        blank=True,
        default=""
    )

    objective = models.TextField(
        blank=True,
        default=""
    )

    category = models.CharField(
        max_length=100,
        blank=True,
        default=""
    )

    work_suspension = models.BooleanField(
        default=False
    )

    confidence = models.FloatField(
        default=0.0
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.DETECTED,
    )

    raw_data = models.JSONField(
        default=dict,
        blank=True,
    )

    source_reference = models.CharField(
        max_length=255,
        blank=True,
        default=""
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    class Meta:
        ordering = ["event_date", "start_time", "title"]

    def __str__(self):
        return self.title