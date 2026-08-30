"use client";

import type { AnalyticsDailyStat } from "@/lib/analytics";

interface AnalyticsChartProps {
daily: AnalyticsDailyStat[];
}

export default function AnalyticsChart({
daily,
}: AnalyticsChartProps) {
if (!daily || daily.length === 0) {
return ( <div className="rounded-2xl border bg-white p-5 shadow-sm"> <h2 className="mb-4 text-lg font-semibold">
Activité quotidienne </h2>

    <div className="flex h-80 items-center justify-center text-sm text-gray-500">
      Aucune donnée disponible pour cette période.
    </div>
  </div>
);

}

const maxEvents = Math.max(
...daily.map((item) => item.events),
1,
);

const maxUsers = Math.max(
...daily.map((item) => item.active_users),
1,
);

return ( <div className="rounded-2xl border bg-white p-5 shadow-sm"> <div className="mb-5"> <h2 className="text-lg font-semibold">
Activité quotidienne </h2>

```
    <p className="text-sm text-gray-500">
      Événements et utilisateurs actifs
    </p>
  </div>

  <div className="space-y-5">
    {daily.map((item) => {
      const eventPercent =
        (item.events / maxEvents) * 100;

      const userPercent =
        (item.active_users / maxUsers) * 100;

      const formattedDate =
        new Date(item.date).toLocaleDateString(
          "fr-FR",
          {
            day: "2-digit",
            month: "2-digit",
          },
        );

      return (
        <div
          key={item.date}
          className="space-y-2"
        >
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">
              {formattedDate}
            </span>

            <div className="flex gap-4 text-xs text-gray-500">
              <span>
                {item.events} événement
                {item.events !== 1 ? "s" : ""}
              </span>

              <span>
                {item.active_users} utilisateur
                {item.active_users !== 1
                  ? "s"
                  : ""}
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="h-2 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-blue-500 transition-all"
                style={{
                  width: `${eventPercent}%`,
                }}
              />
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{
                  width: `${userPercent}%`,
                }}
              />
            </div>
          </div>
        </div>
      );
    })}
  </div>

  <div className="mt-6 flex items-center gap-5 border-t pt-4 text-xs text-gray-500">
    <div className="flex items-center gap-2">
      <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
      Événements
    </div>

    <div className="flex items-center gap-2">
      <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
      Utilisateurs actifs
    </div>
  </div>
</div>


);
}
