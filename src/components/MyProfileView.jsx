import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { generateCompleteProfile } from '../services/api';
import { Avatar } from './ui/Avatar';
import { Badge } from './ui/Badge';
import { ArrowLeft, RefreshCw, Loader2, Edit3, Save, X } from 'lucide-react';

export function MyProfileView() {
  const { state, dispatch } = useApp();
  const profile = state.myProfile;
  const qc = profile?.quick_card || {};
  const [refreshing, setRefreshing] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    lookingFor: profile?._lookingFor || '',
    customTags: (qc.research_tags || []).join(', '),
  });

  const handleRefresh = async () => {
    if (!qc.full_name) return;
    setRefreshing(true);

    try {
      const { quickCard, fullProfile } = await generateCompleteProfile(
        qc.full_name,
        qc.institution || ''
      );

      const updated = {
        quick_card: quickCard || qc,
        ...(fullProfile || {}),
        _savedAt: Date.now(),
        _lookingFor: profile?._lookingFor || '',
      };

      dispatch({ type: 'SET_MY_PROFILE', payload: updated });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to refresh: ' + err.message });
    } finally {
      setRefreshing(false);
    }
  };

  const handleSaveEdit = () => {
    const tags = editForm.customTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    dispatch({
      type: 'UPDATE_MY_PROFILE',
      payload: {
        quick_card: { ...qc, research_tags: tags },
        _lookingFor: editForm.lookingFor,
      },
    });
    setEditing(false);
  };

  const handleBack = () => {
    dispatch({ type: 'SET_VIEW', payload: 'search' });
  };

  if (!profile) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted text-sm">No profile set up yet.</p>
        <button
          onClick={() => dispatch({ type: 'SET_VIEW', payload: 'onboarding' })}
          className="text-amber text-sm mt-2 hover:underline"
        >
          Set up now
        </button>
      </div>
    );
  }

  return (
    <div className="px-4 pt-4 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={handleBack} className="flex items-center gap-1 text-muted hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">Back</span>
        </button>
        <h2 className="font-serif text-lg text-white">My Profile</h2>
        <button
          onClick={() => setEditing(!editing)}
          className="text-muted hover:text-amber transition-colors"
        >
          {editing ? <X className="w-5 h-5" /> : <Edit3 className="w-5 h-5" />}
        </button>
      </div>

      {/* Profile Card */}
      <div className="bg-card rounded-xl p-6 animate-fade-in">
        <div className="flex items-start gap-4">
          <Avatar name={qc.full_name} photoUrl={qc.photo_url} size="lg" />
          <div className="min-w-0">
            <h2 className="font-serif text-2xl text-white">{qc.full_name}</h2>
            <p className="text-sm text-muted mt-0.5">
              {qc.title}
              {qc.institution ? `, ${qc.institution}` : ''}
            </p>
            {qc.location && <p className="text-sm text-muted">{qc.location}</p>}
          </div>
        </div>

        {qc.bio_blurb && (
          <p className="mt-4 text-sm text-gray-300 leading-relaxed italic">
            &ldquo;{qc.bio_blurb}&rdquo;
          </p>
        )}

        {/* Education */}
        {qc.education?.length > 0 && (
          <div className="mt-4 flex gap-2 overflow-x-auto no-scrollbar">
            {qc.education.map((edu, i) => (
              <div key={i} className="shrink-0 bg-navy rounded-lg px-3 py-2 text-center border border-border">
                <p className="text-xs font-medium text-white">{edu.institution}</p>
                <p className="text-[10px] text-muted">{edu.degree}{edu.year ? ` · ${edu.year}` : ''}</p>
              </div>
            ))}
          </div>
        )}

        {/* Tags */}
        {!editing && qc.research_tags?.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {qc.research_tags.map((tag, i) => (
              <Badge key={i} variant="amber">{tag}</Badge>
            ))}
          </div>
        )}
      </div>

      {/* Edit Mode */}
      {editing && (
        <div className="mt-4 bg-card rounded-xl p-5 animate-fade-in space-y-4">
          <div>
            <label className="text-xs text-muted uppercase tracking-wider font-medium mb-1 block">
              Your Interests / Tags
            </label>
            <input
              type="text"
              value={editForm.customTags}
              onChange={(e) => setEditForm({ ...editForm, customTags: e.target.value })}
              placeholder="Comma-separated tags (e.g., ML, NLP, Drug Discovery)"
              className="w-full bg-navy border border-border rounded-lg px-3 py-2 text-sm text-white placeholder-muted outline-none focus:border-amber/50"
            />
          </div>

          <div>
            <label className="text-xs text-muted uppercase tracking-wider font-medium mb-1 block">
              What are you looking for at conferences?
            </label>
            <textarea
              value={editForm.lookingFor}
              onChange={(e) => setEditForm({ ...editForm, lookingFor: e.target.value })}
              placeholder="e.g., Collaborators in drug discovery, investors for my startup, mentors in computational biology..."
              className="w-full bg-navy border border-border rounded-lg px-3 py-2 text-sm text-white placeholder-muted outline-none focus:border-amber/50 min-h-[80px] resize-y"
            />
          </div>

          <button
            onClick={handleSaveEdit}
            className="w-full py-2.5 bg-amber/10 text-amber rounded-lg text-sm font-medium hover:bg-amber/20 transition-colors flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save Changes
          </button>
        </div>
      )}

      {/* Looking For */}
      {!editing && profile._lookingFor && (
        <div className="mt-4 bg-card rounded-xl p-5">
          <h3 className="text-xs text-muted uppercase tracking-wider font-medium mb-2">
            What I'm Looking For
          </h3>
          <p className="text-sm text-gray-300">{profile._lookingFor}</p>
        </div>
      )}

      {/* Refresh */}
      <div className="mt-6 text-center">
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="text-sm text-muted hover:text-amber transition-colors flex items-center gap-2 mx-auto"
        >
          {refreshing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          {refreshing ? 'Refreshing...' : 'Refresh My Profile'}
        </button>
        {profile._savedAt && (
          <p className="text-[10px] text-muted mt-1">
            Last updated: {new Date(profile._savedAt).toLocaleDateString()}
          </p>
        )}
      </div>
    </div>
  );
}
