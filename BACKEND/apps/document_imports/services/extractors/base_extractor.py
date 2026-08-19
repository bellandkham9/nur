from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any


@dataclass
class ExtractedPage:
    """
    Résultat de l'extraction d'une page.
    """

    page_number: int

    text: str = ""

    tables: list[dict[str, Any]] = field(
        default_factory=list
    )

    images: list[dict[str, Any]] = field(
        default_factory=list
    )

    metadata: dict[str, Any] = field(
        default_factory=dict
    )


@dataclass
class ExtractionResult:
    """
    Résultat complet de l'extraction d'un document.
    """

    success: bool

    pages: list[ExtractedPage] = field(
        default_factory=list
    )

    page_count: int = 0

    metadata: dict[str, Any] = field(
        default_factory=dict
    )

    error: str = ""


class BaseExtractor(ABC):
    """
    Classe abstraite commune à tous les extracteurs.
    """

    @abstractmethod
    def extract(
        self,
        file_path: str,
    ) -> ExtractionResult:
        """
        Extrait le contenu d'un document.
        """
        raise NotImplementedError

    @abstractmethod
    def supports(
        self,
        file_path: str,
    ) -> bool:
        """
        Indique si l'extracteur peut traiter
        le fichier fourni.
        """
        raise NotImplementedError