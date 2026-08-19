"use client";

export type CommunityTab = "all" | "mine";

type CommunityTabsProps = {
  activeTab: CommunityTab;
  onChange: (tab: CommunityTab) => void;
};

export default function CommunityTabs({
  activeTab,
  onChange,
}: CommunityTabsProps) {
  const tabs: {
    id: CommunityTab;
    label: string;
    icon: string;
  }[] = [
    {
      id: "all",
      label: "Toutes",
      icon: "🌍",
    },
    {
      id: "mine",
      label: "Mes communautés",
      icon: "👥",
    },
  ];

  return (
    <div className="flex overflow-x-auto rounded-2xl bg-slate-100 p-1">
      {tabs.map((tab) => {
        const active = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`
              flex min-w-fit flex-1 items-center justify-center gap-2
              rounded-xl px-4 py-3 text-sm font-semibold
              transition
              ${
                active
                  ? "bg-white text-emerald-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }
            `}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}