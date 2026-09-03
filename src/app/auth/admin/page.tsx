'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { AuthForm } from '@/components/auth/auth-form';

export default function AdminAuthPage() {
  return (
    <div className="legacy-calm-page flex min-h-screen items-center justify-center bg-calm-deep-moss p-4">
      <Suspense fallback={<Loader2 className="animate-spin text-calm-lichen" size={32} />}>
        <AuthForm mode="admin" />
      </Suspense>
    </div>
  );
}
