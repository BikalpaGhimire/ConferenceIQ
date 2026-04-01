import { useApp } from '../context/AppContext';
import { isProfileSaved } from '../services/storage';
import { Avatar } from './ui/Avatar';
import { Badge } from './ui/Badge';
import { Skeleton } from './ui/Skeleton';
import { Star, Share2, StickyNote, MessageSquareQuote } from 'lucide-react';
import { motion } from 'framer-motion';

export function QuickCard({ onOpenNotes }) {
  const { state, dispatch } = useApp();
  const profile = state.currentProfile;
  const qc = profile?.quick_card;
  const loading = state.profileLoading.quickCard;

  if (loading) {
    return (
      <div className="bg-card rounded-xl p-6 mx-4">
        <div className="flex items-start gap-4">
          <div className="skeleton w-20 h-20 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-6 w-56" />
            <div className="skeleton h-4 w-72" />
            <div className="skeleton h-4 w-48" />
          </div>
        </div>
        <div className="mt-4">
          <Skeleton lines={3} />
        </div>
      </div>
    );
  }

  if (!qc) return null;

  const isSaved = isProfileSaved(state.savedProfiles, qc.full_name);

  const handleSave = () => {
    if (isSaved) {
      dispatch({ type: 'REMOVE_SAVED_PROFILE', payload: qc.full_name });
    } else {
      dispatch({ type: 'SAVE_PROFILE', payload: { ...profile, _savedAt: Date.now() } });
    }
  };

  const handleShare = async () => {
    const text = `${qc.full_name}${qc.title ? ` — ${qc.title}` : ''}${qc.institution ? `, ${qc.institution}` : ''}\n\n${qc.bio_blurb || ''}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: qc.full_name, text });
      } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(text);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl p-6 mx-4"
    >
      {/* Action Buttons */}
      <div className="flex justify-end gap-2 mb-4">
        <button
          onClick={handleSave}
          className={`p-2 rounded-lg transition-colors ${
            isSaved
              ? 'bg-amber/20 text-amber'
              : 'bg-navy text-muted hover:text-amber'
          }`}
          title={isSaved ? 'Remove bookmark' : 'Save profile'}
        >
          <Star className="w-4 h-4" fill={isSaved ? 'currentColor' : 'none'} />
        </button>
        <button
          onClick={handleShare}
          className="p-2 rounded-lg bg-navy text-muted hover:text-teal transition-colors"
          title="Share profile"
        >
          <Share2 className="w-4 h-4" />
        </button>
        <button
          onClick={onOpenNotes}
          className="p-2 rounded-lg bg-navy text-muted hover:text-amber transition-colors"
          title="Notes"
        >
          <StickyNote className="w-4 h-4" />
        </button>
      </div>

      {/* Identity */}
      <div className="flex items-start gap-4">
        <Avatar name={qc.full_name} photoUrl={qc.photo_url} size="lg" />
        <div className="min-w-0">
          <h2 className="font-serif text-2xl text-white">{qc.full_name}</h2>
          <p className="text-sm text-muted mt-0.5">
            {qc.title}
            {qc.department ? `, ${qc.department}` : ''}
          </p>
          <p className="text-sm text-muted">
            {qc.institution}
            {qc.location ? ` · ${qc.location}` : ''}
          </p>
        </div>
      </div>

      {/* Bio */}
      {qc.bio_blurb && (
        <p className="mt-4 text-sm text-gray-300 leading-relaxed italic">
          &ldquo;{qc.bio_blurb}&rdquo;
        </p>
      )}

      {/* Education */}
      {qc.education?.length > 0 && (
        <div className="mt-4 flex gap-2 overflow-x-auto no-scrollbar">
          {qc.education.map((edu, i) => (
            <div
              key={i}
              className="shrink-0 bg-navy rounded-lg px-3 py-2 text-center border border-border"
            >
              <p className="text-xs font-medium text-white">{edu.institution}</p>
              <p className="text-[10px] text-muted">
                {edu.degree}
                {edu.year ? ` · ${edu.year}` : ''}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Tags */}
      {qc.research_tags?.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {qc.research_tags.map((tag, i) => (
            <Badge key={i} variant="amber">{tag}</Badge>
          ))}
        </div>
      )}

      {/* Conversation Starters */}
      {qc.conversation_starters?.length > 0 && (
        <div className="mt-5 pt-5 border-t border-border">
          <h3 className="text-xs uppercase tracking-wider text-muted font-medium flex items-center gap-2 mb-3">
            <MessageSquareQuote className="w-4 h-4 text-amber" />
            Conversation Starters
            {profile?._generatedForUser && (
              <span className="px-1.5 py-0.5 bg-teal/10 text-teal text-[9px] rounded-full border border-teal/30 font-medium">
                Personalized
              </span>
            )}
          </h3>
          <div className="space-y-3">
            {qc.conversation_starters.map((starter, i) => (
              <p key={i} className="text-sm text-gray-300 pl-4 border-l-2 border-amber/30">
                &ldquo;{starter}&rdquo;
              </p>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
