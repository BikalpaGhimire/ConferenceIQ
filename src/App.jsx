import { useApp } from './context/AppContext';
import { SearchScreen } from './components/SearchScreen';
import { DisambiguationScreen } from './components/DisambiguationScreen';
import { ProfileView } from './components/ProfileView';
import { ScheduleView } from './components/ScheduleView';
import { SavedProfiles } from './components/SavedProfiles';
import { ErrorBanner } from './components/ui/ErrorBanner';
import { Bookmark, Search } from 'lucide-react';

export default function App() {
  const { state, dispatch } = useApp();
  const { currentView, error } = state;

  const renderView = () => {
    switch (currentView) {
      case 'search':
        return <SearchScreen />;
      case 'disambiguation':
        return <DisambiguationScreen />;
      case 'profile':
        return <ProfileView />;
      case 'schedule':
        return <ScheduleView />;
      case 'saved':
        return <SavedProfiles />;
      default:
        return <SearchScreen />;
    }
  };

  return (
    <div className="min-h-screen bg-navy flex flex-col">
      <ErrorBanner
        message={error}
        onDismiss={() => dispatch({ type: 'CLEAR_ERROR' })}
      />

      <main className="flex-1 max-w-2xl mx-auto w-full">
        {renderView()}
      </main>

      {/* Bottom navigation */}
      <nav className="sticky bottom-0 bg-surface/80 backdrop-blur-lg border-t border-border">
        <div className="max-w-2xl mx-auto flex">
          <button
            onClick={() => {
              dispatch({ type: 'SET_VIEW', payload: 'search' });
              dispatch({ type: 'RESET_SEARCH' });
            }}
            className={`flex-1 flex flex-col items-center py-3 text-xs font-medium transition-colors ${
              currentView === 'search'
                ? 'text-amber'
                : 'text-muted hover:text-white'
            }`}
          >
            <Search className="w-5 h-5 mb-1" />
            Search
          </button>
          <button
            onClick={() => dispatch({ type: 'SET_VIEW', payload: 'saved' })}
            className={`flex-1 flex flex-col items-center py-3 text-xs font-medium transition-colors ${
              currentView === 'saved'
                ? 'text-amber'
                : 'text-muted hover:text-white'
            }`}
          >
            <Bookmark className="w-5 h-5 mb-1" />
            Saved
            {state.savedProfiles.length > 0 && (
              <span className="absolute top-2 right-1/2 translate-x-6 bg-amber text-navy text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {state.savedProfiles.length}
              </span>
            )}
          </button>
        </div>
      </nav>
    </div>
  );
}
