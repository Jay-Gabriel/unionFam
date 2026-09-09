'use client';

import { useEffect, useState, type FormEvent } from 'react';
import {
  Activity,
  Bot,
  Calendar,
  Check,
  ChevronRight,
  Clock,
  Copy,
  FileText,
  Filter,
  Layers,
  Loader2,
  Lock,
  MessageSquare,
  RefreshCw,
  Search,
  ShieldAlert,
  Sparkles,
  User,
  Users,
  X,
} from 'lucide-react';
import { LeafLoader } from '@/components/calm/leaf-loader';
import {
  labelAuditAction,
  labelRole,
  labelStage,
  labelStatus,
  labelResourceType,
} from '@/lib/i18n';

type AdminOverview = {
  users: Array<{
    id: string;
    email: string;
    role: string;
    joinedAt: string;
    displayName: string;
    onboardingStatus: string;
    answersCount: number;
  }>;
  sessions: Array<{
    id: string;
    user_id: string;
    title: string;
    status: string;
    current_stage: string;
    last_message_at: string;
    created_at?: string;
    user_display_name?: string;
    user_email?: string;
  }>;
  errors: Array<{
    id: string;
    error_code: string;
    route: string;
    request_id: string;
    created_at: string;
  }>;
  auditLogs: Array<{
    id: string;
    admin_id: string;
    resource_type: string;
    action: string;
    reason: string;
    created_at: string;
  }>;
  pagination: { page: number; perPage: number; total: number };
};

type Tab = 'users' | 'sessions' | 'errors' | 'audit';

type UserDetail = {
  user: {
    id: string;
    email: string;
    createdAt: string;
    lastSignInAt: string | null;
  };
  profile: {
    display_name: string;
    onboarding_status: string;
    consented_at: string | null;
    locale: string;
    timezone: string;
  } | null;
  answers: Array<{
    id: string;
    questionKey: string;
    questionTitle: string;
    answer: unknown;
    answeredAt: string;
  }>;
  conversations: Array<{
    id: string;
    title: string;
    status: string;
    current_stage: string;
    last_message_at: string;
  }>;
};

type ConversationDetail = {
  conversation: {
    id: string;
    user_id: string;
    title: string;
    status: string;
    current_stage: string;
    prompt_version: string;
    question_flow_version_id: string | null;
    last_message_at: string | null;
    created_at: string;
    updated_at: string;
  };
  user: {
    id: string;
    email: string;
    displayName: string;
    onboardingStatus: string;
    createdAt: string | null;
  };
  messages: Array<{
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    status: string;
    sequence_no: number;
    created_at: string;
  }>;
  observations: Array<{
    id: string;
    assistant_message_id: string | null;
    dimension: string;
    content_original: string;
    content_user_edited: string | null;
    status: string;
    confidence: number;
    created_at: string;
  }>;
};

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>('users');
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // User Detail modal state
  const [detailUserId, setDetailUserId] = useState('');
  const [detailReason, setDetailReason] = useState('');
  const [detail, setDetail] = useState<UserDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');

  // Role update state
  const [roleUpdating, setRoleUpdating] = useState('');
  const [roleMessage, setRoleMessage] = useState('');

  // Sessions filter state
  const [sessionSearch, setSessionSearch] = useState('');
  const [sessionStageFilter, setSessionStageFilter] = useState('all');

  // Conversation Viewer modal state
  const [viewingConvId, setViewingConvId] = useState<string | null>(null);
  const [convDetail, setConvDetail] = useState<ConversationDetail | null>(null);
  const [convLoading, setConvLoading] = useState(false);
  const [convError, setConvError] = useState('');
  const [copiedTranscript, setCopiedTranscript] = useState(false);
  const [convActiveTab, setConvActiveTab] = useState<'messages' | 'observations'>('messages');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(
        '/api/admin/overview?reason=Admin%20dashboard%20review',
        { cache: 'no-store' }
      );
      const json = await response.json();
      if (!response.ok)
        throw new Error(json.error || 'Không thể tải dữ liệu vận hành');
      setOverview(json.data);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'Không thể tải dữ liệu vận hành'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const closeDetail = () => {
    if (detailLoading) return;
    setDetailUserId('');
    setDetailReason('');
    setDetail(null);
    setDetailError('');
  };

  const openDetail = async (event: FormEvent) => {
    event.preventDefault();
    if (!detailUserId || detailReason.trim().length < 3) {
      setDetailError(
        'Hãy nhập lý do tối thiểu 3 ký tự để ghi nhật ký kiểm tra.'
      );
      return;
    }
    setDetailLoading(true);
    setDetailError('');
    try {
      const response = await fetch(
        `/api/admin/users/${detailUserId}?reason=${encodeURIComponent(
          detailReason.trim()
        )}`,
        { cache: 'no-store' }
      );
      const json = await response.json();
      if (!response.ok)
        throw new Error(json.error || 'Không thể mở chi tiết người dùng');
      setDetail(json.data);
    } catch (reason) {
      setDetailError(
        reason instanceof Error
          ? reason.message
          : 'Không thể mở chi tiết người dùng'
      );
    } finally {
      setDetailLoading(false);
    }
  };

  const openConversation = async (convId: string) => {
    setViewingConvId(convId);
    setConvDetail(null);
    setConvLoading(true);
    setConvError('');
    setCopiedTranscript(false);
    setConvActiveTab('messages');

    try {
      const response = await fetch(
        `/api/admin/conversations/${convId}?reason=Admin%20tracking%20customer%20conversation`,
        { cache: 'no-store' }
      );
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error || 'Không thể tải nội dung cuộc trò chuyện');
      }
      setConvDetail(json.data);
    } catch (err) {
      setConvError(
        err instanceof Error ? err.message : 'Không thể tải cuộc trò chuyện'
      );
    } finally {
      setConvLoading(false);
    }
  };

  const closeConversation = () => {
    setViewingConvId(null);
    setConvDetail(null);
    setConvError('');
    setCopiedTranscript(false);
  };

  const copyConversationTranscript = () => {
    if (!convDetail) return;
    const header = `=== CUỘC TRÒ CHUYỆN: ${convDetail.conversation.title} ===\n`
      + `Khách hàng: ${convDetail.user.displayName} (${convDetail.user.email})\n`
      + `Giai đoạn: ${labelStage(convDetail.conversation.current_stage)} | Trạng thái: ${labelStatus(convDetail.conversation.status)}\n`
      + `Bắt đầu: ${new Date(convDetail.conversation.created_at).toLocaleString('vi-VN')}\n`
      + `------------------------------------------------------------\n\n`;

    const body = convDetail.messages
      .map((msg) => {
        const roleLabel = msg.role === 'user' ? `[${convDetail.user.displayName}]` : '[AI LifeLab]';
        const time = new Date(msg.created_at).toLocaleTimeString('vi-VN');
        return `${roleLabel} (${time}):\n${msg.content}\n`;
      })
      .join('\n');

    void navigator.clipboard.writeText(header + body);
    setCopiedTranscript(true);
    setTimeout(() => setCopiedTranscript(false), 2500);
  };

  const updateContentRole = async (
    userId: string,
    role: 'content_admin' | 'member'
  ) => {
    const granting = role === 'content_admin';
    if (
      !window.confirm(
        granting
          ? 'Cấp quyền biên tập AI cho tài khoản này? Tài khoản sẽ có thể tải và xuất bản kịch bản, nhưng không xem dữ liệu người dùng.'
          : 'Gỡ quyền biên tập AI của tài khoản này?'
      )
    )
      return;

    setRoleUpdating(userId);
    setRoleMessage('');
    setError('');
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok)
        throw new Error(json.error || 'Không thể cập nhật quyền biên tập.');
      setRoleMessage(
        granting
          ? 'Đã cấp quyền biên tập AI. Tài khoản cần tải lại trang để thấy thư viện kịch bản.'
          : 'Đã gỡ quyền biên tập AI.'
      );
      await load();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'Không thể cập nhật quyền biên tập.'
      );
    } finally {
      setRoleUpdating('');
    }
  };

  const tabs: Array<{ id: Tab; label: string; icon: typeof Users }> = [
    { id: 'users', label: 'Người dùng', icon: Users },
    { id: 'sessions', label: 'Phiên trò chuyện', icon: Activity },
    { id: 'errors', label: 'Lỗi', icon: ShieldAlert },
    { id: 'audit', label: 'Nhật ký kiểm tra', icon: FileText },
  ];

  // Filter sessions
  const filteredSessions = (overview?.sessions || []).filter((session) => {
    const matchesSearch =
      !sessionSearch.trim() ||
      session.title.toLowerCase().includes(sessionSearch.toLowerCase()) ||
      (session.user_display_name || '').toLowerCase().includes(sessionSearch.toLowerCase()) ||
      (session.user_email || '').toLowerCase().includes(sessionSearch.toLowerCase()) ||
      session.id.toLowerCase().includes(sessionSearch.toLowerCase());

    const matchesStage =
      sessionStageFilter === 'all' || session.current_stage === sessionStageFilter;

    return matchesSearch && matchesStage;
  });

  return (
    <div className="legacy-calm-page fixed inset-0 overflow-y-auto space-y-6 bg-calm-deep-moss p-6">
      {/* Top Header Card */}
      <div className="flex flex-col justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-card lg:flex-row lg:items-center">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white">
            <Lock size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Kiểm tra & Vận hành UnionFam
            </h1>
            <p className="text-xs text-slate-500">
              Quản lý tài khoản, theo dõi phiên trò chuyện của khách hàng, giám sát lỗi và nhật ký bảo mật.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />{' '}
          Làm mới
        </button>
      </div>

      {error && (
        <div className="rounded-2xl bg-rose-50 p-4 text-xs font-semibold text-rose-700">
          {error}
        </div>
      )}
      {roleMessage && (
        <div className="rounded-2xl bg-emerald-50 p-4 text-xs font-semibold text-emerald-700">
          {roleMessage}
        </div>
      )}

      {loading && (
        <div className="grid min-h-64 place-items-center">
          <LeafLoader variant="bloom" size="md" label="Đang tải dữ liệu vận hành…" />
        </div>
      )}

      {!loading && overview && (
        <>
          {/* Metrics summary */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-card">
              <p className="text-xs font-medium text-slate-500">Người dùng</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">
                {overview.users.length}
              </p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-card">
              <p className="text-xs font-medium text-slate-500">Tổng phiên hội thoại</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">
                {overview.sessions.length}
              </p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-card">
              <p className="text-xs font-medium text-slate-500">Lỗi gần nhất</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">
                {overview.errors.length}
              </p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex flex-wrap gap-2">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold uppercase transition ${
                  activeTab === id
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                <Icon size={14} /> {label}
              </button>
            ))}
          </div>

          {/* Tab Content Box */}
          <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
            {/* TAB: USERS */}
            {activeTab === 'users' && (
              <table className="w-full min-w-[900px] text-left text-xs text-slate-700">
                <thead className="border-b border-slate-100 bg-slate-50 text-[10px] uppercase text-slate-400">
                  <tr>
                    <th className="p-3">Tên hiển thị</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Vai trò</th>
                    <th className="p-3">Trạng thái Onboarding</th>
                    <th className="p-3">Câu trả lời</th>
                    <th className="p-3">Ngày tham gia</th>
                    <th className="p-3">Hành động</th>
                    <th className="p-3">Quyền kịch bản</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {overview.users.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50/60 transition">
                      <td className="p-3 font-semibold text-slate-900">
                        {user.displayName || '—'}
                      </td>
                      <td className="p-3 font-mono text-[11px] text-slate-600">
                        {user.email}
                      </td>
                      <td className="p-3">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-700">
                          {labelRole(user.role)}
                        </span>
                      </td>
                      <td className="p-3">{labelStatus(user.onboardingStatus)}</td>
                      <td className="p-3 font-semibold">{user.answersCount}</td>
                      <td className="p-3 text-slate-500">
                        {new Date(user.joinedAt).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="p-3">
                        <button
                          type="button"
                          onClick={() => {
                            setDetailUserId(user.id);
                            setDetail(null);
                            setDetailError('');
                          }}
                          className="rounded-xl border border-slate-200 px-3 py-1.5 text-[10px] font-semibold text-slate-700 hover:bg-slate-100 transition"
                        >
                          Xem chi tiết
                        </button>
                      </td>
                      <td className="p-3">
                        {user.role === 'admin' ? (
                          <span className="text-[10px] text-slate-400 font-medium">
                            Toàn quyền
                          </span>
                        ) : user.role === 'content_admin' ? (
                          <button
                            type="button"
                            disabled={roleUpdating === user.id}
                            onClick={() =>
                              void updateContentRole(user.id, 'member')
                            }
                            className="rounded-xl border border-rose-200 px-2.5 py-1.5 text-[10px] font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                          >
                            {roleUpdating === user.id
                              ? 'Đang cập nhật…'
                              : 'Gỡ quyền biên tập'}
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={roleUpdating === user.id}
                            onClick={() =>
                              void updateContentRole(user.id, 'content_admin')
                            }
                            className="rounded-xl border border-indigo-200 px-2.5 py-1.5 text-[10px] font-semibold text-indigo-700 hover:bg-indigo-50 disabled:opacity-50"
                          >
                            {roleUpdating === user.id
                              ? 'Đang cập nhật…'
                              : 'Cấp quyền biên tập'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* TAB: SESSIONS (CONVERSATIONS TRACKING) */}
            {activeTab === 'sessions' && (
              <div className="space-y-4">
                {/* Search & Filter Header */}
                <div className="flex flex-col sm:flex-row gap-3 items-center justify-between pb-2 border-b border-slate-100">
                  <div className="relative w-full sm:w-80">
                    <Search
                      size={14}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="text"
                      value={sessionSearch}
                      onChange={(e) => setSessionSearch(e.target.value)}
                      placeholder="Tìm theo tên khách, email, tiêu đề..."
                      className="w-full rounded-2xl border border-slate-200 pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-slate-400 bg-slate-50/50"
                    />
                    {sessionSearch && (
                      <button
                        onClick={() => setSessionSearch('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Filter size={14} className="text-slate-400" />
                    <select
                      value={sessionStageFilter}
                      onChange={(e) => setSessionStageFilter(e.target.value)}
                      className="rounded-2xl border border-slate-200 px-3 py-2 text-xs text-slate-700 bg-slate-50/50 outline-none focus:border-slate-400"
                    >
                      <option value="all">Tất cả giai đoạn</option>
                      <option value="discovery">Khám phá (Discovery)</option>
                      <option value="reflection">Suy ngẫm (Reflection)</option>
                      <option value="experimentation">Thử nghiệm (Experimentation)</option>
                      <option value="integration">Tích hợp (Integration)</option>
                    </select>
                  </div>
                </div>

                {/* Sessions list */}
                {filteredSessions.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-500">
                    <MessageSquare size={32} className="mx-auto text-slate-300 mb-2" />
                    Không tìm thấy phiên trò chuyện nào phù hợp.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredSessions.map((session) => (
                      <div
                        key={session.id}
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-4 text-xs hover:border-slate-300 hover:bg-slate-50 transition"
                      >
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-900 text-sm truncate">
                              {session.title || 'Cuộc trò chuyện'}
                            </span>
                            <span className="rounded-full bg-emerald-100/70 text-emerald-800 px-2 py-0.5 text-[10px] font-semibold">
                              {labelStage(session.current_stage)}
                            </span>
                            <span className="rounded-full bg-slate-200/70 text-slate-700 px-2 py-0.5 text-[10px]">
                              {labelStatus(session.status)}
                            </span>
                          </div>

                          <p className="text-slate-600 flex items-center gap-2 flex-wrap text-[11px]">
                            <span className="font-semibold text-slate-800 flex items-center gap-1">
                              <User size={12} className="text-slate-400" />
                              {session.user_display_name || 'Khách hàng'}
                            </span>
                            <span className="text-slate-400">·</span>
                            <span className="font-mono text-slate-500">
                              {session.user_email || session.user_id.slice(0, 8) + '…'}
                            </span>
                          </p>
                        </div>

                        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end shrink-0">
                          <span className="text-slate-400 text-[11px] flex items-center gap-1">
                            <Clock size={12} />
                            {session.last_message_at
                              ? new Date(session.last_message_at).toLocaleString('vi-VN')
                              : 'Chưa có tin nhắn'}
                          </span>
                          <button
                            type="button"
                            onClick={() => void openConversation(session.id)}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 text-white px-3.5 py-2 text-xs font-semibold hover:bg-slate-800 transition shadow-sm"
                          >
                            <MessageSquare size={13} />
                            Đọc cuộc trò chuyện
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB: ERRORS */}
            {activeTab === 'errors' && (
              <div className="space-y-3">
                {overview.errors.length === 0 ? (
                  <p className="text-sm text-slate-500">Chưa có lỗi được ghi nhận.</p>
                ) : (
                  overview.errors.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col justify-between gap-2 rounded-2xl border border-rose-100 bg-rose-50 p-4 text-xs sm:flex-row"
                    >
                      <div>
                        <p className="font-bold text-rose-800">{item.error_code}</p>
                        <p className="mt-1 text-slate-600">
                          {item.route} · request {item.request_id}
                        </p>
                      </div>
                      <span className="text-slate-400">
                        {new Date(item.created_at).toLocaleString('vi-VN')}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB: AUDIT LOGS */}
            {activeTab === 'audit' && (
              <div className="space-y-3">
                {overview.auditLogs.length === 0 ? (
                  <p className="text-sm text-slate-500">Chưa có nhật ký kiểm tra.</p>
                ) : (
                  overview.auditLogs.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-xs"
                    >
                      <p className="font-semibold text-slate-900">
                        {labelAuditAction(item.action)} · {labelResourceType(item.resource_type)}
                      </p>
                      <p className="mt-1 text-slate-600">{item.reason}</p>
                      <p className="mt-1 text-slate-400">
                        {new Date(item.created_at).toLocaleString('vi-VN')} · quản trị viên{' '}
                        {item.admin_id.slice(0, 8)}…
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* USER DETAIL MODAL */}
      {detailUserId && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Chi tiết người dùng"
        >
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-6 text-slate-900 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold">Chi tiết người dùng</h2>
                <p className="mt-1 text-xs text-slate-500">
                  Dữ liệu câu trả lời chỉ mở sau khi ghi rõ lý do và ghi nhật ký.
                </p>
              </div>
              <button
                type="button"
                onClick={closeDetail}
                className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Đóng
              </button>
            </div>

            {!detail && (
              <form onSubmit={openDetail} className="mt-6 space-y-3">
                <label className="block text-xs font-semibold text-slate-600">
                  Lý do truy cập
                  <input
                    autoFocus
                    required
                    minLength={3}
                    maxLength={240}
                    value={detailReason}
                    onChange={(event) => setDetailReason(event.target.value)}
                    placeholder="Ví dụ: kiểm tra sự cố lúc bắt đầu"
                    className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-normal outline-none focus:border-slate-400"
                  />
                </label>
                {detailError && (
                  <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
                    {detailError}
                  </p>
                )}
                <button
                  disabled={detailLoading}
                  className="rounded-2xl bg-slate-900 px-4 py-3 text-xs font-semibold text-white disabled:opacity-50"
                >
                  {detailLoading ? 'Đang mở…' : 'Ghi nhật ký và xem chi tiết'}
                </button>
              </form>
            )}

            {detail && (
              <div className="mt-6 space-y-5">
                <div className="grid gap-3 rounded-2xl bg-slate-50 p-4 text-xs sm:grid-cols-3">
                  <div>
                    <span className="text-slate-400">Email</span>
                    <p className="mt-1 font-mono font-medium">{detail.user.email}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Tên hiển thị</span>
                    <p className="mt-1 font-semibold">
                      {detail.profile?.display_name || '—'}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400">Trạng thái bắt đầu</span>
                    <p className="mt-1 font-semibold">
                      {labelStatus(detail.profile?.onboarding_status)}
                    </p>
                  </div>
                </div>

                <section>
                  <h3 className="text-sm font-bold">
                    Câu trả lời ({detail.answers.length})
                  </h3>
                  {detail.answers.length === 0 ? (
                    <p className="mt-2 text-xs text-slate-500">
                      Chưa có câu trả lời.
                    </p>
                  ) : (
                    <div className="mt-2 space-y-2">
                      {detail.answers.map((answer) => (
                        <div
                          key={answer.id}
                          className="rounded-2xl border border-slate-100 p-3 text-xs"
                        >
                          <p className="font-semibold">
                            {answer.questionTitle ||
                              answer.questionKey ||
                              'Câu hỏi'}
                          </p>
                          <pre className="mt-2 whitespace-pre-wrap break-words font-sans text-slate-600">
                            {typeof answer.answer === 'string'
                              ? answer.answer
                              : JSON.stringify(answer.answer, null, 2)}
                          </pre>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                <section>
                  <h3 className="text-sm font-bold">
                    Phiên trò chuyện ({detail.conversations.length})
                  </h3>
                  {detail.conversations.length === 0 ? (
                    <p className="mt-2 text-xs text-slate-500">
                      Chưa có phiên nào.
                    </p>
                  ) : (
                    <div className="mt-2 space-y-2">
                      {detail.conversations.map((conversation) => (
                        <div
                          key={conversation.id}
                          className="flex items-center justify-between rounded-2xl border border-slate-100 p-3 text-xs hover:bg-slate-50 transition"
                        >
                          <div>
                            <p className="font-semibold text-slate-900">
                              {conversation.title}
                            </p>
                            <p className="mt-1 text-slate-500 text-[11px]">
                              {labelStatus(conversation.status)} ·{' '}
                              {labelStage(conversation.current_stage)} ·{' '}
                              {new Date(
                                conversation.last_message_at
                              ).toLocaleString('vi-VN')}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => void openConversation(conversation.id)}
                            className="inline-flex items-center gap-1 rounded-xl bg-slate-900 text-white px-3 py-1.5 text-xs font-semibold hover:bg-slate-800"
                          >
                            <MessageSquare size={12} />
                            Đọc hội thoại
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FULL CONVERSATION VIEWER MODAL */}
      {viewingConvId && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-slate-950/75 p-3 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label="Đọc cuộc trò chuyện khách hàng"
        >
          <div className="flex flex-col h-[92vh] w-full max-w-4xl rounded-3xl bg-white text-slate-900 shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 px-6 py-4 bg-slate-50/70 shrink-0">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-600 text-white">
                    <MessageSquare size={14} />
                  </span>
                  <h2 className="text-base font-bold text-slate-900 truncate">
                    {convDetail?.conversation.title || 'Đang tải phiên trò chuyện…'}
                  </h2>
                  {convDetail && (
                    <>
                      <span className="rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-0.5 text-[10px] font-bold">
                        {labelStage(convDetail.conversation.current_stage)}
                      </span>
                      <span className="rounded-full bg-slate-200 text-slate-700 px-2.5 py-0.5 text-[10px]">
                        {labelStatus(convDetail.conversation.status)}
                      </span>
                    </>
                  )}
                </div>

                {convDetail && (
                  <p className="mt-1 text-xs text-slate-500 flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-700 flex items-center gap-1">
                      <User size={12} className="text-slate-400" />
                      {convDetail.user.displayName}
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className="font-mono text-slate-600">{convDetail.user.email}</span>
                    <span className="text-slate-300">·</span>
                    <span className="text-slate-400">
                      Bắt đầu: {new Date(convDetail.conversation.created_at).toLocaleString('vi-VN')}
                    </span>
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                {convDetail && (
                  <button
                    type="button"
                    onClick={copyConversationTranscript}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-sm"
                  >
                    {copiedTranscript ? (
                      <>
                        <Check size={13} className="text-emerald-600" />
                        <span className="text-emerald-700">Đã sao chép</span>
                      </>
                    ) : (
                      <>
                        <Copy size={13} />
                        Sao chép hội thoại
                      </>
                    )}
                  </button>
                )}
                <button
                  type="button"
                  onClick={closeConversation}
                  className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition"
                  title="Đóng"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Sub-tabs: Messages vs AI Observations */}
            {convDetail && (
              <div className="flex items-center gap-2 border-b border-slate-100 px-6 py-2 bg-slate-50/40 shrink-0">
                <button
                  type="button"
                  onClick={() => setConvActiveTab('messages')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                    convActiveTab === 'messages'
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <MessageSquare size={13} />
                  Dòng tin nhắn ({convDetail.messages.length})
                </button>
                <button
                  type="button"
                  onClick={() => setConvActiveTab('observations')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                    convActiveTab === 'observations'
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Sparkles size={13} />
                  AI Bóc tách Insight ({convDetail.observations.length})
                </button>
              </div>
            )}

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/30">
              {convLoading && (
                <div className="grid min-h-64 place-items-center">
                  <LeafLoader variant="bloom" size="md" label="Đang tải toàn bộ cuộc trò chuyện…" />
                </div>
              )}

              {convError && (
                <div className="rounded-2xl bg-rose-50 p-4 text-xs font-semibold text-rose-700">
                  {convError}
                </div>
              )}

              {/* MESSAGES VIEW */}
              {!convLoading && convDetail && convActiveTab === 'messages' && (
                <div className="space-y-4 max-w-3xl mx-auto">
                  {convDetail.messages.length === 0 ? (
                    <div className="py-16 text-center text-xs text-slate-400">
                      <MessageSquare size={36} className="mx-auto text-slate-300 mb-2" />
                      Chưa có tin nhắn nào trong cuộc trò chuyện này.
                    </div>
                  ) : (
                    convDetail.messages.map((msg, index) => {
                      const isUser = msg.role === 'user';
                      const isSystem = msg.role === 'system';

                      if (isSystem) {
                        return (
                          <div
                            key={msg.id || index}
                            className="text-center py-2 text-[11px] text-slate-400 italic bg-slate-100/60 rounded-xl px-3 my-2"
                          >
                            {msg.content}
                          </div>
                        );
                      }

                      return (
                        <div
                          key={msg.id || index}
                          className={`flex gap-3 ${
                            isUser ? 'flex-row-reverse' : 'flex-row'
                          }`}
                        >
                          {/* Avatar Icon */}
                          <div
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl shadow-sm ${
                              isUser
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-900 text-white'
                            }`}
                          >
                            {isUser ? <User size={15} /> : <Bot size={15} />}
                          </div>

                          {/* Message Content Bubble */}
                          <div
                            className={`flex flex-col max-w-[85%] sm:max-w-[75%] ${
                              isUser ? 'items-end' : 'items-start'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1 px-1">
                              <span className="text-[11px] font-bold text-slate-700">
                                {isUser
                                  ? convDetail.user.displayName || 'Khách hàng'
                                  : 'AI LifeLab'}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {new Date(msg.created_at).toLocaleTimeString(
                                  'vi-VN',
                                  { hour: '2-digit', minute: '2-digit' }
                                )}
                              </span>
                            </div>

                            <div
                              className={`rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-sm whitespace-pre-wrap break-words ${
                                isUser
                                  ? 'bg-emerald-700 text-white rounded-tr-none'
                                  : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                              }`}
                            >
                              {msg.content}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* OBSERVATIONS / INSIGHTS VIEW */}
              {!convLoading && convDetail && convActiveTab === 'observations' && (
                <div className="space-y-3 max-w-3xl mx-auto">
                  {convDetail.observations.length === 0 ? (
                    <div className="py-16 text-center text-xs text-slate-400">
                      <Sparkles size={36} className="mx-auto text-slate-300 mb-2" />
                      Chưa có insight hay observation nào được AI trích xuất từ phiên này.
                    </div>
                  ) : (
                    convDetail.observations.map((obs) => (
                      <div
                        key={obs.id}
                        className="rounded-2xl border border-slate-200 bg-white p-4 text-xs shadow-sm space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="rounded-full bg-indigo-100 text-indigo-800 px-2.5 py-0.5 text-[10px] font-bold uppercase">
                            {obs.dimension}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Độ tin cậy: {Math.round((obs.confidence || 0) * 100)}%
                          </span>
                        </div>

                        <p className="font-semibold text-slate-800">
                          {obs.content_user_edited || obs.content_original}
                        </p>

                        {obs.content_user_edited && (
                          <div className="rounded-xl bg-slate-50 p-2 text-[11px] text-slate-500">
                            <span className="font-semibold">Nội dung gốc AI: </span>
                            {obs.content_original}
                          </div>
                        )}

                        <p className="text-[10px] text-slate-400">
                          Trích xuất lúc: {new Date(obs.created_at).toLocaleString('vi-VN')}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-slate-100 px-6 py-3 bg-white flex items-center justify-between text-xs text-slate-500 shrink-0">
              <span>
                {convDetail
                  ? `Tổng số ${convDetail.messages.length} tin nhắn · Phiên ID: ${convDetail.conversation.id}`
                  : ''}
              </span>
              <button
                type="button"
                onClick={closeConversation}
                className="rounded-xl bg-slate-100 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-200 transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
