'use client';

export function SearchBar() {
  return (
    <div className="flex items-center gap-2 mb-3 text-xs text-fg-secondary">
      <input
        type="text"
        disabled
        placeholder="Arama yakında (v1.1) — şimdilik preset dropdown kullan"
        className="flex-1 px-3 py-1.5 rounded-md border border-border-tertiary bg-bg-secondary text-fg-tertiary placeholder:text-fg-tertiary cursor-not-allowed"
        style={{ borderWidth: '0.5px' }}
      />
    </div>
  );
}
