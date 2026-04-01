import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { loginUser } from '../services/syncService';
import { PinInput } from './ui/PinInput';
import { Lock, Loader2, ArrowLeft } from 'lucide-react';

export function LoginScreen() {
  const { dispatch } = useApp();
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (pin.length !== 6) {
      setError('Enter your 6-digit PIN');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await loginUser(pin);

      dispatch({ type: 'SET_USER_ID', payload: data.userId });
      if (data.profile) {
        dispatch({ type: 'SET_MY_PROFILE', payload: data.profile });
      }
      if (data.savedProfiles?.length > 0) {
        dispatch({ type: 'SET_SAVED_PROFILES', payload: data.savedProfiles });
      }
      if (data.notes && Object.keys(data.notes).length > 0) {
        dispatch({ type: 'SET_NOTES', payload: data.notes });
      }
      if (data.recentSearches?.length > 0) {
        dispatch({ type: 'SET_RECENT_SEARCHES', payload: data.recentSearches });
      }
      dispatch({ type: 'SET_ONBOARDING_COMPLETE', payload: true });
      dispatch({ type: 'SET_VIEW', payload: 'search' });
    } catch (err) {
      setError(err.message || 'Invalid PIN');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-md animate-fade-in text-center">
        <div className="w-14 h-14 rounded-full bg-amber/20 flex items-center justify-center mx-auto mb-4">
          <Lock className="w-7 h-7 text-amber" />
        </div>
        <h2 className="font-serif text-2xl text-white mb-2">Welcome Back</h2>
        <p className="text-muted text-sm mb-6">Enter your 6-digit PIN to log in</p>

        <div className="mb-6">
          <PinInput
            value={pin}
            onChange={(v) => { setPin(v); setError(''); }}
            onSubmit={handleLogin}
          />
        </div>

        {error && <p className="text-sm text-danger mb-4">{error}</p>}

        <button
          onClick={handleLogin}
          disabled={pin.length !== 6 || loading}
          className="w-full py-3 bg-amber/10 text-amber rounded-xl text-sm font-medium hover:bg-amber/20 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
          {loading ? 'Logging in...' : 'Log In'}
        </button>

        <button
          onClick={() => dispatch({ type: 'SET_VIEW', payload: 'onboarding' })}
          className="flex items-center gap-1 text-sm text-muted hover:text-white transition-colors mt-6 mx-auto"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to setup
        </button>
      </div>
    </div>
  );
}
