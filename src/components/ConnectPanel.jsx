import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { generateFollowUpEmail } from '../services/api';
import { Skeleton } from './ui/Skeleton';
import { NotesEditor } from './NotesEditor';
import { motion } from 'framer-motion';
import { Mail, Globe, Users, StickyNote, Send, RefreshCw, Loader2, Copy, Check, ExternalLink } from 'lucide-react';

export function ConnectPanel() {
  const { state, dispatch } = useApp();
  const profile = state.currentProfile;
  const contact = profile?.contact;
  const qc = profile?.quick_card;
  const loading = state.profileLoading.values;
  const [draftEmail, setDraftEmail] = useState('');
  const [drafting, setDrafting] = useState(false);
  const [copied, setCopied] = useState(false);

  const name = qc?.full_name || '';
  const noteText = state.notes[name] || '';

  // Find mutual connections (other saved profiles that share collaborators)
  const mutualConnections = [];
  if (profile?.research?.key_collaborators) {
    const collabNames = profile.research.key_collaborators.map((c) => c.name);
    state.savedProfiles.forEach((saved) => {
      if (saved.quick_card?.full_name === name) return;
      const savedCollabs = saved.research?.key_collaborators?.map((c) => c.name) || [];
      const shared = collabNames.filter((n) => savedCollabs.includes(n));
      if (shared.length > 0) {
        mutualConnections.push({
          name: saved.quick_card?.full_name,
          institution: saved.quick_card?.institution,
          sharedCollabs: shared,
        });
      }
      // Also check if saved profile IS a collaborator
      if (collabNames.includes(saved.quick_card?.full_name)) {
        mutualConnections.push({
          name: saved.quick_card?.full_name,
          institution: saved.quick_card?.institution,
          directCollab: true,
        });
      }
    });
  }

  const handleDraftEmail = async () => {
    setDrafting(true);
    try {
      const email = await generateFollowUpEmail(profile, noteText);
      setDraftEmail(email);
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to draft email: ' + err.message });
    } finally {
      setDrafting(false);
    }
  };

  const handleCopyEmail = async () => {
    await navigator.clipboard.writeText(draftEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <div className="bg-card rounded-xl p-5"><Skeleton lines={3} /></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-4 space-y-4"
    >
      {/* Contact Info */}
      {contact && (contact.email || contact.lab_website || contact.personal_website || contact.google_scholar_url || contact.linkedin_url) && (
        <div className="bg-card rounded-xl p-5">
          <h3 className="text-xs uppercase tracking-wider text-muted font-medium flex items-center gap-2 mb-3">
            <Mail className="w-4 h-4 text-amber" />
            Contact Info
          </h3>
          <div className="space-y-2">
            {contact.email && (
              <ContactLink icon={Mail} label={contact.email} href={`mailto:${contact.email}`} />
            )}
            {contact.lab_website && (
              <ContactLink icon={Globe} label="Lab Website" href={contact.lab_website} external />
            )}
            {contact.personal_website && (
              <ContactLink icon={Globe} label="Personal Website" href={contact.personal_website} external />
            )}
            {contact.google_scholar_url && (
              <ContactLink icon={Globe} label="Google Scholar" href={contact.google_scholar_url} external />
            )}
            {contact.linkedin_url && (
              <ContactLink icon={Globe} label="LinkedIn" href={contact.linkedin_url} external />
            )}
            {contact.office && (
              <p className="text-sm text-gray-300 flex items-center gap-2">
                <Globe className="w-4 h-4 text-muted shrink-0" />
                {contact.office}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Mutual Connections */}
      {mutualConnections.length > 0 && (
        <div className="bg-card rounded-xl p-5">
          <h3 className="text-xs uppercase tracking-wider text-muted font-medium flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-teal" />
            Mutual Connections
          </h3>
          <div className="space-y-2">
            {mutualConnections.map((conn, i) => (
              <div key={i} className="text-sm text-gray-300 border-l-2 border-teal/30 pl-3">
                <p className="text-white font-medium">{conn.name}</p>
                <p className="text-xs text-muted">
                  {conn.institution}
                  {conn.directCollab
                    ? ' — direct collaborator'
                    : ` — shared connection: ${conn.sharedCollabs.join(', ')}`}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      <div className="bg-card rounded-xl p-5">
        <h3 className="text-xs uppercase tracking-wider text-muted font-medium flex items-center gap-2 mb-3">
          <StickyNote className="w-4 h-4 text-amber" />
          Your Notes
        </h3>
        <NotesEditor name={name} />
      </div>

      {/* Draft Follow-Up Email */}
      <div className="bg-card rounded-xl p-5">
        <h3 className="text-xs uppercase tracking-wider text-muted font-medium flex items-center gap-2 mb-3">
          <Send className="w-4 h-4 text-teal" />
          Draft Follow-Up Email
        </h3>
        {draftEmail ? (
          <div>
            <div className="bg-navy rounded-lg p-4 text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
              {draftEmail}
            </div>
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleCopyEmail}
                className="flex items-center gap-2 px-3 py-2 bg-teal/10 text-teal rounded-lg text-sm hover:bg-teal/20 transition-colors"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <button
                onClick={handleDraftEmail}
                className="flex items-center gap-2 px-3 py-2 bg-card text-muted rounded-lg text-sm hover:text-white transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Regenerate
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={handleDraftEmail}
            disabled={drafting}
            className="w-full py-3 bg-teal/10 text-teal rounded-lg text-sm hover:bg-teal/20 transition-colors flex items-center justify-center gap-2"
          >
            {drafting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Drafting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Generate Follow-Up Email
              </>
            )}
          </button>
        )}
      </div>

      {/* Refresh Profile */}
      <div className="text-center py-2">
        <p className="text-xs text-muted mb-2">
          Profile generated: {profile?._savedAt ? new Date(profile._savedAt).toLocaleString() : 'Unknown'}
        </p>
        <button
          onClick={() => {
            dispatch({ type: 'SET_VIEW', payload: 'search' });
            dispatch({ type: 'SET_SEARCH_QUERY', payload: name });
          }}
          className="text-xs text-muted hover:text-amber transition-colors flex items-center gap-1 mx-auto"
        >
          <RefreshCw className="w-3 h-3" />
          Refresh Profile
        </button>
      </div>
    </motion.div>
  );
}

function ContactLink({ icon: Icon, label, href, external }) {
  return (
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      className="text-sm text-teal hover:text-teal-dim flex items-center gap-2 transition-colors"
    >
      <Icon className="w-4 h-4 text-muted shrink-0" />
      <span className="truncate">{label}</span>
      {external && <ExternalLink className="w-3 h-3 shrink-0" />}
    </a>
  );
}
