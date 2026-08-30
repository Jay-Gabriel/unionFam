import React from 'react';

interface CalmCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'ivory' | 'paper' | 'glass';
}

export function CalmCard({ children, className = '', variant = 'ivory', ...props }: CalmCardProps) {
  let bgClass = "";
  switch (variant) {
    case 'ivory':
      bgClass = "bg-calm-warm-ivory border border-calm-moss/10";
      break;
    case 'paper':
      bgClass = "bg-calm-paper-white border border-calm-moss/5";
      break;
    case 'glass':
      bgClass = "glass-panel";
      break;
  }

  return (
    <div 
      className={`rounded-3xl ${bgClass} shadow-soft calm-card-hover p-6 md:p-8 ${className}`} 
      {...props}
    >
      {children}
    </div>
  );
}
