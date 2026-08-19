"use client";

import Link from "next/link";

export type Community = {
  id: number;
  name: string;
  description?: string | null;
  country?: string | null;
  city?: string | null;
  address?: string | null;
  is_active?: boolean;
  members_count?: number;
};

type CommunityCardProps = {
  community: Community;
  isMember?: boolean;
};

export default function CommunityCard({
  community,
  isMember = false,
}: CommunityCardProps) {
  return (
    <Link
      href={`/communities/${community.id}`}
      className="group block"
    >
      <article className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-md">
        {/* HEADER */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-2xl">
              🌿
            </div>

            <div className="min-w-0">
            <h3 className="line-clamp-2 break-words text-lg font-bold leading-tight text-slate-900 group-hover:text-emerald-700">
            {community.name}
            </h3>

              {(community.city || community.country) && (
                <p className="mt-1 text-sm text-slate-500">
                  📍{" "}
                  {[community.city, community.country]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              )}
            </div>
          </div>

          {isMember && (
            <span className="shrink-0 rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
              Membre
            </span>
          )}
        </div>

        {/* DESCRIPTION */}
        {community.description && (
          <p className="mt-4 line-clamp-2 text-sm leading-6 text-slate-600">
            {community.description}
          </p>
        )}

        {/* FOOTER */}
        <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
          <div className="flex items-center gap-4 text-xs text-slate-500">
            {community.members_count !== undefined && (
              <span>
                👥 {community.members_count} membre
                {community.members_count > 1 ? "s" : ""}
              </span>
            )}

            {community.is_active === false && (
              <span className="rounded-full bg-red-100 px-2 py-1 font-semibold text-red-700">
                Inactive
              </span>
            )}
          </div>

          <span className="text-sm font-semibold text-emerald-600">
            Voir →
          </span>
        </div>
      </article>
    </Link>
  );
}