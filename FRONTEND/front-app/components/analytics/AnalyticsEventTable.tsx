"use client";

import type { AnalyticsEventTypeStat } from "@/lib/analytics";

interface AnalyticsEventTableProps {
events: AnalyticsEventTypeStat[];
}

export default function AnalyticsEventTable({
events,
}: AnalyticsEventTableProps) {
return ( <div className="rounded-2xl border bg-white p-5 shadow-sm"> <h2 className="mb-4 text-lg font-semibold">
Types d'événements </h2>

  {events.length === 0 ? (
    <p className="text-sm text-gray-500">
      Aucun événement enregistré.
    </p>
  ) : (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="px-3 py-3 font-medium">
              Événement
            </th>

            <th className="px-3 py-3 text-right font-medium">
              Nombre
            </th>
          </tr>
        </thead>

        <tbody>
          {events.map((event) => (
            <tr
              key={event.event_type}
              className="border-b last:border-0"
            >
              <td className="px-3 py-3">
                {event.event_type}
              </td>

              <td className="px-3 py-3 text-right font-semibold">
                {event.count}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )}
</div>


);
}
