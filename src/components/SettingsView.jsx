import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { getStoredApiKey, setCustomApiKey } from '../services/api';
import { ArrowLeft, Key, Eye, EyeOff, Check, Trash2, Heart, ExternalLink } from 'lucide-react';

const DONATION_URL = 'https://donate.stripe.com/YOUR_STRIPE_LINK';

export function SettingsView() {
  const { dispatch } = useApp();
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const [hasKey, setHasKey] = useState(false);

  useEffect(() => {
    const stored = getStoredApiKey();
    if (stored) {
      setApiKey(stored);
      setHasKey(true);
    }
  }, []);

  const handleSave = () => {
    const trimmed = apiKey.trim();
    if (trimmed && !trimmed.startsWith('sk-ant-')) {
      return;
    }
    setCustomApiKey(trimmed);
    setHasKey(!!trimmed);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClear = () => {
    setApiKey('');
    setCustomApiKey('');
    setHasKey(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const maskedKey = apiKey
    ? `${apiKey.slice(0, 10)}${'*'.repeat(Math.max(0, apiKey.length - 14))}${apiKey.slice(-4)}`
    : '';

  return (
    <div className="px-4 pt-4 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => dispatch({ type: 'SET_VIEW', payload: 'my-profile' })}
          className="flex items-center gap-1 text-muted hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">Back</span>
        </button>
        <h2 className="font-serif text-lg text-white">Settings</h2>
        <div className="w-12" />
      </div>

      {/* BYOK Section */}
      <div className="bg-card rounded-xl p-5 animate-fade-in">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber/10 flex items-center justify-center">
            <Key className="w-5 h-5 text-amber" />
          </div>
          <div>
            <h3 className="text-white text-sm font-medium">Your API Key</h3>
            <p className="text-muted text-xs">Use your own Anthropic key for unlimited lookups</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-ant-api03-..."
              className="w-full bg-navy border border-border rounded-lg px-3 py-2.5 pr-10 text-sm text-white placeholder-muted outline-none focus:border-amber/50 font-mono"
            />
            <button
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-white transition-colors"
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {hasKey && !showKey && (
            <p className="text-xs text-teal/70 font-mono">{maskedKey}</p>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={!apiKey.trim()}
              className="flex-1 py-2.5 bg-amber/10 text-amber rounded-lg text-sm font-medium hover:bg-amber/20 transition-colors flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saved ? <Check className="w-4 h-4" /> : <Key className="w-4 h-4" />}
              {saved ? 'Saved!' : 'Save Key'}
            </button>
            {hasKey && (
              <button
                onClick={handleClear}
                className="px-4 py-2.5 bg-danger/10 text-danger rounded-lg text-sm hover:bg-danger/20 transition-colors"
                title="Remove API key"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="mt-2 p-3 bg-navy rounded-lg border border-border">
            <p className="text-xs text-muted leading-relaxed">
              Your key is stored locally in your browser and sent only to our server to proxy API calls.
              It is never logged or stored server-side.
            </p>
            <a
              href="https://console.anthropic.com/settings/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-amber hover:underline mt-2"
            >
              Get an API key from Anthropic
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      {/* Donation Section */}
      <div className="mt-4 bg-card rounded-xl p-5 animate-fade-in">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center">
            <Heart className="w-5 h-5 text-pink-400" />
          </div>
          <div>
            <h3 className="text-white text-sm font-medium">Support ConferenceIQ</h3>
            <p className="text-muted text-xs">Help keep this tool free for researchers</p>
          </div>
        </div>

        <p className="text-sm text-gray-300 leading-relaxed mb-4">
          ConferenceIQ is built to help academics network smarter. Each profile lookup costs
          real money in AI processing. Your support helps cover API costs and keeps the tool
          free for everyone.
        </p>

        <div className="grid grid-cols-3 gap-2 mb-3">
          {[
            { amount: '$5', label: '~50 lookups' },
            { amount: '$10', label: '~100 lookups' },
            { amount: '$25', label: '~250 lookups' },
          ].map(({ amount, label }) => (
            <a
              key={amount}
              href={`${DONATION_URL}?amount=${amount.replace('$', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center py-3 bg-navy border border-border rounded-lg hover:border-pink-400/30 hover:bg-pink-500/5 transition-colors"
            >
              <span className="text-white font-medium text-sm">{amount}</span>
              <span className="text-muted text-[10px] mt-0.5">{label}</span>
            </a>
          ))}
        </div>

        <a
          href={DONATION_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-2.5 bg-pink-500/10 text-pink-400 rounded-lg text-sm font-medium hover:bg-pink-500/20 transition-colors flex items-center justify-center gap-2"
        >
          <Heart className="w-4 h-4" />
          Custom Amount
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* About */}
      <div className="mt-4 bg-card rounded-xl p-5 animate-fade-in">
        <h3 className="text-white text-sm font-medium mb-2">About</h3>
        <p className="text-xs text-muted leading-relaxed">
          ConferenceIQ turns a name into an actionable networking brief. Built for academics,
          by academics. Powered by Claude AI with real-time web search.
        </p>
        <p className="text-[10px] text-muted/50 mt-3">
          v1.0.0
        </p>
      </div>
    </div>
  );
}
