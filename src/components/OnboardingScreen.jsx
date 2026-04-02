import { useState, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { disambiguateName, generateFullProfile } from '../services/api';
import { registerUser } from '../services/syncService';
import { Avatar } from './ui/Avatar';
import { PinInput } from './ui/PinInput';
import { Search, Loader2, ChevronRight, Check, SkipForward, User, Lock } from 'lucide-react';

export function OnboardingScreen() {
  const { state, dispatch } = useApp();
  const [step, setStep] = useState('welcome'); // welcome | search | disambiguate | generating | pin | confirm | manual
  const [query, setQuery] = useState('');
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generatedProfile, setGeneratedProfile] = useState(null);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
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
      // Candidate already has quick_card fields from enriched disambiguation
      // Only need the full profile call (1 API call instead of 2)
      const fullProfile = await generateFullProfile(candidate.full_name, candidate.institution).catch(() => null);

      const profile = {
        quick_card: candidate,
        ...(fullProfile || {}),
        _savedAt: Date.now(),
      };

      setGeneratedProfile(profile);
      setStep('pin');
    } catch {
      setGeneratedProfile({ quick_card: candidate, _savedAt: Date.now() });
      setStep('pin');
    } finally {
      setLoading(false);
    }
  };

  const handlePinSubmit = async () => {
    if (pin.length !== 6 || !/^\d{6}$/.test(pin)) {
      setPinError('Enter exactly 6 digits');
      return;
    }

    setLoading(true);
    setPinError('');

    try {
      const profile = generatedProfile || {
        quick_card: { full_name: manualForm.name, institution: manualForm.institution, research_tags: manualForm.field ? [manualForm.field] : [] },
        _savedAt: Date.now(),
        _manual: true,
      };

      const name = profile.quick_card?.full_name || manualForm.name || '';
      const { userId } = await registerUser(pin, name, profile);

      dispatch({ type: 'SET_USER_ID', payload: userId });
      dispatch({ type: 'SET_MY_PROFILE', payload: profile });
      dispatch({ type: 'SET_ONBOARDING_COMPLETE', payload: true });
      dispatch({ type: 'SET_VIEW', payload: 'search' });
    } catch (err) {
      setPinError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    dispatch({ type: 'SET_ONBOARDING_COMPLETE', payload: true });
    dispatch({ type: 'SET_VIEW', payload: 'search' });
  };

  const handleManualToPinStep = (e) => {
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

    setGeneratedProfile(profile);
    setStep('pin');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      {/* Welcome */}
      {step === 'welcome' && (
        <div className="text-center max-w-md animate-fade-in">
          <div className="w-20 h-20 rounded-full bg-amber/20 flex items-center justify-center mx-auto mb-6">
            <User className="w-10 h-10 text-amber" />
          </div>
          <h1 className="font-serif text-3xl text-white mb-3">Welcome to ConferenceIQ</h1>
          <p className="text-muted text-sm mb-8">
            Let's set up your profile so we can personalize your experience and show you how you connect with everyone you look up.
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
          <div className="flex justify-center gap-4 mt-4">
            <button
              onClick={() => dispatch({ type: 'SET_VIEW', payload: 'login' })}
              className="text-xs text-amber hover:underline"
            >
              I have a PIN — log in
            </button>
            <button
              onClick={handleSkip}
              className="text-xs text-muted hover:text-amber transition-colors flex items-center gap-1"
            >
              <SkipForward className="w-3 h-3" />
              Skip
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      {step === 'search' && (
        <div className="w-full max-w-md animate-fade-in">
          <h2 className="font-serif text-2xl text-white text-center mb-2">Find Yourself</h2>
          <p className="text-muted text-sm text-center mb-6">Search your name to build your profile</p>

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

          {error && <p className="text-sm text-danger mt-3 text-center">{error}</p>}

          <div className="flex justify-between mt-6">
            <button onClick={() => setStep('welcome')} className="text-sm text-muted hover:text-white transition-colors">Back</button>
            <button onClick={() => setStep('manual')} className="text-sm text-muted hover:text-amber transition-colors">Set up manually</button>
          </div>
        </div>
      )}

      {/* Disambiguate */}
      {step === 'disambiguate' && (
        <div className="w-full max-w-md animate-fade-in">
          <h2 className="font-serif text-2xl text-white text-center mb-2">Which one is you?</h2>
          <p className="text-muted text-sm text-center mb-6">{candidates.length} matches</p>

          <div className="space-y-3">
            {candidates.map((c, i) => (
              <button
                key={c.full_name || i}
                onClick={() => selectCandidate(c)}
                className="w-full flex items-center gap-4 p-4 bg-card rounded-xl hover:bg-card-hover transition-colors text-left border border-transparent hover:border-amber/20"
              >
                <Avatar name={c.full_name} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{c.full_name}</p>
                  <p className="text-xs text-muted">{[c.title, c.institution].filter(Boolean).join(', ')}</p>
                  {c.field && <p className="text-xs text-teal mt-0.5">{c.field}</p>}
                </div>
                <ChevronRight className="w-4 h-4 text-muted shrink-0" />
              </button>
            ))}
          </div>

          <div className="flex justify-between mt-6">
            <button onClick={() => { setStep('search'); setCandidates([]); }} className="text-sm text-muted hover:text-white transition-colors">Back</button>
            <button onClick={() => setStep('manual')} className="text-sm text-muted hover:text-amber transition-colors">None — set up manually</button>
          </div>
        </div>
      )}

      {/* Generating */}
      {step === 'generating' && (
        <div className="text-center animate-fade-in">
          <Loader2 className="w-10 h-10 text-amber animate-spin mx-auto mb-4" />
          <h2 className="font-serif text-xl text-white mb-2">Building your profile...</h2>
          <p className="text-muted text-sm">This takes about 15 seconds</p>
        </div>
      )}

      {/* PIN Setup */}
      {step === 'pin' && (
        <div className="w-full max-w-md animate-fade-in text-center">
          {/* Show mini profile preview */}
          {generatedProfile?.quick_card && (
            <div className="bg-card rounded-xl p-4 mb-6 flex items-center gap-3 text-left">
              <Avatar name={generatedProfile.quick_card.full_name} size="md" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">{generatedProfile.quick_card.full_name}</p>
                <p className="text-xs text-muted truncate">
                  {[generatedProfile.quick_card.title, generatedProfile.quick_card.institution].filter(Boolean).join(', ')}
                </p>
              </div>
              <Check className="w-5 h-5 text-teal shrink-0" />
            </div>
          )}

          <div className="w-14 h-14 rounded-full bg-amber/20 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-7 h-7 text-amber" />
          </div>
          <h2 className="font-serif text-2xl text-white mb-2">Create Your PIN</h2>
          <p className="text-muted text-sm mb-6">
            Choose a 6-digit PIN to save your profile and log in later on any device.
          </p>

          <div className="mb-6">
            <PinInput
              value={pin}
              onChange={(v) => { setPin(v); setPinError(''); }}
              onSubmit={handlePinSubmit}
            />
          </div>

          {pinError && <p className="text-sm text-danger mb-4">{pinError}</p>}

          <button
            onClick={handlePinSubmit}
            disabled={pin.length !== 6 || loading}
            className="w-full py-3 bg-amber/10 text-amber rounded-xl text-sm font-medium hover:bg-amber/20 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {loading ? 'Saving...' : 'Save & Continue'}
          </button>

          <button
            onClick={handleSkip}
            className="text-xs text-muted hover:text-amber transition-colors mt-4 block mx-auto"
          >
            Skip PIN — use locally only
          </button>
        </div>
      )}

      {/* Manual Setup */}
      {step === 'manual' && (
        <div className="w-full max-w-md animate-fade-in">
          <h2 className="font-serif text-2xl text-white text-center mb-2">Quick Setup</h2>
          <p className="text-muted text-sm text-center mb-6">Enter the basics</p>

          <form onSubmit={handleManualToPinStep} className="space-y-3">
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

          <button onClick={() => setStep('welcome')} className="text-sm text-muted hover:text-white transition-colors mt-4 mx-auto block">Back</button>
        </div>
      )}
    </div>
  );
}
