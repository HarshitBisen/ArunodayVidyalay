import React from 'react';
import { LoaderCircle } from 'lucide-react';

export default function Loader({ message = 'Loading', compact = false, className = '' }) {
  const wrapperClassName = compact
    ? 'flex items-center justify-center py-10'
    : 'min-h-[240px] flex items-center justify-center';

  return (
    <div className={`${wrapperClassName} ${className}`.trim()} role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-3 rounded-3xl border border-sunny-border bg-white/90 px-8 py-6 shadow-sm">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-sunny-cream/80">
          <LoaderCircle className="h-7 w-7 animate-spin text-sunny-navy" />
        </div>
        <p className="font-outfit text-sm font-medium text-gray-600">{message}...</p>
      </div>
    </div>
  );
}