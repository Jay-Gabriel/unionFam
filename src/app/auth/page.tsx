'use client';

import { Suspense } from 'react';
import { LeafLoader } from '@/components/calm/leaf-loader';
import { AuthForm } from '@/components/auth/auth-form';

export default function AuthPage() {
  return (
    <div className="legacy-calm-page fixed inset-0 overflow-y-auto flex items-center justify-center bg-calm-deep-moss p-4">
      <Suspense fallback={<LeafLoader variant="bloom" size="md" />}>
        <AuthForm />
      </Suspense>
    </div>
  );
}
