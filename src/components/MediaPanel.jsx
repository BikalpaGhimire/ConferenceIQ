import { useApp } from '../context/AppContext';
import { Skeleton } from './ui/Skeleton';
import { motion } from 'framer-motion';
import { Newspaper, Mic, Globe, Trophy, ExternalLink } from 'lucide-react';

export function MediaPanel() {
  const { state } = useApp();
  const loading = state.profileLoading.media;
  const media = state.currentProfile?.media;

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <div className="bg-card rounded-xl p-5"><Skeleton lines={4} /></div>
        <div className="bg-card rounded-xl p-5"><Skeleton lines={3} /></div>
      </div>
    );
  }

  if (!media) {
    return (
      <div className="p-4">
        <p className="text-sm text-muted text-center py-8">
          No media presence found via web search.
        </p>
      </div>
    );
  }

  const hasContent = media.news_mentions?.length > 0 || media.talks?.length > 0 ||
    media.social_profiles?.length > 0 || media.awards?.length > 0;

  if (!hasContent) {
    return (
      <div className="p-4">
        <p className="text-sm text-muted text-center py-8">
          Limited media presence found. This doesn't mean there isn't any — just that it wasn't findable via web search.
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
      {/* News */}
      {media.news_mentions?.length > 0 && (
        <div className="bg-card rounded-xl p-5">
          <h3 className="text-xs uppercase tracking-wider text-muted font-medium flex items-center gap-2 mb-3">
            <Newspaper className="w-4 h-4 text-amber" />
            In the News
          </h3>
          <div className="space-y-3">
            {media.news_mentions.map((item, i) => (
              <div key={i} className="border-l-2 border-teal/30 pl-3">
                <p className="text-sm text-white">{item.headline}</p>
                <p className="text-xs text-muted mt-0.5">
                  {item.source}
                  {item.date ? ` · ${item.date}` : ''}
                </p>
                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-teal hover:text-teal-dim mt-1"
                  >
                    Read <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Talks */}
      {media.talks?.length > 0 && (
        <div className="bg-card rounded-xl p-5">
          <h3 className="text-xs uppercase tracking-wider text-muted font-medium flex items-center gap-2 mb-3">
            <Mic className="w-4 h-4 text-amber" />
            Talks & Appearances
          </h3>
          <div className="space-y-3">
            {media.talks.map((talk, i) => (
              <div key={i} className="border-l-2 border-amber/20 pl-3">
                <p className="text-sm text-white">{talk.title || talk.event}</p>
                <p className="text-xs text-muted mt-0.5">
                  {talk.event}
                  {talk.year ? `, ${talk.year}` : ''}
                </p>
                {talk.url && (
                  <a
                    href={talk.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-amber hover:text-amber-light mt-1"
                  >
                    Watch <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Social & Online */}
      {media.social_profiles?.length > 0 && (
        <div className="bg-card rounded-xl p-5">
          <h3 className="text-xs uppercase tracking-wider text-muted font-medium flex items-center gap-2 mb-3">
            <Globe className="w-4 h-4 text-teal" />
            Social & Online
          </h3>
          <div className="space-y-2">
            {media.social_profiles.map((profile, i) => (
              <div key={i} className="flex items-center justify-between py-1">
                <div className="min-w-0">
                  <p className="text-sm text-white">{profile.platform}</p>
                  {profile.handle && (
                    <p className="text-xs text-muted">{profile.handle}</p>
                  )}
                  {profile.note && (
                    <p className="text-xs text-teal">{profile.note}</p>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {profile.followers_approx > 0 && (
                    <span className="text-xs text-muted font-mono">
                      {profile.followers_approx > 1000
                        ? `${(profile.followers_approx / 1000).toFixed(1)}K`
                        : profile.followers_approx}
                    </span>
                  )}
                  {profile.url && (
                    <a
                      href={profile.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-teal hover:text-teal-dim"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Awards */}
      {media.awards?.length > 0 && (
        <div className="bg-card rounded-xl p-5">
          <h3 className="text-xs uppercase tracking-wider text-muted font-medium flex items-center gap-2 mb-3">
            <Trophy className="w-4 h-4 text-amber" />
            Awards & Recognition
          </h3>
          <div className="space-y-2">
            {media.awards.map((award, i) => (
              <div key={i} className="flex items-center justify-between py-1">
                <p className="text-sm text-white">{award.name}</p>
                {award.year && <span className="text-xs text-muted font-mono">{award.year}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
