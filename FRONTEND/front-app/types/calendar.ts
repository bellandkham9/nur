export type BahaiDate = {
  year: number;
  month: number;
  day: number;
  month_name: string;
  month_meaning: string;
};

export type BahaiEvent = {
  code: string;
  name: string;
  date: string;
  event_type: "FEAST" | "HOLY_DAY" | string;
  description: string;
  icon: string;
  is_holy_day: boolean;
  work_suspension: boolean;
};

export type TodayBahaiCalendarResponse = {
  gregorian_date: string;
  bahai_date: BahaiDate;
};

export type NextBahaiEventResponse = {
  from: string;
  event: BahaiEvent | null;
};