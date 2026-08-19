"use client";

type ActivityTypeBadgeProps = {
  name?: string | null;
  icon?: string | null;
  code?: string | null;
};

export default function ActivityTypeBadge({
  name,
  icon,
  code,
}: ActivityTypeBadgeProps) {
  const labels: Record<string, string> = {
    FEAST: "Fête des 19 jours",
    HOLY_DAY: "Jour saint",
    DEVOTIONAL: "Dévotion",
    STUDY_CIRCLE: "Cercle d'étude",
    CHILDREN_CLASS: "Classe pour enfants",
    JUNIOR_YOUTH: "Groupe de jeunes",
    MEETING: "Réunion",
    SERVICE: "Acte de service",
    ADMINISTRATIVE: "Réunion administrative",
    OTHER: "Autre",
  };

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-700">
      <span>{icon || "📅"}</span>
      <span>{name || (code ? labels[code] : "Activité")}</span>
    </span>
  );
}