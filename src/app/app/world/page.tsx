import React from 'react';
import type { Metadata } from 'next';
import { CityWorldView } from '@/components/world/city-world-view';

export const metadata: Metadata = {
  title: 'Thành Phố Mây 3D | UnionFam Life Lab',
  description: 'Thành phố 3D kết nối hành trình Life Lab, nhiệm vụ ngoài đời và không gian khám phá.',
};

export const dynamic = 'force-dynamic';

export default function CityWorldPage() {
  return (
    <main className="fixed inset-0 top-0 left-0 right-0 bottom-0 z-40 bg-slate-950 overflow-hidden">
      <CityWorldView />
    </main>
  );
}
