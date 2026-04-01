import { useState, useCallback, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { disambiguateName, generateCompleteProfile } from '../services/api';
import { Avatar } from './ui/Avatar';
import { FileUploader } from './FileUploader';
import { PasteModal } from './PasteModal';
import { Search, Upload, ClipboardPaste, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { timeAgo } from '../utils/formatters';

export function SearchScreen() {
  const { state, dispatch } = useApp();
  const [showHints, setShowHints] = useState(false);
  const [showPaste, setShowPaste] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [loading, setLoading] = useState(false);
  const searchId = useRef(0);

  const runSearch = useCallback(async (query, hints) => {
    if (!query) return;

    const thisSearch = ++searchId.current;
    setLoading(true);
    dispatch({ type: 'CLEAR_ERROR' });

    try {
      const candidates = await disambiguateName(query, hints);

      // Abort if a newer search started
      if (searchId.current !== thisSearch) return;

      if (!candidates || candidates.length === 0) {
        dispatch({ type: 'SET_ERROR', payload: 'No matches found. Try adding more context (institution, field).' });
        setLoading(false);
        return;
      }

      dispatch({
        type: 'ADD_RECENT_SEARCH',
        payload: {
          name: query,
          institution: candidates[0]?.institution || '',
          timestamp: Date.now(),
        },
      });

      if (candidates.length === 1 && (candidates[0].confidence_score ?? 0) >= 0.8) {
        await loadProfile(candidates[0], thisSearch);
      } else {
        dispatch({ type: 'SET_CANDIDATES', payload: candidates });
        dispatch({ type: 'SET_VIEW', payload: 'disambiguation' });
      }
    } catch (err) {
      if (searchId.current !== thisSearch) return;
      dispatch({ type: 'SET_ERROR', payload: err.message });
    } finally {
      if (searchId.current === thisSearch) setLoading(false);
    }
  }, [dispatch]);

  const loadProfile = async (candidate, reqId) => {
    dispatch({ type: 'SET_VIEW', payload: 'profile' });
    dispatch({
      type: 'SET_PROFILE_LOADING',
      payload: { quickCard: true, research: true, media: true, values: true },
    });

    // Show candidate data immediately as placeholder
    dispatch({
      type: 'SET_CURRENT_PROFILE',
      payload: { quick_card: candidate, _savedAt: Date.now() },
    });

    // Fire Quick Card + Full Profile in PARALLEL for speed
    const { quickCard, fullProfile } = await generateCompleteProfile(
      candidate.full_name,
      candidate.institution
    );

    // Abort if user started a different search
    if (reqId && searchId.current !== reqId) return;

    if (quickCard) {
      dispatch({
        type: 'SET_CURRENT_PROFILE',
        payload: { quick_card: quickCard, _savedAt: Date.now(), ...(fullProfile || {}) },
      });
    } else if (fullProfile) {
      dispatch({ type: 'UPDATE_PROFILE_SECTION', payload: fullProfile });
    }

    dispatch({
      type: 'SET_PROFILE_LOADING',
      payload: { quickCard: false, research: false, media: false, values: false },
    });
  };

  const handleSearch = (e) => {
    e?.preventDefault();
    runSearch(state.searchQuery.trim(), state.contextHints);
  };

  const handleRecentClick = (recent) => {
    dispatch({ type: 'SET_SEARCH_QUERY', payload: recent.name });
    runSearch(recent.name, state.contextHints);
  };

  return (
    <div className="flex flex-col items-center px-4 pt-12 pb-8">
      {/* Logo */}
      <div className="mb-8 text-center">
        <h1 className="font-serif text-4xl text-white mb-2">ConferenceIQ</h1>
        <p className="text-muted text-sm">Know anyone in 60 seconds</p>
      </div>

      {/* Search Bar */}
      <form
        id="search-form"
        onSubmit={handleSearch}
        className="w-full max-w-md search-glow rounded-xl bg-card border border-border focus-within:border-amber/50 transition-all"
      >
        <div className="flex items-center px-4 py-3">
          {loading ? (
            <Loader2 className="w-5 h-5 text-amber animate-spin shrink-0" />
          ) : (
            <Search className="w-5 h-5 text-muted shrink-0" />
          )}
          <input
            type="text"
            value={state.searchQuery}
            onChange={(e) => dispatch({ type: 'SET_SEARCH_QUERY', payload: e.target.value })}
            placeholder="Search a name..."
            className="flex-1 bg-transparent ml-3 text-white placeholder-muted outline-none text-base"
            disabled={loading}
            autoFocus
          />
        </div>
      </form>

      {/* Context Hints Toggle */}
      <button
        onClick={() => setShowHints(!showHints)}
        className="flex items-center gap-1 mt-3 text-xs text-muted hover:text-amber transition-colors"
      >
        {showHints ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        Add context for better results
      </button>

      {/* Context Hints */}
      {showHints && (
        <div className="w-full max-w-md mt-3 grid grid-cols-2 gap-2 animate-fade-in">
          {[
            { key: 'field', placeholder: 'Field (e.g., CS, Biology)' },
            { key: 'institution', placeholder: 'Institution' },
            { key: 'conference', placeholder: 'Conference name' },
            { key: 'country', placeholder: 'Country / Region' },
          ].map(({ key, placeholder }) => (
            <input
              key={key}
              type="text"
              value={state.contextHints[key]}
              onChange={(e) =>
                dispatch({
                  type: 'SET_CONTEXT_HINTS',
                  payload: { [key]: e.target.value },
                })
              }
              placeholder={placeholder}
              className="bg-card border border-border rounded-lg px-3 py-2 text-sm text-white placeholder-muted outline-none focus:border-amber/50"
            />
          ))}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 mt-6 w-full max-w-md">
        <button
          onClick={() => setShowUpload(true)}
          className="flex-1 flex items-center justify-center gap-2 bg-card border border-border rounded-xl py-3 text-sm text-muted hover:text-white hover:border-amber/30 transition-all"
        >
          <Upload className="w-4 h-4" />
          Upload Schedule
        </button>
        <button
          onClick={() => setShowPaste(true)}
          className="flex-1 flex items-center justify-center gap-2 bg-card border border-border rounded-xl py-3 text-sm text-muted hover:text-white hover:border-amber/30 transition-all"
        >
          <ClipboardPaste className="w-4 h-4" />
          Paste Text
        </button>
      </div>

      {/* Recently Viewed */}
      {state.recentSearches.length > 0 && (
        <div className="w-full max-w-md mt-8">
          <h3 className="text-xs text-muted uppercase tracking-wider mb-3 font-medium">
            Recently Viewed
          </h3>
          <div className="space-y-2">
            {state.recentSearches.map((recent) => (
              <button
                key={recent.name + recent.timestamp}
                onClick={() => handleRecentClick(recent)}
                className="w-full flex items-center gap-3 p-3 bg-card rounded-xl hover:bg-card-hover transition-colors text-left"
              >
                <Avatar name={recent.name} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{recent.name}</p>
                  {recent.institution && (
                    <p className="text-xs text-muted truncate">{recent.institution}</p>
                  )}
                </div>
                <span className="text-xs text-muted shrink-0">
                  {timeAgo(recent.timestamp)}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      {showUpload && <FileUploader onClose={() => setShowUpload(false)} />}
      {showPaste && <PasteModal onClose={() => setShowPaste(false)} />}
    </div>
  );
}
