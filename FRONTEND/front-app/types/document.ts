export type DocumentStatus =
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED";

export type DocumentType =
  | "PDF"
  | "DOCX"
  | "XLSX"
  | "IMAGE"
  | "UNKNOWN";

export interface DocumentImport {
  id: number;
  original_name: string;
  file: string;
  document_type: DocumentType;
  status: DocumentStatus;
  page_count: number;
  error_message: string;
  created_at: string;
  updated_at: string;
}


export type DetectedEventStatus =
  | "DETECTED"
  | "REVIEW"
  | "CONFIRMED"
  | "REJECTED";

export interface DetectedEvent {
  id: number;
  title: string;
  description: string;
  event_date: string | null;
  event_date_end: string | null;
  start_time: string | null;
  end_time: string | null;
  location: string;
  responsible: string;
  objective: string;
  category: string;
  work_suspension: boolean;
  confidence: number;
  status: DetectedEventStatus;
  source_reference: string;
  document: number;
  page: number | null;
}