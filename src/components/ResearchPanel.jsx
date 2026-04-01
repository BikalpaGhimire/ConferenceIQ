import { useApp } from '../context/AppContext';
import { Skeleton } from './ui/Skeleton';
import { Badge } from './ui/Badge';
import { motion } from 'framer-motion';
import { BookOpen, Flame, Calendar, Microscope, Users, ExternalLink } from 'lucide-react';

export function ResearchPanel() {
  const { state } = useApp();
  const loading = state.profileLoading.research;
  const research = state.currentProfile?.research;

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <div className="bg-card rounded-xl p-5">
          <Skeleton lines={3} />
        </div>
        <div className="bg-card rounded-xl p-5">
          <Skeleton lines={5} />
        </div>
      </div>
    );
  }

  if (!research) {
    return (
      <div className="p-4">
        <p className="text-sm text-muted text-center py-8">
          No research data found. This doesn't mean they haven't published — it may not be findable via web search.
        </p>
      </div>
    );
  }

  const snap = research.impact_snapshot;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-4 space-y-4"
    >
      {/* Impact Snapshot */}
      {snap && (
        <div className="bg-card rounded-xl p-5">
          <h3 className="text-xs uppercase tracking-wider text-muted font-medium flex items-center gap-2 mb-3">
            <BookOpen className="w-4 h-4 text-amber" />
            Research Impact Snapshot
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {snap.approx_publications > 0 && (
              <Stat label="Publications" value={`~${snap.approx_publications}`} />
            )}
            {snap.h_index_approx > 0 && (
              <Stat label="h-index" value={`~${snap.h_index_approx}`} />
            )}
          </div>
          {snap.top_fields?.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {snap.top_fields.map((f, i) => (
                <Badge key={i}>{f}</Badge>
              ))}
            </div>
          )}
          {snap.peak_period && (
            <p className="text-xs text-muted mt-2">Most active: {snap.peak_period}</p>
          )}
        </div>
      )}

      {/* Landmark Papers */}
      {research.landmark_papers?.length > 0 && (
        <div className="bg-card rounded-xl p-5">
          <h3 className="text-xs uppercase tracking-wider text-muted font-medium flex items-center gap-2 mb-3">
            <Flame className="w-4 h-4 text-amber" />
            Landmark Papers
          </h3>
          <div className="space-y-4">
            {research.landmark_papers.map((paper, i) => (
              <PaperCard key={i} paper={paper} />
            ))}
          </div>
        </div>
      )}

      {/* Recent Papers */}
      {research.recent_papers?.length > 0 && (
        <div className="bg-card rounded-xl p-5">
          <h3 className="text-xs uppercase tracking-wider text-muted font-medium flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-teal" />
            Recent Publications
          </h3>
          <div className="space-y-4">
            {research.recent_papers.map((paper, i) => (
              <PaperCard key={i} paper={paper} compact />
            ))}
          </div>
        </div>
      )}

      {/* Research Evolution */}
      {research.research_evolution && (
        <div className="bg-card rounded-xl p-5">
          <h3 className="text-xs uppercase tracking-wider text-muted font-medium flex items-center gap-2 mb-3">
            <Microscope className="w-4 h-4 text-teal" />
            Research Evolution
          </h3>
          <p className="text-sm text-gray-300 leading-relaxed">
            {research.research_evolution}
          </p>
        </div>
      )}

      {/* Collaborators */}
      {research.key_collaborators?.length > 0 && (
        <div className="bg-card rounded-xl p-5">
          <h3 className="text-xs uppercase tracking-wider text-muted font-medium flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-amber" />
            Key Collaborators
          </h3>
          <div className="space-y-2">
            {research.key_collaborators.map((collab, i) => (
              <div key={i} className="flex items-center justify-between py-1">
                <div>
                  <p className="text-sm text-white">{collab.name}</p>
                  <p className="text-xs text-muted">{collab.institution}</p>
                </div>
                {collab.joint_papers_approx > 0 && (
                  <span className="text-xs text-muted font-mono">
                    ~{collab.joint_papers_approx} joint
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="bg-navy rounded-lg px-3 py-2">
      <p className="text-lg font-mono text-amber">{value}</p>
      <p className="text-[10px] text-muted uppercase tracking-wider">{label}</p>
    </div>
  );
}

function PaperCard({ paper, compact = false }) {
  return (
    <div className="border-l-2 border-amber/20 pl-3">
      <p className="text-sm text-white font-medium leading-snug">{paper.title}</p>
      <p className="text-xs text-muted mt-1">
        {paper.journal}
        {paper.year ? `, ${paper.year}` : ''}
        {paper.approx_citations ? ` · ~${paper.approx_citations} citations` : ''}
      </p>
      {!compact && paper.plain_english_summary && (
        <p className="text-xs text-teal mt-1">{paper.plain_english_summary}</p>
      )}
      {paper.url && (
        <a
          href={paper.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-amber hover:text-amber-light mt-1"
        >
          Open Link <ExternalLink className="w-3 h-3" />
        </a>
      )}
    </div>
  );
}
