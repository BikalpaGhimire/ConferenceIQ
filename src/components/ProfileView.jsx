import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { QuickCard } from './QuickCard';
import { ResearchPanel } from './ResearchPanel';
import { MediaPanel } from './MediaPanel';
import { ValuesPanel } from './ValuesPanel';
import { ConnectPanel } from './ConnectPanel';
import { BriefingMode } from './BriefingMode';
import { TabBar } from './ui/TabBar';
import { SkeletonProfile } from './ui/Skeleton';
import { ArrowLeft, Zap } from 'lucide-react';

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

  const profile = state.currentProfile;
  const anyLoading = Object.values(state.profileLoading).some(Boolean);

  const handleBack = () => {
    if ((state.candidates || []).length > 0) {
      dispatch({ type: 'SET_VIEW', payload: 'disambiguation' });
    } else {
      dispatch({ type: 'SET_VIEW', payload: 'search' });
    }
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
        <button
          onClick={() => setShowBriefing(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-amber/10 text-amber rounded-lg text-xs font-medium hover:bg-amber/20 transition-colors"
        >
          <Zap className="w-3.5 h-3.5" />
          Quick Briefing
        </button>
      </div>

      {/* Quick Card */}
      <QuickCard onOpenNotes={() => setShowNotes(!showNotes)} />

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
