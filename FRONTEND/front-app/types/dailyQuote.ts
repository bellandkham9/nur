export type DailyQuoteMoment =
  | "MORNING"
  | "EVENING";

export interface DailyQuote {
  id: number;
  date: string;
  moment: DailyQuoteMoment;
  text: string;
  author: string;
  source: string;
  source_reference: string;
}