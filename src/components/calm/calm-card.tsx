import React from 'react';

interface CalmCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'ivory' | 'paper' | 'glass' | 'sanctuary';
}

export function CalmCard({ children, className = '', variant = 'sanctuary', ...props }: CalmCardProps) {
  let bgClass = "";
  switch (variant) {
    case 'sanctuary':
      bgClass = "sanctuary-card text-calm-paper-white";
      break;
    case 'ivory':
      bgClass = "bg-calm-warm-ivory text-calm-forest-dusk border border-calm-moss/10 shadow-soft";
      break;
    case 'paper':
      bgClass = "bg-calm-paper-white text-calm-forest-dusk border border-calm-moss/5 shadow-soft";
      break;
    case 'glass':
      bgClass = "glass-panel text-calm-paper-white";
      break;
  }

  return (
    <div 
      className={`rounded-[26px] ${bgClass} calm-card-hover p-6 md:p-8 ${className}`} 
      {...props}
    >
      {children}
    </div>
  );
}
