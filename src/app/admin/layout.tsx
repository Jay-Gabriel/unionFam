import { requireAdmin } from '@/server/auth/current-user';
import { redirect } from 'next/navigation';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    await requireAdmin();
  } catch (err) {
    redirect('/app');
  }

  return <>{children}</>;
}
