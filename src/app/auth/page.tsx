'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { AuthForm } from '@/components/auth/auth-form';

export default function AuthPage() {
  return (
    <div className="legacy-calm-page fixed inset-0 overflow-y-auto flex items-center justify-center bg-calm-deep-moss p-4">
      <Suspense fallback={<Loader2 className="animate-spin text-calm-lichen" size={32} />}>
        <AuthForm />
      </Suspense>
    </div>
  );
}
