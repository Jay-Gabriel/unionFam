import React from 'react';
import Link from 'next/link';

interface CalmButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'neutral' | 'ghost';
  href?: string;
}

export function CalmButton({ variant = 'primary', className = '', href, children, ...props }: CalmButtonProps) {
  const baseStyle = "inline-flex items-center justify-center px-6 py-3 rounded-full text-sm font-semibold transition-all duration-300 calm-card-hover focus:outline-none focus:ring-2 focus:ring-calm-moss/30";
  
  let variantStyle = "";
  switch (variant) {
    case 'primary':
      variantStyle = "bg-calm-moss text-white hover:bg-calm-deep-moss shadow-soft";
      break;
    case 'secondary':
      variantStyle = "bg-calm-warm-ivory text-calm-ink border border-calm-moss/10 hover:bg-white";
      break;
    case 'neutral':
      variantStyle = "bg-calm-fog text-calm-ink hover:bg-calm-fog/80";
      break;
    case 'ghost':
      variantStyle = "bg-transparent text-calm-ink hover:bg-calm-moss/5";
      break;
  }

  const combinedStyle = `${baseStyle} ${variantStyle} ${className}`;

  if (href) {
    return (
      <Link href={href} className={combinedStyle}>
        {children}
      </Link>
    );
  }

  return (
    <button className={combinedStyle} {...props}>
      {children}
    </button>
  );
}
