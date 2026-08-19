import { apiFetch } from "@/lib/api";

import type {
  BahaiDate,
  BahaiEvent,
  TodayBahaiCalendarResponse,
  NextBahaiEventResponse,
} from "@/types/calendar";


// ============================================================
// AUJOURD'HUI
// ============================================================

export async function getTodayCalendar(): Promise<TodayBahaiCalendarResponse> {
  return apiFetch("/api/calendar/today/");
}


// ============================================================
// PROCHAIN ÉVÉNEMENT
// ============================================================

export async function getNextBahaiEvent(): Promise<NextBahaiEventResponse> {
  return apiFetch("/api/calendar/events/next/");
}


// ============================================================
// ÉVÉNEMENTS D'UNE ANNÉE
// ============================================================

export async function getBahaiEvents(
  year: number,
): Promise<{
  year: number;
  count: number;
  events: BahaiEvent[];
}> {
  return apiFetch(
    `/api/calendar/events/?year=${year}`,
  );
}


// ============================================================
// ÉVÉNEMENTS ENTRE DEUX DATES
// ============================================================

export async function getBahaiEventsBetween(
  start: string,
  end: string,
): Promise<{
  start: string;
  end: string;
  count: number;
  events: BahaiEvent[];
}> {
  return apiFetch(
    `/api/calendar/events/between/?start=${start}&end=${end}`,
  );
}