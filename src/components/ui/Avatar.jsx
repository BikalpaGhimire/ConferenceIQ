import { useState } from 'react';
import { initials } from '../../utils/formatters';

export function Avatar({ name, photoUrl, size = 'md' }) {
  const [imgFailed, setImgFailed] = useState(false);

  const sizes = {
    sm: 'w-10 h-10 text-sm',
    md: 'w-16 h-16 text-lg',
    lg: 'w-20 h-20 text-xl',
  };

  if (photoUrl && !imgFailed) {
    return (
      <img
        src={photoUrl}
        alt={name}
        className={`${sizes[size]} rounded-full object-cover border-2 border-border shrink-0`}
        onError={() => setImgFailed(true)}
      />
    );
  }

  return (
    <div
      className={`${sizes[size]} rounded-full bg-amber/20 text-amber font-semibold flex items-center justify-center border-2 border-amber/30 shrink-0`}
    >
      {initials(name)}
    </div>
  );
}
