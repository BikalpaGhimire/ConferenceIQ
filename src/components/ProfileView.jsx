import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { generateQuickCard, generateFullProfile } from '../services/api';
import { QuickCard } from './QuickCard';
import { ResearchPanel } from './ResearchPanel';
import { MediaPanel } from './MediaPanel';
import { ValuesPanel } from './ValuesPanel';
import { ConnectPanel } from './ConnectPanel';
import { BriefingMode } from './BriefingMode';
import { CommonGroundCard } from './CommonGroundCard';
import { TabBar } from './ui/TabBar';
import { SkeletonProfile } from './ui/Skeleton';
import { ArrowLeft, Zap, RefreshCw, Loader2 } from 'lucide-react';

const tabs = [
  { id: 'research', label: 'Research' },
  { id: 'media', label: 'Media' },
  { id: 'activity', label: 'Activity' },
  { id: 'connect', label: 'Connect' },
];

export function ProfileView() {
  const { state, dispatch } = useApp();
  const [activeTab, setActiveTab] = useState('research');
  const [showNotes, setShowNotes] = useState(false);
  const [showBriefing, setShowBriefing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const profile = state.currentProfile;
  const anyLoading = Object.values(state.profileLoading).some(Boolean);

  const handleBack = () => {
    if ((state.candidates || []).length > 0) {
      dispatch({ type: 'SET_VIEW', payload: 'disambiguation' });
    } else {
      dispatch({ type: 'SET_VIEW', payload: 'search' });
    }
  };

  const handleRefresh = async () => {
    const name = profile?.quick_card?.full_name;
    const institution = profile?.quick_card?.institution || '';
    if (!name) return;

    setRefreshing(true);
    dispatch({
      type: 'SET_PROFILE_LOADING',
      payload: { quickCard: true, research: true, media: true, values: true },
    });

    const generatedForUser = state.myProfile?.quick_card?.full_name || null;
    let builtProfile = { ...profile };

    try {
      const quickCard = await generateQuickCard(name, institution, state.myProfile);
      if (quickCard) {
        builtProfile = { ...builtProfile, quick_card: quickCard, _savedAt: Date.now(), _generatedForUser: generatedForUser };
        dispatch({ type: 'SET_CURRENT_PROFILE', payload: builtProfile });
      }
    } catch { /* keep existing */ }
    dispatch({ type: 'SET_PROFILE_LOADING', payload: { quickCard: false } });

    try {
      const fullProfile = await generateFullProfile(name, institution, state.myProfile);
      if (fullProfile) {
        builtProfile = { ...builtProfile, ...fullProfile, _generatedForUser: generatedForUser };
        dispatch({ type: 'UPDATE_PROFILE_SECTION', payload: fullProfile });
      }
    } catch { /* keep existing */ }

    // Update cache in recent searches
    dispatch({
      type: 'UPDATE_RECENT_SEARCH_PROFILE',
      payload: { name, profile: builtProfile },
    });

    dispatch({
      type: 'SET_PROFILE_LOADING',
      payload: { research: false, media: false, values: false },
    });
    setRefreshing(false);
  };

  if (!profile && anyLoading) {
    return <SkeletonProfile />;
  }

  if (!profile) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted text-sm">No profile loaded.</p>
        <button onClick={handleBack} className="text-amber text-sm mt-2 hover:underline">
          Go back
        </button>
      </div>
    );
  }

  const renderPanel = () => {
    switch (activeTab) {
      case 'research': return <ResearchPanel />;
      case 'media': return <MediaPanel />;
      case 'activity': return <ValuesPanel />;
      case 'connect': return <ConnectPanel />;
      default: return <ResearchPanel />;
    }
  };

  return (
    <div className="pb-8">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 mb-4">
        <button
          onClick={handleBack}
          className="flex items-center gap-1 text-muted hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">Back</span>
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing || anyLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-card border border-border rounded-lg text-xs text-muted hover:text-white hover:border-amber/30 transition-colors disabled:opacity-50"
            title="Refresh profile with fresh data"
          >
            {refreshing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            Refresh
          </button>
          <button
            onClick={() => setShowBriefing(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber/10 text-amber rounded-lg text-xs font-medium hover:bg-amber/20 transition-colors"
          >
            <Zap className="w-3.5 h-3.5" />
            Briefing
          </button>
        </div>
      </div>

      {/* Quick Card */}
      <QuickCard onOpenNotes={() => setShowNotes(!showNotes)} />

      {/* Common Ground */}
      <CommonGroundCard />

      {/* Tab Bar */}
      <div className="mt-6 px-4">
        <TabBar tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      {/* Active Panel */}
      {renderPanel()}

      {/* Briefing Mode Modal */}
      {showBriefing && profile && (
        <BriefingMode
          profile={profile}
          onClose={() => setShowBriefing(false)}
        />
      )}
    </div>
  );
}
