'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { Activity, FileText, Loader2, Lock, RefreshCw, ShieldAlert, Users } from 'lucide-react';
import { labelAuditAction, labelRole, labelStage, labelStatus, labelResourceType } from '@/lib/i18n';

type AdminOverview = {
  users: Array<{ id: string; email: string; role: string; joinedAt: string; displayName: string; onboardingStatus: string; answersCount: number }>;
  sessions: Array<{ id: string; user_id: string; title: string; status: string; current_stage: string; last_message_at: string }>;
  errors: Array<{ id: string; error_code: string; route: string; request_id: string; created_at: string }>;
  auditLogs: Array<{ id: string; admin_id: string; resource_type: string; action: string; reason: string; created_at: string }>;
  pagination: { page: number; perPage: number; total: number };
};

type Tab = 'users' | 'sessions' | 'errors' | 'audit';

type UserDetail = {
  user: { id: string; email: string; createdAt: string; lastSignInAt: string | null };
  profile: { display_name: string; onboarding_status: string; consented_at: string | null; locale: string; timezone: string } | null;
  answers: Array<{ id: string; questionKey: string; questionTitle: string; answer: unknown; answeredAt: string }>;
  conversations: Array<{ id: string; title: string; status: string; current_stage: string; last_message_at: string }>;
};

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>('users');
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [detailUserId, setDetailUserId] = useState('');
  const [detailReason, setDetailReason] = useState('');
  const [detail, setDetail] = useState<UserDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [roleUpdating, setRoleUpdating] = useState('');
  const [roleMessage, setRoleMessage] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin/overview?reason=Admin%20dashboard%20review', { cache: 'no-store' });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'Không thể tải dữ liệu vận hành');
      setOverview(json.data);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể tải dữ liệu vận hành');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

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
      setDetailError('Hãy nhập lý do tối thiểu 3 ký tự để ghi nhật ký kiểm tra.');
      return;
    }
    setDetailLoading(true);
    setDetailError('');
    try {
      const response = await fetch(`/api/admin/users/${detailUserId}?reason=${encodeURIComponent(detailReason.trim())}`, { cache: 'no-store' });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'Không thể mở chi tiết người dùng');
      setDetail(json.data);
    } catch (reason) {
      setDetailError(reason instanceof Error ? reason.message : 'Không thể mở chi tiết người dùng');
    } finally {
      setDetailLoading(false);
    }
  };

  const updateContentRole = async (userId: string, role: 'content_admin' | 'member') => {
    const granting = role === 'content_admin';
    if (!window.confirm(granting
      ? 'Cấp quyền biên tập AI cho tài khoản này? Tài khoản sẽ có thể tải và xuất bản kịch bản, nhưng không xem dữ liệu người dùng.'
      : 'Gỡ quyền biên tập AI của tài khoản này?')) return;

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
      if (!response.ok) throw new Error(json.error || 'Không thể cập nhật quyền biên tập.');
      setRoleMessage(granting ? 'Đã cấp quyền biên tập AI. Tài khoản cần tải lại trang để thấy thư viện kịch bản.' : 'Đã gỡ quyền biên tập AI.');
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể cập nhật quyền biên tập.');
    } finally {
      setRoleUpdating('');
    }
  };

  const tabs: Array<{ id: Tab; label: string; icon: typeof Users }> = [
    { id: 'users', label: 'Người dùng', icon: Users },
    { id: 'sessions', label: 'Phiên', icon: Activity },
    { id: 'errors', label: 'Lỗi', icon: ShieldAlert },
    { id: 'audit', label: 'Nhật ký kiểm tra', icon: FileText },
  ];

  return (
    <div className="legacy-calm-page min-h-screen space-y-6 bg-calm-deep-moss p-6">
      <div className="flex flex-col justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-card lg:flex-row lg:items-center">
        <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white"><Lock size={20} /></div><div><h1 className="text-xl font-bold text-slate-900">Kiểm tra & vận hành</h1><p className="text-xs text-slate-500">Dữ liệu được giới hạn, email được che một phần, mỗi lần đọc đều được ghi nhật ký.</p></div></div>
        <button type="button" onClick={() => void load()} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 disabled:opacity-50"><RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Làm mới</button>
      </div>

      {error && <div className="rounded-2xl bg-rose-50 p-4 text-xs font-semibold text-rose-700">{error}</div>}
      {roleMessage && <div className="rounded-2xl bg-emerald-50 p-4 text-xs font-semibold text-emerald-700">{roleMessage}</div>}
      {loading && <div className="grid min-h-64 place-items-center"><Loader2 className="animate-spin text-indigo-600" /></div>}
      {!loading && overview && <>
        <div className="grid gap-4 sm:grid-cols-3"><div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-card"><p className="text-xs text-slate-500">Người dùng trong trang</p><p className="mt-2 text-3xl font-bold text-slate-900">{overview.users.length}</p></div><div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-card"><p className="text-xs text-slate-500">Phiên gần nhất</p><p className="mt-2 text-3xl font-bold text-slate-900">{overview.sessions.length}</p></div><div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-card"><p className="text-xs text-slate-500">Lỗi gần nhất</p><p className="mt-2 text-3xl font-bold text-slate-900">{overview.errors.length}</p></div></div>
        <div className="flex flex-wrap gap-2">{tabs.map(({ id, label, icon: Icon }) => <button key={id} type="button" onClick={() => setActiveTab(id)} className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-xs font-bold uppercase transition ${activeTab === id ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}><Icon size={14} /> {label}</button>)}</div>
        <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
          {activeTab === 'users' && <table className="w-full min-w-[900px] text-left text-xs text-slate-700"><thead className="border-b border-slate-100 bg-slate-50 text-[10px] uppercase text-slate-400"><tr><th className="p-3">Tên hiển thị</th><th className="p-3">Email (đã che)</th><th className="p-3">Vai trò</th><th className="p-3">Trạng thái bắt đầu</th><th className="p-3">Câu trả lời</th><th className="p-3">Ngày tham gia</th><th className="p-3">Truy cập</th><th className="p-3">Quyền kịch bản</th></tr></thead><tbody className="divide-y divide-slate-100">{overview.users.map((user) => <tr key={user.id}><td className="p-3 font-semibold text-slate-900">{user.displayName || '—'}</td><td className="p-3 font-mono text-[11px]">{user.email}</td><td className="p-3"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold">{labelRole(user.role)}</span></td><td className="p-3">{labelStatus(user.onboardingStatus)}</td><td className="p-3">{user.answersCount}</td><td className="p-3">{new Date(user.joinedAt).toLocaleDateString('vi-VN')}</td><td className="p-3"><button type="button" onClick={() => { setDetailUserId(user.id); setDetail(null); setDetailError(''); }} className="rounded-xl border border-slate-200 px-2.5 py-1.5 text-[10px] font-semibold text-slate-700 hover:bg-slate-50">Xem chi tiết</button></td><td className="p-3">{user.role === 'admin' ? <span className="text-[10px] text-slate-400">Toàn quyền</span> : user.role === 'content_admin' ? <button type="button" disabled={roleUpdating === user.id} onClick={() => void updateContentRole(user.id, 'member')} className="rounded-xl border border-rose-200 px-2.5 py-1.5 text-[10px] font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50">{roleUpdating === user.id ? 'Đang cập nhật…' : 'Gỡ quyền biên tập'}</button> : <button type="button" disabled={roleUpdating === user.id} onClick={() => void updateContentRole(user.id, 'content_admin')} className="rounded-xl border border-indigo-200 px-2.5 py-1.5 text-[10px] font-semibold text-indigo-700 hover:bg-indigo-50 disabled:opacity-50">{roleUpdating === user.id ? 'Đang cập nhật…' : 'Cấp quyền biên tập'}</button>}</td></tr>)}</tbody></table>}
          {activeTab === 'sessions' && <div className="space-y-3">{overview.sessions.length === 0 ? <p className="text-sm text-slate-500">Chưa có phiên nào.</p> : overview.sessions.map((session) => <div key={session.id} className="flex flex-col justify-between gap-2 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-xs sm:flex-row"><div><p className="font-semibold text-slate-900">{session.title}</p><p className="mt-1 text-slate-500">Bước: {labelStage(session.current_stage)} · Mã người dùng: {session.user_id.slice(0, 8)}…</p></div><span className="text-slate-400">{new Date(session.last_message_at).toLocaleString('vi-VN')}</span></div>)}</div>}
          {activeTab === 'errors' && <div className="space-y-3">{overview.errors.length === 0 ? <p className="text-sm text-slate-500">Chưa có lỗi được ghi nhận.</p> : overview.errors.map((item) => <div key={item.id} className="flex flex-col justify-between gap-2 rounded-2xl border border-rose-100 bg-rose-50 p-4 text-xs sm:flex-row"><div><p className="font-bold text-rose-800">{item.error_code}</p><p className="mt-1 text-slate-600">{item.route} · request {item.request_id}</p></div><span className="text-slate-400">{new Date(item.created_at).toLocaleString('vi-VN')}</span></div>)}</div>}
          {activeTab === 'audit' && <div className="space-y-3">{overview.auditLogs.length === 0 ? <p className="text-sm text-slate-500">Chưa có nhật ký kiểm tra.</p> : overview.auditLogs.map((item) => <div key={item.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-xs"><p className="font-semibold text-slate-900">{labelAuditAction(item.action)} · {labelResourceType(item.resource_type)}</p><p className="mt-1 text-slate-600">{item.reason}</p><p className="mt-1 text-slate-400">{new Date(item.created_at).toLocaleString('vi-VN')} · quản trị viên {item.admin_id.slice(0, 8)}…</p></div>)}</div>}
        </div>
      </>}

      {detailUserId && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4" role="dialog" aria-modal="true" aria-label="Chi tiết người dùng">
        <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-6 text-slate-900 shadow-2xl">
          <div className="flex items-start justify-between gap-4"><div><h2 className="text-lg font-bold">Chi tiết người dùng</h2><p className="mt-1 text-xs text-slate-500">Dữ liệu câu trả lời chỉ mở sau khi ghi rõ lý do và ghi nhật ký.</p></div><button type="button" onClick={closeDetail} className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600">Đóng</button></div>
          {!detail && <form onSubmit={openDetail} className="mt-6 space-y-3"><label className="block text-xs font-semibold text-slate-600">Lý do truy cập<input autoFocus required minLength={3} maxLength={240} value={detailReason} onChange={(event) => setDetailReason(event.target.value)} placeholder="Ví dụ: kiểm tra sự cố lúc bắt đầu" className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-normal outline-none focus:border-slate-400" /></label>{detailError && <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">{detailError}</p>}<button disabled={detailLoading} className="rounded-2xl bg-slate-900 px-4 py-3 text-xs font-semibold text-white disabled:opacity-50">{detailLoading ? 'Đang mở…' : 'Ghi nhật ký và xem chi tiết'}</button></form>}
          {detail && <div className="mt-6 space-y-5"><div className="grid gap-3 rounded-2xl bg-slate-50 p-4 text-xs sm:grid-cols-3"><div><span className="text-slate-400">Email</span><p className="mt-1 font-mono">{detail.user.email}</p></div><div><span className="text-slate-400">Tên hiển thị</span><p className="mt-1 font-semibold">{detail.profile?.display_name || '—'}</p></div><div><span className="text-slate-400">Trạng thái bắt đầu</span><p className="mt-1 font-semibold">{labelStatus(detail.profile?.onboarding_status)}</p></div></div><section><h3 className="text-sm font-bold">Câu trả lời ({detail.answers.length})</h3>{detail.answers.length === 0 ? <p className="mt-2 text-xs text-slate-500">Chưa có câu trả lời.</p> : <div className="mt-2 space-y-2">{detail.answers.map((answer) => <div key={answer.id} className="rounded-2xl border border-slate-100 p-3 text-xs"><p className="font-semibold">{answer.questionTitle || answer.questionKey || 'Câu hỏi'}</p><pre className="mt-2 whitespace-pre-wrap break-words font-sans text-slate-600">{typeof answer.answer === 'string' ? answer.answer : JSON.stringify(answer.answer)}</pre></div>)}</div>}</section><section><h3 className="text-sm font-bold">Phiên trò chuyện ({detail.conversations.length})</h3>{detail.conversations.length === 0 ? <p className="mt-2 text-xs text-slate-500">Chưa có phiên nào.</p> : <div className="mt-2 space-y-2">{detail.conversations.map((conversation) => <div key={conversation.id} className="rounded-2xl border border-slate-100 p-3 text-xs"><p className="font-semibold">{conversation.title}</p><p className="mt-1 text-slate-500">{labelStatus(conversation.status)} · {labelStage(conversation.current_stage)} · {new Date(conversation.last_message_at).toLocaleString('vi-VN')}</p></div>)}</div>}</section></div>}
        </div>
      </div>}
    </div>
  );
}
