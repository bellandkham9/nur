
export type EventSource = "personal" | "document";

export type EventStatus =
  | "DETECTED"
  | "REVIEW"
  | "CONFIRMED"
  | "REJECTED";

export interface CalendarEvent {
  id: number;
  source: EventSource;
  source_id: number;

  title: string;
  description: string;

  date: string;
  date_end: string | null;

  start_time: string | null;
  end_time: string | null;

  location: string;
  responsible: string;

  category: string;
  event_type: string;
  event_type_display: string;

  objective: string;
  work_suspension: boolean;

  status: EventStatus;
  confidence: number;

  reminder_enabled: boolean;
  reminder_minutes: number;

  document_id: number | null;
  page_id: number | null;

  source_reference: string;
}

