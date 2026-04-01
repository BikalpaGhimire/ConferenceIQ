import { motion } from 'framer-motion';
import { X, Zap } from 'lucide-react';

export function BriefingMode({ profile, onClose }) {
  const qc = profile?.quick_card;
  const values = profile?.values_and_style;
  const research = profile?.research;

  if (!qc) return null;

  // Pick the most recent notable thing
  const recentHighlight =
    research?.recent_papers?.[0]?.title ||
    profile?.media?.news_mentions?.[0]?.headline ||
    profile?.media?.awards?.[0]?.name ||
    '';

  const causes = (values?.causes_and_advocacy || [])
    .slice(0, 2)
    .map((c) => c.topic)
    .join(', ');

  const bestStarter = qc.conversation_starters?.[0] || '';

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-navy-light rounded-2xl p-8 w-full max-w-md border border-amber/20 shadow-2xl"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 text-amber">
            <Zap className="w-5 h-5" />
            <span className="font-serif text-lg">Quick Briefing</span>
          </div>
          <button onClick={onClose} className="text-muted hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <h2 className="font-serif text-2xl text-white mb-6">{qc.full_name}</h2>

        <div className="space-y-4">
          <BriefingLine
            label="WHO"
            value={`${qc.title || ''}${qc.institution ? `, ${qc.institution}` : ''}`}
          />
          {qc.research_tags?.length > 0 && (
            <BriefingLine
              label="KNOWN FOR"
              value={qc.research_tags.slice(0, 3).join(', ')}
            />
          )}
          {recentHighlight && (
            <BriefingLine label="RECENTLY" value={recentHighlight} />
          )}
          {causes && <BriefingLine label="VALUES" value={causes} />}
        </div>

        {bestStarter && (
          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-xs text-amber uppercase tracking-wider font-medium mb-2">
              SAY THIS
            </p>
            <p className="text-base text-white leading-relaxed">
              &ldquo;{bestStarter}&rdquo;
            </p>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full mt-6 py-3 bg-amber/10 text-amber rounded-xl text-sm font-medium hover:bg-amber/20 transition-colors"
        >
          Got it — go connect
        </button>
      </motion.div>
    </div>
  );
}

function BriefingLine({ label, value }) {
  return (
    <div className="flex gap-3">
      <span className="text-xs text-amber font-mono font-bold w-20 shrink-0 mt-0.5">
        {label}
      </span>
      <p className="text-sm text-gray-300 leading-relaxed">{value}</p>
    </div>
  );
}
