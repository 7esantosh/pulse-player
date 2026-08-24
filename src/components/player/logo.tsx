export function PulseLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true" fill="none">
      <circle cx="16" cy="16" r="12" stroke="currentColor" strokeWidth="1.6" className="text-accent" />
      <polygon points="13,10.5 13,21.5 23,16" className="fill-fg" />
    </svg>
  );
}
