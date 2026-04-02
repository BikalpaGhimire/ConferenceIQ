import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { generateQuickCard, generateFullProfile } from '../services/api';
import { Avatar } from './ui/Avatar';
import { SkeletonCard } from './ui/Skeleton';
import { ArrowLeft, ChevronRight, Loader2, RefreshCw } from 'lucide-react';

export function DisambiguationScreen() {
  const { state, dispatch } = useApp();
  const [loadingName, setLoadingName] = useState(null);

  const handleSelect = async (candidate) => {
    setLoadingName(candidate.full_name);

    dispatch({
      type: 'ADD_RECENT_SEARCH',
      payload: {
        name: candidate.full_name,
        institution: candidate.institution || '',
        timestamp: Date.now(),
      },
    });

    // Switch to profile view with all panels loading
    dispatch({ type: 'SET_VIEW', payload: 'profile' });
    dispatch({
      type: 'SET_PROFILE_LOADING',
      payload: { quickCard: true, research: true, media: true, values: true },
    });

    // Show candidate data as immediate placeholder
    dispatch({
      type: 'SET_CURRENT_PROFILE',
      payload: { quick_card: candidate, _savedAt: Date.now() },
    });

    const generatedForUser = state.myProfile?.quick_card?.full_name || null;
    let builtProfile = { quick_card: candidate, _savedAt: Date.now(), _generatedForUser: generatedForUser };

    // Step 1: Quick Card (fast) — update UI as soon as it's ready
    try {
      const quickCard = await generateQuickCard(
        candidate.full_name,
        candidate.institution,
        state.myProfile
      );
      if (quickCard) {
        builtProfile = { ...builtProfile, quick_card: quickCard };
        dispatch({ type: 'SET_CURRENT_PROFILE', payload: builtProfile });
      }
    } catch {
      // Keep candidate data as fallback
    }
    dispatch({ type: 'SET_PROFILE_LOADING', payload: { quickCard: false } });

    // Step 2: Full Profile (heavy) — panels populate when this returns
    // callClaude handles retries + backoff internally
    let fullProfile = null;
    try {
      fullProfile = await generateFullProfile(
        candidate.full_name,
        candidate.institution,
        state.myProfile
      );
    } catch {
      // callClaude already retried with exponential backoff
    }

    if (fullProfile) {
      builtProfile = { ...builtProfile, ...fullProfile, _generatedForUser: generatedForUser };
      dispatch({ type: 'UPDATE_PROFILE_SECTION', payload: fullProfile });
    } else {
      dispatch({ type: 'SET_ERROR', payload: 'Could not load full profile. Try the Refresh button.' });
    }

    // Cache full profile in recent searches so reopening doesn't re-fetch
    dispatch({
      type: 'UPDATE_RECENT_SEARCH_PROFILE',
      payload: { name: candidate.full_name, profile: builtProfile },
    });

    dispatch({
      type: 'SET_PROFILE_LOADING',
      payload: { research: false, media: false, values: false },
    });
  };

  const handleBack = () => {
    dispatch({ type: 'SET_VIEW', payload: 'search' });
  };

  return (
    <div className="px-4 pt-4 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={handleBack} className="flex items-center gap-1 text-muted hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">Back</span>
        </button>
        <h2 className="font-serif text-lg text-white">
          &ldquo;{state.searchQuery}&rdquo;
        </h2>
        <span className="text-sm text-muted">{(state.candidates || []).length} found</span>
      </div>

      <p className="text-sm text-muted text-center mb-4">
        Select the right person to view their full profile
      </p>

      {/* Candidate Cards */}
      <div className="space-y-3">
        {state.disambiguationLoading ? (
          Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          (state.candidates || []).map((candidate, i) => (
            <button
              key={candidate.full_name || `candidate-${i}`}
              onClick={() => handleSelect(candidate)}
              disabled={loadingName !== null}
              className="w-full bg-card rounded-xl p-5 hover:bg-card-hover transition-all text-left animate-fade-in border border-transparent hover:border-amber/20"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="flex items-start gap-4">
                <Avatar
                  name={candidate.full_name}
                  photoUrl={candidate.photo_url}
                  size="md"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-white">{candidate.full_name}</h3>
                    {loadingName === candidate.full_name ? (
                      <Loader2 className="w-4 h-4 text-amber animate-spin" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-muted" />
                    )}
                  </div>
                  {(candidate.title || candidate.institution) && (
                    <p className="text-sm text-muted mt-0.5">
                      {[candidate.title, candidate.institution].filter(Boolean).join(', ')}
                    </p>
                  )}
                  {candidate.field && (
                    <p className="text-sm text-muted">{candidate.field}</p>
                  )}
                  {candidate.h_index_approx != null && (
                    <p className="text-xs text-muted mt-1 font-mono">
                      h-index: ~{candidate.h_index_approx}
                    </p>
                  )}
                  {candidate.distinguishing_detail && (
                    <p className="text-xs text-teal mt-1">
                      {candidate.distinguishing_detail}
                    </p>
                  )}
                </div>
              </div>
              {candidate.confidence_score != null && (
                <div className="mt-3 flex items-center gap-2">
                  <div className="flex-1 h-1 bg-navy rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber rounded-full"
                      style={{ width: `${Math.min(candidate.confidence_score * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-muted font-mono">
                    {Math.round(candidate.confidence_score * 100)}%
                  </span>
                </div>
              )}
            </button>
          ))
        )}
      </div>

      {/* Refine Search */}
      <div className="mt-6 text-center">
        <button
          onClick={handleBack}
          className="text-sm text-muted hover:text-amber transition-colors flex items-center gap-2 mx-auto"
        >
          <RefreshCw className="w-4 h-4" />
          None of these? Refine search
        </button>
      </div>
    </div>
  );
}
