import React from 'react';

interface CalmButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'neutral' | 'ghost';
  href?: string;
}

export function CalmButton({
  variant = 'primary',
  className = '',
  href,
  children,
  onClick,
  ...props
}: CalmButtonProps) {
  const baseStyle =
    'inline-flex items-center justify-center px-6 py-3 rounded-full text-sm font-semibold transition-all duration-300 calm-card-hover focus:outline-none cursor-pointer';

  let variantStyle = '';
  switch (variant) {
    case 'primary':
      variantStyle =
        'bg-calm-deep-moss text-calm-paper-white hover:bg-calm-moss border border-calm-lichen/30 shadow-soft';
      break;
    case 'secondary':
      variantStyle =
        'bg-calm-warm-ivory text-calm-forest-dusk hover:bg-calm-paper-white border border-calm-fog shadow-soft';
      break;
    case 'neutral':
      variantStyle =
        'bg-calm-forest-dusk text-calm-paper-white hover:bg-calm-moss border border-calm-lichen/20';
      break;
    case 'ghost':
      variantStyle =
        'bg-transparent text-calm-fog hover:bg-white/10 border border-transparent';
      break;
  }

  const combinedClass = `${baseStyle} ${variantStyle} ${className}`.trim();

  if (href) {
    return (
      <a
        href={href}
        className={combinedClass}
        onClick={(e) => {
          if (onClick) {
            e.preventDefault();
            onClick(e as any);
          }
        }}
      >
        {children}
      </a>
    );
  }

  return (
    <button className={combinedClass} onClick={onClick} {...props}>
      {children}
    </button>
  );
}
