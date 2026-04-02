import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { getStoredApiKey, setCustomApiKey, getProvider, setProvider } from '../services/api';
import { ArrowLeft, Key, Eye, EyeOff, Check, Trash2, Heart, ExternalLink, Zap, Cpu } from 'lucide-react';

const DONATION_URL = 'https://donate.stripe.com/YOUR_STRIPE_LINK';

const PROVIDERS = [
  {
    id: 'gemini',
    name: 'Gemini Flash',
    icon: Zap,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderActive: 'border-blue-400',
    description: 'Default — fast & cheap (~10x lower cost)',
    placeholder: 'AIzaSy...',
    keyPrefix: 'AIza',
    keyUrl: 'https://aistudio.google.com/apikey',
    keyLabel: 'Get a Gemini API key from Google AI Studio',
  },
  {
    id: 'claude',
    name: 'Claude Haiku',
    icon: Cpu,
    color: 'text-amber',
    bgColor: 'bg-amber/10',
    borderActive: 'border-amber',
    description: 'Higher quality, higher cost',
    placeholder: 'sk-ant-api03-...',
    keyPrefix: 'sk-ant-',
    keyUrl: 'https://console.anthropic.com/settings/keys',
    keyLabel: 'Get an API key from Anthropic',
  },
];

export function SettingsView() {
  const { dispatch } = useApp();
  const [activeProvider, setActiveProvider] = useState(getProvider());
  const [apiKeys, setApiKeys] = useState({ gemini: '', claude: '' });
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setApiKeys({
      gemini: getStoredApiKey('gemini'),
      claude: getStoredApiKey('claude'),
    });
  }, []);

  const currentProviderConfig = PROVIDERS.find((p) => p.id === activeProvider);
  const currentKey = apiKeys[activeProvider];

  const handleProviderChange = (id) => {
    setActiveProvider(id);
    setProvider(id);
    setShowKey(false);
  };

  const handleSaveKey = () => {
    const trimmed = currentKey.trim();
    setCustomApiKey(trimmed, activeProvider);
    setApiKeys({ ...apiKeys, [activeProvider]: trimmed });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClearKey = () => {
    setCustomApiKey('', activeProvider);
    setApiKeys({ ...apiKeys, [activeProvider]: '' });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const maskedKey = currentKey
    ? `${currentKey.slice(0, 8)}${'*'.repeat(Math.max(0, currentKey.length - 12))}${currentKey.slice(-4)}`
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

      {/* Provider Selection */}
      <div className="bg-card rounded-xl p-5 animate-fade-in">
        <h3 className="text-xs text-muted uppercase tracking-wider font-medium mb-3">AI Provider</h3>
        <div className="grid grid-cols-2 gap-2">
          {PROVIDERS.map((provider) => {
            const Icon = provider.icon;
            const isActive = activeProvider === provider.id;
            const hasKey = !!apiKeys[provider.id];
            return (
              <button
                key={provider.id}
                onClick={() => handleProviderChange(provider.id)}
                className={`relative flex flex-col items-center p-4 rounded-xl border-2 transition-all ${
                  isActive
                    ? `${provider.borderActive} ${provider.bgColor}`
                    : 'border-border hover:border-muted/50'
                }`}
              >
                <Icon className={`w-6 h-6 mb-2 ${isActive ? provider.color : 'text-muted'}`} />
                <span className={`text-sm font-medium ${isActive ? 'text-white' : 'text-muted'}`}>
                  {provider.name}
                </span>
                <span className="text-[10px] text-muted mt-1 text-center leading-tight">
                  {provider.description}
                </span>
                {hasKey && (
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-teal" title="Key set" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* API Key Section */}
      <div className="mt-4 bg-card rounded-xl p-5 animate-fade-in">
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-10 h-10 rounded-xl ${currentProviderConfig.bgColor} flex items-center justify-center`}>
            <Key className={`w-5 h-5 ${currentProviderConfig.color}`} />
          </div>
          <div>
            <h3 className="text-white text-sm font-medium">{currentProviderConfig.name} API Key</h3>
            <p className="text-muted text-xs">
              {currentKey ? 'Key saved — using your own key' : 'Optional — uses shared key by default'}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={currentKey}
              onChange={(e) => setApiKeys({ ...apiKeys, [activeProvider]: e.target.value })}
              placeholder={currentProviderConfig.placeholder}
              className="w-full bg-navy border border-border rounded-lg px-3 py-2.5 pr-10 text-sm text-white placeholder-muted outline-none focus:border-amber/50 font-mono"
            />
            <button
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-white transition-colors"
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {currentKey && !showKey && (
            <p className="text-xs text-teal/70 font-mono">{maskedKey}</p>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleSaveKey}
              disabled={!currentKey.trim()}
              className="flex-1 py-2.5 bg-amber/10 text-amber rounded-lg text-sm font-medium hover:bg-amber/20 transition-colors flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saved ? <Check className="w-4 h-4" /> : <Key className="w-4 h-4" />}
              {saved ? 'Saved!' : 'Save Key'}
            </button>
            {currentKey && (
              <button
                onClick={handleClearKey}
                className="px-4 py-2.5 bg-danger/10 text-danger rounded-lg text-sm hover:bg-danger/20 transition-colors"
                title="Remove API key"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="p-3 bg-navy rounded-lg border border-border">
            <p className="text-xs text-muted leading-relaxed">
              Your key is stored locally in your browser and sent only to our server to proxy API calls.
              It is never logged or stored server-side.
            </p>
            <a
              href={currentProviderConfig.keyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-1 text-xs ${currentProviderConfig.color} hover:underline mt-2`}
            >
              {currentProviderConfig.keyLabel}
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
            { amount: '$5', label: '~250 lookups' },
            { amount: '$10', label: '~500 lookups' },
            { amount: '$25', label: '~1,250 lookups' },
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
          by academics. Powered by AI with real-time web search.
        </p>
        <p className="text-[10px] text-muted/50 mt-3">
          v1.1.0 · Using {activeProvider === 'gemini' ? 'Gemini Flash' : 'Claude Haiku'}
        </p>
      </div>
    </div>
  );
}
