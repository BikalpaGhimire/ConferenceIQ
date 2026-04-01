import { useEffect, useRef } from 'react';
import { useApp } from './context/AppContext';
import { SearchScreen } from './components/SearchScreen';
import { DisambiguationScreen } from './components/DisambiguationScreen';
import { ProfileView } from './components/ProfileView';
import { ScheduleView } from './components/ScheduleView';
import { SavedProfiles } from './components/SavedProfiles';
import { OnboardingScreen } from './components/OnboardingScreen';
import { LoginScreen } from './components/LoginScreen';
import { MyProfileView } from './components/MyProfileView';
import { ErrorBanner } from './components/ui/ErrorBanner';
import { Avatar } from './components/ui/Avatar';
import { debouncedSync } from './services/syncService';
import { Bookmark, Search, UserCircle } from 'lucide-react';

export default function App() {
  const { state, dispatch } = useApp();
  const { currentView, error, onboardingComplete, myProfile, userId } = state;

  // Sync to server on data changes (debounced)
  const prevSyncRef = useRef('');
  useEffect(() => {
    if (!userId) return;
    const key = JSON.stringify({
      p: state.myProfile?._savedAt,
      s: state.savedProfiles.length,
      n: Object.keys(state.notes).length,
      r: state.recentSearches.length,
      v: currentView,
    });
    if (key === prevSyncRef.current) return;
    prevSyncRef.current = key;

    debouncedSync(userId, {
      profile: state.myProfile,
      savedProfiles: state.savedProfiles,
      notes: state.notes,
      recentSearches: state.recentSearches,
      lastView: currentView,
    });
  }, [userId, state.myProfile, state.savedProfiles, state.notes, state.recentSearches, currentView]);

  // Gate: show onboarding or login if not complete
  if (!onboardingComplete) {
    if (currentView === 'login') {
      return (
        <div className="min-h-screen bg-navy">
          <ErrorBanner message={error} onDismiss={() => dispatch({ type: 'CLEAR_ERROR' })} />
          <LoginScreen />
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-navy">
        <ErrorBanner message={error} onDismiss={() => dispatch({ type: 'CLEAR_ERROR' })} />
        <OnboardingScreen />
      </div>
    );
  }

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
      case 'my-profile':
        return <MyProfileView />;
      case 'onboarding':
        return <OnboardingScreen />;
      case 'login':
        return <LoginScreen />;
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
            className={`flex-1 flex flex-col items-center py-3 text-xs font-medium transition-colors relative ${
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
          <button
            onClick={() => dispatch({ type: 'SET_VIEW', payload: 'my-profile' })}
            className={`flex-1 flex flex-col items-center py-3 text-xs font-medium transition-colors ${
              currentView === 'my-profile'
                ? 'text-amber'
                : 'text-muted hover:text-white'
            }`}
          >
            {myProfile?.quick_card?.full_name ? (
              <div className="w-5 h-5 mb-1">
                <Avatar name={myProfile.quick_card.full_name} size="sm" />
              </div>
            ) : (
              <UserCircle className="w-5 h-5 mb-1" />
            )}
            Me
          </button>
        </div>
      </nav>
    </div>
  );
}
