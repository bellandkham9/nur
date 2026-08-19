"use client";

type CommunityMemberBadgeProps = {
  role?: string | null;
};

export default function CommunityMemberBadge({
  role,
}: CommunityMemberBadgeProps) {
  const normalizedRole = role?.toLowerCase() || "membre";

  const roleStyles: Record<
    string,
    {
      label: string;
      className: string;
    }
  > = {
    visiteur: {
      label: "Visiteur",
      className: "bg-slate-100 text-slate-600",
    },

    membre: {
      label: "Membre",
      className: "bg-emerald-100 text-emerald-700",
    },

    animateur: {
      label: "Animateur",
      className: "bg-blue-100 text-blue-700",
    },

    responsable: {
      label: "Responsable",
      className: "bg-purple-100 text-purple-700",
    },

    coordinateur: {
      label: "Coordinateur",
      className: "bg-indigo-100 text-indigo-700",
    },

    secrétaire: {
      label: "Secrétaire",
      className: "bg-amber-100 text-amber-700",
    },

    secretaire: {
      label: "Secrétaire",
      className: "bg-amber-100 text-amber-700",
    },

    administrateur: {
      label: "Administrateur",
      className: "bg-red-100 text-red-700",
    },
  };

  const config =
    roleStyles[normalizedRole] ??
    roleStyles.membre;

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide ${config.className}`}
    >
      {config.label}
    </span>
  );
}