"use client";

type CommunitySearchProps = {
  value: string;
  onChange: (value: string) => void;
};

export default function CommunitySearch({
  value,
  onChange,
}: CommunitySearchProps) {
  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
        🔎
      </div>

      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Rechercher une communauté..."
        className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
      />

      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute inset-y-0 right-0 flex items-center px-4 text-slate-400 transition hover:text-slate-700"
          aria-label="Effacer la recherche"
        >
          ✕
        </button>
      )}
    </div>
  );
}