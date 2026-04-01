import { useApp } from '../context/AppContext';
import { Skeleton } from './ui/Skeleton';
import { motion } from 'framer-motion';
import { Compass, Target, MessageCircle, Lightbulb } from 'lucide-react';

export function ValuesPanel() {
  const { state } = useApp();
  const loading = state.profileLoading.values;
  const values = state.currentProfile?.values_and_style;

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <div className="bg-card rounded-xl p-5"><Skeleton lines={4} /></div>
        <div className="bg-card rounded-xl p-5"><Skeleton lines={3} /></div>
      </div>
    );
  }

  if (!values) {
    return (
      <div className="p-4">
        <p className="text-sm text-muted text-center py-8">
          No activity or values data found via web search.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-4 space-y-4"
    >
      {/* Causes & Advocacy */}
      {values.causes_and_advocacy?.length > 0 && (
        <div className="bg-card rounded-xl p-5">
          <h3 className="text-xs uppercase tracking-wider text-muted font-medium flex items-center gap-2 mb-3">
            <Compass className="w-4 h-4 text-amber" />
            What They Care About
          </h3>
          <div className="space-y-3">
            {values.causes_and_advocacy.map((cause, i) => (
              <div key={i} className="border-l-2 border-amber/20 pl-3">
                <p className="text-sm text-white font-medium">{cause.topic}</p>
                <p className="text-xs text-muted mt-0.5">{cause.evidence}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Professional Roles */}
      {values.professional_roles?.length > 0 && (
        <div className="bg-card rounded-xl p-5">
          <h3 className="text-xs uppercase tracking-wider text-muted font-medium flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-teal" />
            Professional Roles
          </h3>
          <ul className="space-y-1.5">
            {values.professional_roles.map((role, i) => (
              <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                <span className="text-amber mt-1">·</span>
                {role}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Communication Style */}
      {values.communication_style && (
        <div className="bg-card rounded-xl p-5">
          <h3 className="text-xs uppercase tracking-wider text-muted font-medium flex items-center gap-2 mb-3">
            <MessageCircle className="w-4 h-4 text-amber" />
            Communication Style
          </h3>
          <p className="text-sm text-gray-300 leading-relaxed italic">
            &ldquo;{values.communication_style}&rdquo;
          </p>
        </div>
      )}

      {/* Talking Points */}
      {values.talking_points?.length > 0 && (
        <div className="bg-card rounded-xl p-5">
          <h3 className="text-xs uppercase tracking-wider text-muted font-medium flex items-center gap-2 mb-3">
            <Lightbulb className="w-4 h-4 text-teal" />
            Potential Talking Points
          </h3>
          <ul className="space-y-2">
            {values.talking_points.map((point, i) => (
              <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                <span className="text-teal mt-1">·</span>
                {point}
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  );
}
