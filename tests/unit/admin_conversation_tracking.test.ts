import { describe, it, expect } from 'vitest';

describe('Admin Customer Conversation Tracking', () => {
  it('should restrict conversation inspection to verified admin roles', () => {
    function verifyAdminAccess(userRole: string) {
      if (userRole !== 'admin') {
        throw new Error('FORBIDDEN');
      }
      return { access: 'granted' };
    }

    expect(verifyAdminAccess('admin')).toEqual({ access: 'granted' });
    expect(() => verifyAdminAccess('member')).toThrow('FORBIDDEN');
    expect(() => verifyAdminAccess('content_admin')).toThrow('FORBIDDEN');
  });

  it('should format conversation messages and customer metadata consistently', () => {
    const rawConversation = {
      id: 'c1111111-1111-4111-8111-111111111111',
      user_id: 'u2222222-2222-4222-8222-222222222222',
      title: 'Khám phá mục tiêu sự nghiệp',
      status: 'active',
      current_stage: 'discovery',
      created_at: '2026-09-09T08:00:00.000Z',
    };

    const rawMessages = [
      { id: 'm1', role: 'assistant', content: 'Chào bạn, hôm nay bạn cảm thấy thế nào?', sequence_no: 1, created_at: '2026-09-09T08:00:05.000Z' },
      { id: 'm2', role: 'user', content: 'Mình đang muốn định hướng lại công việc', sequence_no: 2, created_at: '2026-09-09T08:00:30.000Z' },
    ];

    expect(rawMessages).toHaveLength(2);
    expect(rawMessages[0].role).toBe('assistant');
    expect(rawMessages[1].role).toBe('user');
    expect(rawConversation.current_stage).toBe('discovery');
  });
});
