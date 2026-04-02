import { Heart } from 'lucide-react';

const DONATION_URL = 'https://donate.stripe.com/YOUR_STRIPE_LINK';

export function FloatingDonate() {
  return (
    <a
      href={DONATION_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-20 right-4 z-40 flex items-center gap-1.5 px-3 py-2 bg-pink-500/90 text-white text-xs font-medium rounded-full shadow-lg shadow-pink-500/30 hover:bg-pink-500 transition-all hover:scale-105 active:scale-95 backdrop-blur-sm"
      title="Support ConferenceIQ"
    >
      <Heart className="w-3.5 h-3.5" fill="currentColor" />
      <span>Donate</span>
    </a>
  );
}
