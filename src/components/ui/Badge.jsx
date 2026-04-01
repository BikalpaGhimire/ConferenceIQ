export function Badge({ children, variant = 'default', onClick }) {
  const variants = {
    default: 'bg-card text-muted border-border',
    amber: 'bg-amber/10 text-amber border-amber/30',
    teal: 'bg-teal/10 text-teal border-teal/30',
  };

  return (
    <span
      onClick={onClick}
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${variants[variant]} ${onClick ? 'cursor-pointer hover:opacity-80' : ''}`}
    >
      {children}
    </span>
  );
}
