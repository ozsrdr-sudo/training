import { ReactNode } from 'react';

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`bg-bg-primary border border-border-tertiary rounded-md p-3 mb-2.5 ${className}`}
      style={{ borderWidth: '0.5px' }}
    >
      {children}
    </div>
  );
}
