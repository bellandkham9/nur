"use client";

interface AnalyticsCardProps {
  title: string;
  value: number | string;
  description?: string;
  icon?: string;
}

export default function AnalyticsCard({
  title,
  value,
  description,
  icon,
}: AnalyticsCardProps) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {title}
          </p>

          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
            {value}
          </p>

          {description && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {description}
            </p>
          )}
        </div>

        {icon && (
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 text-xl dark:bg-gray-800">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}