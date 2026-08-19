import { apiFetch } from "@/lib/api";

import type {
  DailyQuote,
  DailyQuoteMoment,
} from "@/types/dailyQuote";


// ============================================================
// CITATION DU JOUR
// ============================================================

export async function getTodayQuote(
  moment: DailyQuoteMoment
): Promise<DailyQuote | null> {

  try {

    return await apiFetch(
      `/api/daily-quotes/today/?moment=${encodeURIComponent(moment)}`
    );

  } catch (error: any) {

    // Django renvoie 404 lorsqu'aucune citation
    // n'est disponible pour ce moment.

    if (
      error?.message?.includes("Erreur HTTP 404")
    ) {
      return null;
    }

    throw error;
  }
}


// ============================================================
// CITATION PAR ID
// ============================================================

export async function getQuoteById(
  quoteId: number
): Promise<DailyQuote> {

  return await apiFetch(
    `/api/daily-quotes/${quoteId}/`
  );
}