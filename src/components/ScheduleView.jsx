import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { disambiguateName, generateQuickCard, generateFullProfile } from '../services/api';
import { Avatar } from './ui/Avatar';
import { ArrowLeft, CheckSquare, Square, Loader2, Users, Check, AlertCircle } from 'lucide-react';

export function ScheduleView() {
  const { state, dispatch } = useApp();
  const { extractedNames, scheduleSource, selectedForProfiling, batchProgress } = state;
  const [profiling, setProfiling] = useState(false);
  const [failed, setFailed] = useState([]);
  const [done, setDone] = useState(false);

  // Group names by session
  const sessions = {};
  (extractedNames || []).forEach((entry) => {
    const key = entry.session_title || 'Extracted';
    if (!sessions[key]) {
      sessions[key] = { time: entry.session_time, names: [] };
    }
    sessions[key].names.push(entry);
  });

  const handleToggle = (name) => {
    dispatch({ type: 'TOGGLE_SELECT_FOR_PROFILING', payload: name });
  };

  const handleSelectAll = () => {
    dispatch({ type: 'SELECT_ALL_FOR_PROFILING' });
  };

  const handleProfileSelected = async () => {
    const names = [...selectedForProfiling];
    if (names.length === 0) return;

    setProfiling(true);
    setFailed([]);
    setDone(false);
    dispatch({ type: 'SET_BATCH_PROGRESS', payload: { completed: 0, total: names.length } });

    for (let i = 0; i < names.length; i++) {
      const name = names[i];
      const entry = (extractedNames || []).find((e) => e.name === name) || {};

      try {
        const candidates = await disambiguateName(name, {
          institution: entry.affiliation || '',
          conference: scheduleSource,
        }, state.myProfile);

        if (!candidates || candidates.length === 0) {
          setFailed((prev) => [...prev, name]);
          dispatch({
            type: 'SET_BATCH_PROGRESS',
            payload: { completed: i + 1, total: names.length },
          });
          continue;
        }

        const best = candidates[0];

        // Sequential: Quick Card then Full Profile
        const quickCard = await generateQuickCard(best.full_name, best.institution, state.myProfile).catch(() => null);
        const fullProfile = await generateFullProfile(best.full_name, best.institution, state.myProfile).catch(() => null);

        const profile = {
          quick_card: quickCard || best,
          ...(fullProfile || {}),
          _savedAt: Date.now(),
        };

        dispatch({ type: 'SAVE_PROFILE', payload: profile });
      } catch (err) {
        setFailed((prev) => [...prev, name]);
      }

      dispatch({
        type: 'SET_BATCH_PROGRESS',
        payload: { completed: i + 1, total: names.length },
      });

      // Rate limit: 1s between (faster since we parallelized card+profile)
      if (i < names.length - 1) {
        await new Promise((r) => setTimeout(r, 1000));
      }
    }

    setProfiling(false);
    setDone(true);
  };

  const handleBack = () => {
    dispatch({ type: 'SET_VIEW', payload: 'search' });
  };

  const handleViewSaved = () => {
    dispatch({ type: 'SET_VIEW', payload: 'saved' });
  };

  return (
    <div className="px-4 pt-4 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <button onClick={handleBack} className="flex items-center gap-1 text-muted hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">Back</span>
        </button>
        <h2 className="font-serif text-lg text-white">Conference Schedule</h2>
        <span className="text-sm text-muted">{(extractedNames || []).length} names</span>
      </div>

      <p className="text-xs text-muted mb-4">
        Extracted from: {scheduleSource || 'Unknown'}
      </p>

      {/* Batch Progress */}
      {(profiling || done) && (
        <div className="mb-4 bg-card rounded-xl p-4 animate-fade-in">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-white flex items-center gap-2">
              {profiling ? (
                <Loader2 className="w-4 h-4 animate-spin text-amber" />
              ) : (
                <Check className="w-4 h-4 text-teal" />
              )}
              {profiling ? 'Profiling...' : 'Done!'}
            </span>
            <span className="text-sm text-muted font-mono">
              {batchProgress.completed}/{batchProgress.total}
            </span>
          </div>
          <div className="h-2 bg-navy rounded-full overflow-hidden">
            <div
              className="h-full bg-amber rounded-full transition-all duration-500"
              style={{
                width: batchProgress.total > 0
                  ? `${(batchProgress.completed / batchProgress.total) * 100}%`
                  : '0%',
              }}
            />
          </div>
          {failed.length > 0 && (
            <p className="text-xs text-danger mt-2 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {failed.length} name{failed.length !== 1 ? 's' : ''} failed: {failed.join(', ')}
            </p>
          )}
          {done && (
            <button
              onClick={handleViewSaved}
              className="w-full mt-3 py-2 bg-teal/10 text-teal rounded-lg text-sm font-medium hover:bg-teal/20 transition-colors"
            >
              View Saved Profiles
            </button>
          )}
        </div>
      )}

      {/* Session Groups */}
      <div className="space-y-4">
        {Object.entries(sessions).map(([sessionTitle, session]) => (
          <div key={sessionTitle}>
            <h3 className="text-xs text-muted uppercase tracking-wider font-medium mb-2 flex items-center gap-2">
              {session.time && <span className="text-amber">{session.time}</span>}
              {sessionTitle}
            </h3>
            <div className="space-y-2">
              {session.names.map((entry) => {
                const selected = selectedForProfiling.includes(entry.name);
                return (
                  <button
                    key={entry.name + (entry.talk_title || '')}
                    onClick={() => handleToggle(entry.name)}
                    disabled={profiling}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                      selected
                        ? 'bg-amber/10 border border-amber/30'
                        : 'bg-card border border-transparent hover:border-border'
                    }`}
                  >
                    {selected ? (
                      <CheckSquare className="w-5 h-5 text-amber shrink-0" />
                    ) : (
                      <Square className="w-5 h-5 text-muted shrink-0" />
                    )}
                    <Avatar name={entry.name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{entry.name}</p>
                      {entry.affiliation && (
                        <p className="text-xs text-muted truncate">{entry.affiliation}</p>
                      )}
                      {entry.talk_title && (
                        <p className="text-xs text-teal truncate">&ldquo;{entry.talk_title}&rdquo;</p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      {!done && (
        <div className="mt-6 space-y-3 sticky bottom-16 bg-navy pt-3">
          <div className="flex gap-3">
            <button
              onClick={handleSelectAll}
              disabled={profiling}
              className="flex-1 py-3 bg-card border border-border rounded-xl text-sm text-muted hover:text-white transition-colors"
            >
              Select All ({(extractedNames || []).length})
            </button>
            <button
              onClick={handleProfileSelected}
              disabled={profiling || selectedForProfiling.length === 0}
              className="flex-1 py-3 bg-amber/10 text-amber rounded-xl text-sm font-medium hover:bg-amber/20 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Users className="w-4 h-4" />
              Profile ({selectedForProfiling.length})
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
