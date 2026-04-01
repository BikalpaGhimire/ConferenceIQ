import { AlertTriangle, X } from 'lucide-react';

export function ErrorBanner({ message, onDismiss }) {
  if (!message) return null;

  return (
    <div className="mx-4 mt-4 p-4 bg-danger/10 border border-danger/30 rounded-xl flex items-start gap-3 animate-fade-in">
      <AlertTriangle className="w-5 h-5 text-danger shrink-0 mt-0.5" />
      <p className="text-sm text-danger flex-1">{message}</p>
      {onDismiss && (
        <button onClick={onDismiss} className="text-danger/60 hover:text-danger">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
