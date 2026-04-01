import { useApp } from '../context/AppContext';
import { Badge } from './ui/Badge';
import { motion } from 'framer-motion';
import { Link2, Users, Lightbulb, BarChart3, UserCircle } from 'lucide-react';

export function CommonGroundCard() {
  const { state, dispatch } = useApp();
  const cg = state.currentProfile?.common_ground;
  const myProfile = state.myProfile;

  // If no user profile, prompt them to set one up
  if (!myProfile) {
    return (
      <div className="mx-4 mt-4 bg-card/50 rounded-xl p-4 border border-border border-dashed">
        <div className="flex items-center gap-3">
          <UserCircle className="w-8 h-8 text-amber/50 shrink-0" />
          <div>
            <p className="text-sm text-white font-medium">See how you connect</p>
            <p className="text-xs text-muted">
              Set up your profile to see Common Ground with every person you search.
            </p>
          </div>
          <button
            onClick={() => {
              dispatch({ type: 'SET_ONBOARDING_COMPLETE', payload: false });
              dispatch({ type: 'SET_VIEW', payload: 'onboarding' });
            }}
            className="shrink-0 px-3 py-1.5 bg-amber/10 text-amber rounded-lg text-xs font-medium hover:bg-amber/20 transition-colors"
          >
            Set Up
          </button>
        </div>
      </div>
    );
  }

  // If profile exists but no common ground data (profile generated before onboarding)
  if (!cg) {
    return null;
  }

  const hasContent =
    (cg.shared_fields?.length > 0) ||
    (cg.shared_collaborators?.length > 0) ||
    (cg.potential_synergies?.length > 0);

  if (!hasContent) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-4 mt-4 bg-gradient-to-br from-amber/5 to-teal/5 rounded-xl p-5 border border-amber/20"
    >
      <h3 className="text-xs uppercase tracking-wider text-amber font-medium flex items-center gap-2 mb-3">
        <Link2 className="w-4 h-4" />
        Common Ground With You
      </h3>

      {/* Relevance Score */}
      {cg.relevance_score != null && (
        <div className="flex items-center gap-3 mb-4">
          <BarChart3 className="w-4 h-4 text-muted shrink-0" />
          <div className="flex-1">
            <div className="h-2 bg-navy rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(cg.relevance_score * 100, 100)}%`,
                  backgroundColor: cg.relevance_score >= 0.7 ? '#f0a500' : cg.relevance_score >= 0.4 ? '#00d4aa' : '#8899aa',
                }}
              />
            </div>
          </div>
          <span className="text-xs font-mono text-muted">
            {Math.round(cg.relevance_score * 100)}% match
          </span>
        </div>
      )}

      {/* Shared Fields */}
      {cg.shared_fields?.length > 0 && (
        <div className="mb-3">
          <p className="text-[10px] text-muted uppercase tracking-wider mb-1">Shared Interests</p>
          <div className="flex flex-wrap gap-1.5">
            {cg.shared_fields.map((f, i) => (
              <Badge key={i} variant="teal">{f}</Badge>
            ))}
          </div>
        </div>
      )}

      {/* Shared Collaborators */}
      {cg.shared_collaborators?.length > 0 && (
        <div className="mb-3">
          <p className="text-[10px] text-muted uppercase tracking-wider mb-1 flex items-center gap-1">
            <Users className="w-3 h-3" />
            Shared Connections
          </p>
          <div className="space-y-1">
            {cg.shared_collaborators.map((name, i) => (
              <p key={i} className="text-sm text-gray-300">{name}</p>
            ))}
          </div>
        </div>
      )}

      {/* Synergies */}
      {cg.potential_synergies?.length > 0 && (
        <div>
          <p className="text-[10px] text-muted uppercase tracking-wider mb-1 flex items-center gap-1">
            <Lightbulb className="w-3 h-3" />
            Why You Should Connect
          </p>
          <ul className="space-y-1.5">
            {cg.potential_synergies.map((s, i) => (
              <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                <span className="text-amber mt-0.5">·</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  );
}
