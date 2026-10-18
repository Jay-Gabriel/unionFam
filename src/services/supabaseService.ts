import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { User } from '@supabase/supabase-js';

export interface SyncedMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
}

export interface SyncedMemory {
  id: string;
  category: 'core_value' | 'boundary' | 'insight';
  title: string;
  reflection: string;
  kintsugiRepaired?: boolean;
  repairedNote?: string;
  date: string;
}

const LOCAL_CONVERSATION_KEY = 'unionfam_conversation_id';
const LOCAL_MESSAGES_KEY = 'unionfam_messages_cache';
const LOCAL_MEMORIES_KEY = 'unionfam_memories_cache';

/**
 * Lấy thông tin user hiện tại (nếu đã đăng nhập Google)
 */
export async function getCurrentUser(): Promise<User | null> {
  if (!supabase) return null;
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;
    return user;
  } catch {
    return null;
  }
}

/**
 * Đăng ký lắng nghe thay đổi trạng thái đăng nhập
 */
export function onAuthStateChange(callback: (user: User | null) => void) {
  if (!supabase) {
    callback(null);
    return () => {};
  }

  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null);
  });

  return () => {
    subscription.unsubscribe();
  };
}

/**
 * Lưu cuộc hội thoại vào Supabase (hoặc LocalStorage nếu khách chưa đăng nhập / offline)
 */
export async function saveConversationToCloud(
  conversationId: string,
  messages: SyncedMessage[],
  outcome?: { type: string; text?: string }
): Promise<boolean> {
  // 1. Luôn lưu bản sao vào localStorage để bảo toàn dữ liệu
  try {
    localStorage.setItem(LOCAL_CONVERSATION_KEY, conversationId);
    localStorage.setItem(LOCAL_MESSAGES_KEY, JSON.stringify(messages));
  } catch (e) {
    console.warn('LocalStorage save failed:', e);
  }

  // 2. Nếu chưa cấu hình hoặc chưa đăng nhập, kết thúc tại đây
  if (!supabase) return true;
  const user = await getCurrentUser();
  if (!user) return true;

  try {
    // 3. Upsert conversation
    await supabase.from('conversations').upsert({
      id: conversationId,
      user_id: user.id,
      outcome_type: outcome?.type || null,
      outcome_text: outcome?.text || null,
      updated_at: new Date().toISOString(),
    });

    // 4. Upsert messages
    if (messages.length > 0) {
      const records = messages.map(m => ({
        id: m.id,
        conversation_id: conversationId,
        user_id: user.id,
        sender: m.sender,
        text: m.text,
        timestamp: m.timestamp,
      }));
      await supabase.from('messages').upsert(records, { onConflict: 'id' });
    }

    return true;
  } catch (err) {
    console.warn('Supabase cloud sync skipped (fallback to local):', err);
    return false;
  }
}

/**
 * Tải hội thoại gần nhất của người dùng
 */
export async function loadConversationFromCloud(): Promise<{
  conversationId: string;
  messages: SyncedMessage[];
} | null> {
  // Thử tải từ Supabase nếu có user
  if (supabase) {
    try {
      const user = await getCurrentUser();
      if (user) {
        const { data: convData } = await supabase
          .from('conversations')
          .select('id')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false })
          .limit(1)
          .single();

        if (convData?.id) {
          const { data: msgData } = await supabase
            .from('messages')
            .select('id, sender, text, timestamp')
            .eq('conversation_id', convData.id)
            .order('created_at', { ascending: true });

          if (msgData && msgData.length > 0) {
            return {
              conversationId: convData.id,
              messages: msgData as SyncedMessage[],
            };
          }
        }
      }
    } catch (err) {
      console.warn('Cloud conversation load skipped, reading local cache:', err);
    }
  }

  // Fallback đọc từ LocalStorage
  try {
    const localId = localStorage.getItem(LOCAL_CONVERSATION_KEY) || Date.now().toString();
    const rawMessages = localStorage.getItem(LOCAL_MESSAGES_KEY);
    if (rawMessages) {
      const parsed = JSON.parse(rawMessages);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return { conversationId: localId, messages: parsed };
      }
    }
  } catch {}

  return null;
}

/**
 * Lưu một Đúc kết (Memory/Insight) vào Supabase & LocalStorage
 */
export async function saveMemoryToCloud(memory: SyncedMemory): Promise<boolean> {
  // Cập nhật LocalStorage
  try {
    const raw = localStorage.getItem(LOCAL_MEMORIES_KEY);
    const list: SyncedMemory[] = raw ? JSON.parse(raw) : [];
    const index = list.findIndex(m => m.id === memory.id);
    if (index >= 0) {
      list[index] = memory;
    } else {
      list.unshift(memory);
    }
    localStorage.setItem(LOCAL_MEMORIES_KEY, JSON.stringify(list));
  } catch {}

  if (!supabase) return true;
  const user = await getCurrentUser();
  if (!user) return true;

  try {
    await supabase.from('user_memories').upsert({
      id: memory.id,
      user_id: user.id,
      category: memory.category,
      title: memory.title,
      reflection: memory.reflection,
      kintsugi_repaired: memory.kintsugiRepaired || false,
      repaired_note: memory.repairedNote || null,
      date_text: memory.date,
      updated_at: new Date().toISOString(),
    });
    return true;
  } catch (err) {
    console.warn('Memory cloud sync skipped:', err);
    return false;
  }
}

/**
 * Tải danh sách Đúc kết (Memories) của user
 */
export async function loadMemoriesFromCloud(): Promise<SyncedMemory[]> {
  if (supabase) {
    try {
      const user = await getCurrentUser();
      if (user) {
        const { data, error } = await supabase
          .from('user_memories')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          return data.map(item => ({
            id: item.id,
            category: item.category,
            title: item.title,
            reflection: item.reflection,
            kintsugiRepaired: item.kintsugi_repaired,
            repairedNote: item.repaired_note,
            date: item.date_text || 'Gần đây',
          }));
        }
      }
    } catch (err) {
      console.warn('Cloud memories load skipped, reading local cache:', err);
    }
  }

  // Fallback đọc LocalStorage
  try {
    const raw = localStorage.getItem(LOCAL_MEMORIES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}

  return [];
}
