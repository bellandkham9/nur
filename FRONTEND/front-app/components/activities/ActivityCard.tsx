"use client";

import Link from "next/link";

import ActivityTypeBadge from "./ActivityTypeBadge";

export type Activity = {
  id: number;
  title: string;
  description?: string | null;

  activity_type: number;
  activity_type_name?: string | null;
  activity_type_code?: string | null;
  activity_type_icon?: string | null;

  community: number;
  community_name?: string | null;

  start_datetime: string;
  end_datetime?: string | null;

  location_name?: string | null;
  address?: string | null;

  organizer?: number;
  organizer_username?: string | null;

  status?: string;

  is_online?: boolean;
  meeting_url?: string | null;

  max_participants?: number | null;
  participants_count?: number;

  my_participation_status?: string | null;
};

type ActivityCardProps = {
  activity: Activity;
};

export default function ActivityCard({
  activity,
}: ActivityCardProps) {
  const date = new Date(activity.start_datetime);

  const dateLabel = date.toLocaleDateString(
    "fr-FR",
    {
      weekday: "short",
      day: "2-digit",
      month: "short",
    },
  );

  const timeLabel = date.toLocaleTimeString(
    "fr-FR",
    {
      hour: "2-digit",
      minute: "2-digit",
    },
  );

  return (
    <Link
      href={`/activities/${activity.id}`}
      className="group block"
    >
      <article className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-md">

        {/* DATE */}
        <div className="flex items-center gap-3 border-b border-slate-100 p-4">

          <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
            <span className="text-[10px] font-bold uppercase">
              {dateLabel.split(" ")[0]}
            </span>

            <span className="text-lg font-bold">
              {date.getDate()}
            </span>
          </div>

          <div className="min-w-0 flex-1">

            <ActivityTypeBadge
              name={activity.activity_type_name}
              icon={activity.activity_type_icon}
              code={activity.activity_type_code}
            />

            <h3 className="mt-2 line-clamp-2 text-lg font-bold leading-tight text-slate-900 group-hover:text-emerald-700">
              {activity.title}
            </h3>

          </div>

        </div>

        {/* CONTENU */}

        <div className="p-5">

          {activity.description && (
            <p className="line-clamp-2 text-sm leading-6 text-slate-600">
              {activity.description}
            </p>
          )}

          <div className="mt-4 space-y-2 text-sm text-slate-500">

            <p>
              🕐 {dateLabel} à {timeLabel}
            </p>

            {activity.community_name && (
              <p>
                🌿 {activity.community_name}
              </p>
            )}

            {activity.is_online ? (
              <p>
                💻 Activité en ligne
              </p>
            ) : activity.location_name ? (
              <p className="truncate">
                📍 {activity.location_name}
              </p>
            ) : activity.address ? (
              <p className="truncate">
                📍 {activity.address}
              </p>
            ) : null}

          </div>

          {/* FOOTER */}

          <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">

            <span className="text-xs text-slate-500">
              👥 {activity.participants_count ?? 0}
              {activity.max_participants
                ? ` / ${activity.max_participants}`
                : ""}{" "}
              participant
              {(activity.participants_count ?? 0) > 1
                ? "s"
                : ""}
            </span>

            {activity.my_participation_status && (
              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                ✓ Inscrit
              </span>
            )}

            <span className="text-sm font-semibold text-emerald-600">
              Voir →
            </span>

          </div>

        </div>

      </article>
    </Link>
  );
}