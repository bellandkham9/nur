"use client";

interface AnalyticsPageRow {
  path: string;
  count: number;
}

interface AnalyticsPagesTableProps {
  pages: AnalyticsPageRow[];
}

export default function AnalyticsPagesTable({
  pages,
}: AnalyticsPagesTableProps) {
  return (
    <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
      {/* =====================================================
          HEADER
          ===================================================== */}

      <div className="border-b px-5 py-4">
        <h2 className="text-lg font-semibold">
          Pages les plus consultées
        </h2>

        <p className="text-sm text-gray-500">
          Pages ayant généré le plus de vues.
        </p>
      </div>

      {/* =====================================================
          CONTENU
          ===================================================== */}

      {pages.length === 0 ? (
        <div className="px-5 py-8 text-center text-sm text-gray-500">
          Aucune donnée disponible.
        </div>
      ) : (
        <div className="divide-y">
          {pages.map((page, index) => (
            <div
              key={`${page.path}-${index}`}
              className="flex items-center justify-between gap-4 px-5 py-4"
            >
              {/* -------------------------------------------------
                  PAGE
                  ------------------------------------------------- */}

              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold">
                  {index + 1}
                </span>

                <span className="truncate text-sm font-medium">
                  {page.path}
                </span>
              </div>

              {/* -------------------------------------------------
                  VUES
                  ------------------------------------------------- */}

              <span className="shrink-0 text-sm font-semibold">
                {page.count.toLocaleString("fr-FR")}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}