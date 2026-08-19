import type { DailyQuoteMoment } from "@/types/dailyQuote";


export function getCurrentQuoteMoment(
  date = new Date()
): DailyQuoteMoment {

  const hour = date.getHours();

  if (hour < 12) {
    return "MORNING";
  }

  return "EVENING";
}