export function TabBar({ tabs, activeTab, onTabChange }) {
  return (
    <div className="flex gap-1 overflow-x-auto no-scrollbar border-b border-border">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors relative ${
            activeTab === tab.id
              ? 'text-amber'
              : 'text-muted hover:text-white'
          }`}
        >
          {tab.label}
          {activeTab === tab.id && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber rounded-full" />
          )}
        </button>
      ))}
    </div>
  );
}
