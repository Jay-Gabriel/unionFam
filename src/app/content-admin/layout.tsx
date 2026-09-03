import { redirect } from 'next/navigation';
import { requireContentAdmin } from '@/server/auth/current-user';

export default async function ContentAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    await requireContentAdmin();
  } catch {
    // Keep the role boundary server-side. A member should not even receive
    // the editor shell or a hint about the script library API.
    redirect('/app');
  }

  return <>{children}</>;
}
