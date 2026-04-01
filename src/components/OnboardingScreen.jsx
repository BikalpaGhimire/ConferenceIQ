import { useState, useCallback, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { disambiguateName, generateCompleteProfile } from '../services/api';
import { Avatar } from './ui/Avatar';
import { Search, Loader2, ChevronRight, Check, SkipForward, User } from 'lucide-react';

export function OnboardingScreen() {
  const { state, dispatch } = useApp();
  const [step, setStep] = useState('welcome'); // welcome | search | disambiguate | generating | confirm | manual
  const [query, setQuery] = useState('');
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generatedProfile, setGeneratedProfile] = useState(null);
  const [manualForm, setManualForm] = useState({ name: '', institution: '', field: '' });
  const [error, setError] = useState(null);

  const handleSearch = useCallback(async (e) => {
    e?.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const results = await disambiguateName(query.trim(), {});
      if (!results || results.length === 0) {
        setError("Couldn't find you. Try adding your institution, or set up manually.");
        setLoading(false);
        return;
      }

      if (results.length === 1 && (results[0].confidence_score ?? 0) >= 0.8) {
        await selectCandidate(results[0]);
      } else {
        setCandidates(results);
        setStep('disambiguate');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [query]);

  const selectCandidate = async (candidate) => {
    setStep('generating');
    setLoading(true);

    try {
      const { quickCard, fullProfile } = await generateCompleteProfile(
        candidate.full_name,
        candidate.institution
      );

      const profile = {
        quick_card: quickCard || candidate,
        ...(fullProfile || {}),
        _savedAt: Date.now(),
      };

      setGeneratedProfile(profile);
      setStep('confirm');
    } catch (err) {
      // Use candidate data as fallback
      setGeneratedProfile({
        quick_card: candidate,
        _savedAt: Date.now(),
      });
      setStep('confirm');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    dispatch({ type: 'SET_MY_PROFILE', payload: generatedProfile });
    dispatch({ type: 'SET_ONBOARDING_COMPLETE', payload: true });
    dispatch({ type: 'SET_VIEW', payload: 'search' });
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualForm.name.trim()) return;

    const profile = {
      quick_card: {
        full_name: manualForm.name.trim(),
        institution: manualForm.institution.trim(),
        field: manualForm.field.trim(),
        research_tags: manualForm.field ? [manualForm.field.trim()] : [],
      },
      _savedAt: Date.now(),
      _manual: true,
    };

    dispatch({ type: 'SET_MY_PROFILE', payload: profile });
    dispatch({ type: 'SET_ONBOARDING_COMPLETE', payload: true });
    dispatch({ type: 'SET_VIEW', payload: 'search' });
  };

  const handleSkip = () => {
    dispatch({ type: 'SET_ONBOARDING_COMPLETE', payload: true });
    dispatch({ type: 'SET_VIEW', payload: 'search' });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      {/* Welcome Step */}
      {step === 'welcome' && (
        <div className="text-center max-w-md animate-fade-in">
          <div className="w-20 h-20 rounded-full bg-amber/20 flex items-center justify-center mx-auto mb-6">
            <User className="w-10 h-10 text-amber" />
          </div>
          <h1 className="font-serif text-3xl text-white mb-3">Welcome to ConferenceIQ</h1>
          <p className="text-muted text-sm mb-2">
            Let's set up your profile first so we can personalize your experience.
          </p>
          <p className="text-muted text-xs mb-8">
            We'll search for you the same way we search for others — finding your work,
            interests, and background so we can show you how you connect with everyone you look up.
          </p>
          <button
            onClick={() => setStep('search')}
            className="w-full py-3 bg-amber/10 text-amber rounded-xl text-sm font-medium hover:bg-amber/20 transition-colors mb-3"
          >
            Find My Profile
          </button>
          <button
            onClick={() => setStep('manual')}
            className="w-full py-3 bg-card border border-border rounded-xl text-sm text-muted hover:text-white transition-colors mb-3"
          >
            Set Up Manually
          </button>
          <button
            onClick={handleSkip}
            className="text-xs text-muted hover:text-amber transition-colors flex items-center gap-1 mx-auto"
          >
            <SkipForward className="w-3 h-3" />
            Skip for now
          </button>
        </div>
      )}

      {/* Search Step */}
      {step === 'search' && (
        <div className="w-full max-w-md animate-fade-in">
          <h2 className="font-serif text-2xl text-white text-center mb-2">Find Yourself</h2>
          <p className="text-muted text-sm text-center mb-6">
            Search your name to build your profile
          </p>

          <form onSubmit={handleSearch} className="search-glow rounded-xl bg-card border border-border focus-within:border-amber/50 transition-all">
            <div className="flex items-center px-4 py-3">
              {loading ? (
                <Loader2 className="w-5 h-5 text-amber animate-spin shrink-0" />
              ) : (
                <Search className="w-5 h-5 text-muted shrink-0" />
              )}
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Your full name..."
                className="flex-1 bg-transparent ml-3 text-white placeholder-muted outline-none text-base"
                disabled={loading}
                autoFocus
              />
            </div>
          </form>

          {error && (
            <p className="text-sm text-danger mt-3 text-center">{error}</p>
          )}

          <div className="flex justify-between mt-6">
            <button
              onClick={() => setStep('welcome')}
              className="text-sm text-muted hover:text-white transition-colors"
            >
              Back
            </button>
            <button
              onClick={() => setStep('manual')}
              className="text-sm text-muted hover:text-amber transition-colors"
            >
              Set up manually instead
            </button>
          </div>
        </div>
      )}

      {/* Disambiguation Step */}
      {step === 'disambiguate' && (
        <div className="w-full max-w-md animate-fade-in">
          <h2 className="font-serif text-2xl text-white text-center mb-2">Which one is you?</h2>
          <p className="text-muted text-sm text-center mb-6">
            We found {candidates.length} matches
          </p>

          <div className="space-y-3">
            {candidates.map((c, i) => (
              <button
                key={c.full_name || i}
                onClick={() => selectCandidate(c)}
                className="w-full flex items-center gap-4 p-4 bg-card rounded-xl hover:bg-card-hover transition-colors text-left border border-transparent hover:border-amber/20"
              >
                <Avatar name={c.full_name} photoUrl={c.photo_url} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{c.full_name}</p>
                  <p className="text-xs text-muted">
                    {[c.title, c.institution].filter(Boolean).join(', ')}
                  </p>
                  {c.field && <p className="text-xs text-teal mt-0.5">{c.field}</p>}
                </div>
                <ChevronRight className="w-4 h-4 text-muted shrink-0" />
              </button>
            ))}
          </div>

          <div className="flex justify-between mt-6">
            <button
              onClick={() => { setStep('search'); setCandidates([]); }}
              className="text-sm text-muted hover:text-white transition-colors"
            >
              Back
            </button>
            <button
              onClick={() => setStep('manual')}
              className="text-sm text-muted hover:text-amber transition-colors"
            >
              None of these — set up manually
            </button>
          </div>
        </div>
      )}

      {/* Generating Step */}
      {step === 'generating' && (
        <div className="text-center animate-fade-in">
          <Loader2 className="w-10 h-10 text-amber animate-spin mx-auto mb-4" />
          <h2 className="font-serif text-xl text-white mb-2">Building your profile...</h2>
          <p className="text-muted text-sm">This takes about 15 seconds</p>
        </div>
      )}

      {/* Confirm Step */}
      {step === 'confirm' && generatedProfile && (
        <div className="w-full max-w-md animate-fade-in">
          <h2 className="font-serif text-2xl text-white text-center mb-6">Is this you?</h2>

          <div className="bg-card rounded-xl p-6 mb-6">
            <div className="flex items-start gap-4">
              <Avatar
                name={generatedProfile.quick_card?.full_name}
                photoUrl={generatedProfile.quick_card?.photo_url}
                size="lg"
              />
              <div className="min-w-0">
                <h3 className="font-serif text-xl text-white">
                  {generatedProfile.quick_card?.full_name}
                </h3>
                <p className="text-sm text-muted mt-0.5">
                  {generatedProfile.quick_card?.title}
                  {generatedProfile.quick_card?.institution ? `, ${generatedProfile.quick_card.institution}` : ''}
                </p>
              </div>
            </div>

            {generatedProfile.quick_card?.bio_blurb && (
              <p className="mt-4 text-sm text-gray-300 leading-relaxed italic">
                &ldquo;{generatedProfile.quick_card.bio_blurb}&rdquo;
              </p>
            )}

            {generatedProfile.quick_card?.research_tags?.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {generatedProfile.quick_card.research_tags.map((tag, i) => (
                  <span key={i} className="px-2 py-0.5 rounded-full text-xs bg-amber/10 text-amber border border-amber/30">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={handleConfirm}
            className="w-full py-3 bg-amber/10 text-amber rounded-xl text-sm font-medium hover:bg-amber/20 transition-colors flex items-center justify-center gap-2 mb-3"
          >
            <Check className="w-4 h-4" />
            Yes, this is me
          </button>
          <button
            onClick={() => { setStep('search'); setGeneratedProfile(null); }}
            className="w-full py-3 bg-card border border-border rounded-xl text-sm text-muted hover:text-white transition-colors mb-3"
          >
            No, search again
          </button>
          <button
            onClick={() => setStep('manual')}
            className="text-xs text-muted hover:text-amber transition-colors mx-auto block"
          >
            Set up manually instead
          </button>
        </div>
      )}

      {/* Manual Setup Step */}
      {step === 'manual' && (
        <div className="w-full max-w-md animate-fade-in">
          <h2 className="font-serif text-2xl text-white text-center mb-2">Quick Setup</h2>
          <p className="text-muted text-sm text-center mb-6">
            Enter the basics — you can search for your full profile later
          </p>

          <form onSubmit={handleManualSubmit} className="space-y-3">
            <input
              type="text"
              value={manualForm.name}
              onChange={(e) => setManualForm({ ...manualForm, name: e.target.value })}
              placeholder="Your full name *"
              className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm text-white placeholder-muted outline-none focus:border-amber/50"
              autoFocus
            />
            <input
              type="text"
              value={manualForm.institution}
              onChange={(e) => setManualForm({ ...manualForm, institution: e.target.value })}
              placeholder="Institution / Company"
              className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm text-white placeholder-muted outline-none focus:border-amber/50"
            />
            <input
              type="text"
              value={manualForm.field}
              onChange={(e) => setManualForm({ ...manualForm, field: e.target.value })}
              placeholder="Field / Discipline"
              className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm text-white placeholder-muted outline-none focus:border-amber/50"
            />
            <button
              type="submit"
              disabled={!manualForm.name.trim()}
              className="w-full py-3 bg-amber/10 text-amber rounded-xl text-sm font-medium hover:bg-amber/20 transition-colors disabled:opacity-50"
            >
              Continue
            </button>
          </form>

          <button
            onClick={() => setStep('welcome')}
            className="text-sm text-muted hover:text-white transition-colors mt-4 mx-auto block"
          >
            Back
          </button>
        </div>
      )}
    </div>
  );
}
