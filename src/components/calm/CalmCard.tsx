import React from 'react';

interface CalmCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'ivory' | 'paper' | 'glass' | 'sanctuary';
}

export function CalmCard({
  children,
  className = '',
  variant = 'sanctuary',
  ...props
}: CalmCardProps) {
  let bgClass = '';
  switch (variant) {
    case 'sanctuary':
      bgClass = 'sanctuary-card text-calm-paper-white p-6';
      break;
    case 'ivory':
      bgClass =
        'bg-calm-warm-ivory text-calm-forest-dusk border border-calm-fog rounded-3xl p-6 shadow-soft';
      break;
    case 'paper':
      bgClass =
        'bg-calm-paper-white text-calm-ink border border-calm-fog rounded-3xl p-6 shadow-soft';
      break;
    case 'glass':
      bgClass =
        'glass-panel text-calm-paper-white rounded-3xl p-6 backdrop-blur-md';
      break;
  }

  return (
    <div className={`calm-card-hover ${bgClass} ${className}`.trim()} {...props}>
      {children}
    </div>
  );
}
