import { useState, useEffect, useRef } from 'react';
import { Download, X, Smartphone, Share } from 'lucide-react';

export function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [showFull, setShowFull] = useState(true);
  const dismissTimerRef = useRef(null);

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches || navigator.standalone) {
      setIsInstalled(true);
      return;
    }

    const lastDismissed = localStorage.getItem('conferenceiq_installDismissed');
    if (lastDismissed) {
      const elapsed = Date.now() - parseInt(lastDismissed, 10);
      if (elapsed < 60 * 60 * 1000) {
        setDismissed(true);
        setShowFull(false);
      }
    }

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const installedHandler = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', installedHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installedHandler);
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') setIsInstalled(true);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowFull(false);
    setDismissed(true);
    localStorage.setItem('conferenceiq_installDismissed', Date.now().toString());
    dismissTimerRef.current = setTimeout(() => setDismissed(false), 30000);
  };

  if (isInstalled) return null;

  // Mini pill after dismiss
  if (!showFull && dismissed) return null;

  if (!showFull) {
    return (
      <button
        onClick={() => setShowFull(true)}
        className="fixed top-3 right-3 z-50 flex items-center gap-1.5 px-3 py-1.5 bg-teal/90 text-white text-xs font-medium rounded-full shadow-lg shadow-teal/20 hover:bg-teal transition-all animate-fade-in"
      >
        <Download className="w-3 h-3" />
        Install App
      </button>
    );
  }

  // Full banner — works for both native prompt and iOS/Safari fallback
  return (
    <div className="bg-gradient-to-r from-teal/15 to-blue-500/15 border-b border-teal/20 animate-fade-in">
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-teal/20 flex items-center justify-center shrink-0">
          <Smartphone className="w-5 h-5 text-teal" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-white font-medium">Install ConferenceIQ</p>
          {isIOS || isSafari ? (
            <p className="text-xs text-muted">
              Tap <Share className="w-3 h-3 inline -mt-0.5" /> then "Add to Home Screen"
            </p>
          ) : deferredPrompt ? (
            <p className="text-xs text-muted">Add to home screen for quick access</p>
          ) : (
            <p className="text-xs text-muted">Use your browser menu → "Install app" or "Add to Home Screen"</p>
          )}
        </div>
        {deferredPrompt && (
          <button
            onClick={handleInstall}
            className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 bg-teal text-navy text-xs font-bold rounded-lg hover:bg-teal/90 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Install
          </button>
        )}
        <button
          onClick={handleDismiss}
          className="shrink-0 text-muted hover:text-white transition-colors p-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
