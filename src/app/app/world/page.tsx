import React from 'react';
import type { Metadata } from 'next';
import { PlanetWorldView } from '@/components/world/planet-world-view';

export const metadata: Metadata = {
  title: 'Hành Tinh Tâm Trí 3D | UnionFam Life Lab',
  description: 'Thế giới 3D kết nối tâm hồn, khám phá bản đồ cuộc đời và trò chuyện cùng AI.',
};

export const dynamic = 'force-dynamic';

export default function PlanetWorldPage() {
  return (
    <main className="fixed inset-0 top-0 left-0 right-0 bottom-0 z-40 bg-slate-950 overflow-hidden">
      <PlanetWorldView />
    </main>
  );
}
