import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/server/auth/current-user';

export const dynamic = 'force-dynamic';

/**
 * The navigation entry point resumes the user's latest active conversation.
 * `/app/conversations/new` remains the explicit action for starting a new one.
 */
export default async function ConversationsEntryPage() {
  let user;
  try {
    user = await requireUser();
  } catch (error) {
    if (error instanceof Error && error.message === 'AUTH_REQUIRED') redirect('/auth');
    throw error;
  }

  const supabase = createClient();
  const { data: conversations, error } = await supabase
    .from('conversations')
    .select('id, status, last_message_at, updated_at')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .order('last_message_at', { ascending: false })
    .order('updated_at', { ascending: false })
    .limit(50);

  if (error) throw error;

  const latestConversation =
    conversations?.find((conversation) => conversation.status === 'active') || conversations?.[0];

  redirect(latestConversation ? `/app/conversations/${latestConversation.id}` : '/app/conversations/new');
}
