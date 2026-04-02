import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { generateFullProfile } from '../services/api';
import { Avatar } from './ui/Avatar';
import { Badge } from './ui/Badge';
import { getProfileAge } from '../services/storage';
import { Trash2, Search, Clock } from 'lucide-react';

export function SavedProfiles() {
  const { state, dispatch } = useApp();
  const { savedProfiles } = state;
  const [filter, setFilter] = useState('');

  const filtered = savedProfiles.filter((p) => {
    const name = p.quick_card?.full_name || '';
    const inst = p.quick_card?.institution || '';
    const q = filter.toLowerCase();
    return name.toLowerCase().includes(q) || inst.toLowerCase().includes(q);
  });

  const handleOpenProfile = (profile) => {
    dispatch({ type: 'SET_CURRENT_PROFILE', payload: profile });
    dispatch({
      type: 'SET_PROFILE_LOADING',
      payload: { quickCard: false, research: false, media: false, values: false },
    });
    dispatch({ type: 'SET_VIEW', payload: 'profile' });
  };

  const handleDelete = (e, name) => {
    e.stopPropagation();
    dispatch({ type: 'REMOVE_SAVED_PROFILE', payload: name });
  };

  return (
    <div className="px-4 pt-6 pb-8">
      <h2 className="font-serif text-2xl text-white mb-1">Saved Profiles</h2>
      <p className="text-sm text-muted mb-4">{savedProfiles.length} profiles saved</p>

      {savedProfiles.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-card flex items-center justify-center mx-auto mb-4">
            <Search className="w-7 h-7 text-muted" />
          </div>
          <p className="text-sm text-muted">
            Search for someone to get started.<br />
            Your saved profiles will appear here.
          </p>
        </div>
      ) : (
        <>
          {savedProfiles.length > 3 && (
            <div className="mb-4">
              <div className="flex items-center gap-2 bg-card rounded-xl px-4 py-2.5 border border-border">
                <Search className="w-4 h-4 text-muted" />
                <input
                  type="text"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  placeholder="Filter saved profiles..."
                  className="flex-1 bg-transparent text-sm text-white placeholder-muted outline-none"
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            {filtered.map((profile) => {
              const qc = profile.quick_card || {};
              const age = getProfileAge(profile);

              return (
                <button
                  key={qc.full_name || `profile-${profile._savedAt}`}
                  onClick={() => handleOpenProfile(profile)}
                  className="w-full flex items-center gap-3 p-4 bg-card rounded-xl hover:bg-card-hover transition-colors text-left group"
                >
                  <Avatar name={qc.full_name} photoUrl={qc.photo_url} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{qc.full_name}</p>
                    <p className="text-xs text-muted truncate">
                      {qc.title}
                      {qc.institution ? ` · ${qc.institution}` : ''}
                    </p>
                    {qc.research_tags?.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {qc.research_tags.slice(0, 3).map((tag, j) => (
                          <Badge key={j} variant="amber">{tag}</Badge>
                        ))}
                      </div>
                    )}
                    {age && (
                      <p className="text-[10px] text-muted mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {age}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={(e) => handleDelete(e, qc.full_name)}
                    className="p-2 text-muted hover:text-danger opacity-0 group-hover:opacity-100 transition-all"
                    title="Remove"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
