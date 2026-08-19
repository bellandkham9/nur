from dataclasses import dataclass
from datetime import date
from typing import Optional


@dataclass(frozen=True)
class BahaiEvent:
    id: str
    name: str
    event_type: str
    date: date

    description: str = ""
    is_holy_day: bool = False
    work_suspended: bool = False
    bahai_month: Optional[int] = None
    bahai_day: Optional[int] = None

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "event_type": self.event_type,
            "date": self.date.isoformat(),
            "description": self.description,
            "is_holy_day": self.is_holy_day,
            "work_suspended": self.work_suspended,
            "bahai_month": self.bahai_month,
            "bahai_day": self.bahai_day,
        }