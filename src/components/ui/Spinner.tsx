export function Spinner({ className = '' }: { className?: string }) {
  return (
    <div
      className={`w-5 h-5 rounded-full border-2 border-[var(--color-lw-border)] border-t-[var(--color-lw-purple-400)] animate-spin ${className}`}
    />
  );
}

export function PageSpinner() {
  return (
    <div className="flex items-center justify-center py-24">
      <Spinner />
    </div>
  );
}
