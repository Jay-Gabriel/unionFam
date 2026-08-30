import React from 'react';
import Link from 'next/link';

interface GlassPillNavProps {
  items: { label: string; href: string }[];
  cta?: { label: string; href: string };
}

export function GlassPillNav({ items, cta }: GlassPillNavProps) {
  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50">
      <nav className="glass-panel rounded-full px-2 py-2 flex items-center gap-1 shadow-soft">
        <Link href="/" className="w-8 h-8 rounded-full bg-calm-moss flex items-center justify-center text-white font-bold ml-1 mr-4">
          L
        </Link>
        <div className="hidden md:flex items-center gap-1 pr-4 border-r border-calm-moss/10">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="px-4 py-2 rounded-full text-sm font-medium text-calm-ink/80 hover:text-calm-ink hover:bg-calm-moss/5 transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </div>
        {cta && (
          <div className="pl-4 pr-1">
            <Link
              href={cta.href}
              className="px-5 py-2 rounded-full bg-calm-warm-ivory text-sm font-bold text-calm-ink hover:bg-white border border-calm-moss/10 transition-colors whitespace-nowrap"
            >
              {cta.label}
            </Link>
          </div>
        )}
      </nav>
    </div>
  );
}
