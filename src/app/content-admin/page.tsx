'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import {
  Archive,
  Check,
  FileEdit,
  FileText,
  Leaf,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  ShieldCheck,
  Upload,
  WandSparkles,
  X,
} from 'lucide-react';

type ScriptStatus = 'draft' | 'published' | 'archived';

type Script = {
  id: string;
  scriptKey: string;
  title: string;
  description: string | null;
  sourceType: string;
  sourceFilename: string | null;
  content: string;
  versionNo: number;
  status: ScriptStatus;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type ScriptForm = {
  scriptKey: string;
  title: string;
  description: string;
  content: string;
};

const EMPTY_FORM: ScriptForm = {
  scriptKey: '',
  title: '',
  description: '',
  content: '',
};

const statusMeta: Record<ScriptStatus, { label: string; className: string }> = {
  draft: { label: 'Bản nháp', className: 'border-calm-pollen/25 bg-calm-pollen/10 text-calm-pollen' },
  published: { label: 'Đang áp dụng', className: 'border-calm-lichen/30 bg-calm-lichen/10 text-calm-lichen' },
  archived: { label: 'Đã lưu trữ', className: 'border-white/10 bg-white/5 text-calm-fog/70' },
};

function apiMessage(code: unknown, fallback: string) {
  const messages: Record<string, string> = {
    FORBIDDEN: 'Tài khoản này chưa được cấp quyền biên tập AI.',
    SCRIPT_LIBRARY_UNAVAILABLE: 'Thư viện kịch bản chưa sẵn sàng. Kiểm tra cấu hình máy chủ và migration.',
    SCRIPT_UPDATE_UNAVAILABLE: 'Không thể lưu bản nháp lúc này.',
    SCRIPT_PUBLISH_UNAVAILABLE: 'Không thể xuất bản kịch bản lúc này.',
    SCRIPT_ARCHIVE_UNAVAILABLE: 'Không thể lưu trữ kịch bản lúc này.',
    INVALID_SCRIPT_KEY: 'Mã kịch bản chỉ gồm chữ thường, số, dấu gạch ngang hoặc gạch dưới.',
    INVALID_SCRIPT_TITLE: 'Tiêu đề cần dài từ 2 đến 160 ký tự.',
    INVALID_SCRIPT: 'Hãy kiểm tra tiêu đề và nội dung kịch bản.',
    INVALID_SCRIPT_CONTENT: 'Nội dung kịch bản không hợp lệ.',
    SCRIPT_TOO_LONG: 'Kịch bản tối đa 60.000 ký tự.',
    UNSUPPORTED_FILE_TYPE: 'Chỉ hỗ trợ tệp .docx, .txt hoặc .md.',
    FILE_TOO_LARGE: 'Tệp tải lên tối đa 2 MB.',
    EMPTY_SCRIPT: 'Hãy dán nội dung hoặc chọn một tệp để tải lên.',
    SCRIPT_NOT_FOUND: 'Không tìm thấy kịch bản.',
    DRAFT_NOT_FOUND: 'Chỉ có thể chỉnh sửa bản nháp.',
  };
  return typeof code === 'string' ? messages[code] || code : fallback;
}

async function readJson(response: Response) {
  return response.json().catch(() => ({})) as Promise<{ data?: { scripts?: Script[]; script?: Script }; error?: string; detail?: string }>;
}

function sourceLabel(script: Script) {
  if (script.sourceFilename) return script.sourceFilename;
  if (script.sourceType === 'docx') return 'Word (.docx)';
  if (script.sourceType === 'md') return 'Markdown (.md)';
  if (script.sourceType === 'txt') return 'Văn bản (.txt)';
  return 'Dán thủ công';
}

export default function ContentAdminPage() {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [form, setForm] = useState<ScriptForm>(EMPTY_FORM);
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState('');
  const [editingForm, setEditingForm] = useState<ScriptForm>(EMPTY_FORM);
  const [savingEdit, setSavingEdit] = useState(false);
  const [actionId, setActionId] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadScripts = useCallback(async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true);
    setError('');
    try {
      const response = await fetch('/api/ai-scripts', { cache: 'no-store' });
      const json = await readJson(response);
      if (!response.ok) throw new Error(apiMessage(json.error, 'Không thể tải thư viện kịch bản.'));
      setScripts(json.data?.scripts || []);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể tải thư viện kịch bản.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadScripts();
  }, [loadScripts]);

  const counts = useMemo(() => ({
    total: scripts.length,
    published: scripts.filter((script) => script.status === 'published').length,
    drafts: scripts.filter((script) => script.status === 'draft').length,
    archived: scripts.filter((script) => script.status === 'archived').length,
  }), [scripts]);

  const updateForm = (field: keyof ScriptForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setNotice('');
    try {
      const payload = new FormData();
      payload.set('scriptKey', form.scriptKey);
      payload.set('title', form.title);
      payload.set('description', form.description);
      if (file) payload.set('file', file);
      else payload.set('content', form.content);

      const response = await fetch('/api/ai-scripts', { method: 'POST', body: payload });
      const json = await readJson(response);
      if (!response.ok) throw new Error(apiMessage(json.error, json.detail || 'Không thể tạo bản nháp.'));
      setForm(EMPTY_FORM);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setNotice('Đã tạo bản nháp. Kiểm tra nội dung trước khi xuất bản.');
      await loadScripts();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể tạo bản nháp.');
    } finally {
      setSubmitting(false);
    }
  };

  const startEditing = (script: Script) => {
    if (script.status !== 'draft') return;
    setEditingId(script.id);
    setEditingForm({
      scriptKey: script.scriptKey,
      title: script.title,
      description: script.description || '',
      content: script.content,
    });
    setNotice('');
    setError('');
    window.setTimeout(() => document.getElementById('script-editor')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
  };

  const saveEditing = async (event: FormEvent) => {
    event.preventDefault();
    if (!editingId) return;
    setSavingEdit(true);
    setError('');
    setNotice('');
    try {
      const response = await fetch(`/api/ai-scripts/${editingId}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          title: editingForm.title,
          description: editingForm.description,
          content: editingForm.content,
        }),
      });
      const json = await readJson(response);
      if (!response.ok) throw new Error(apiMessage(json.error, 'Không thể lưu bản nháp.'));
      setEditingId('');
      setNotice('Đã lưu bản nháp.');
      await loadScripts();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể lưu bản nháp.');
    } finally {
      setSavingEdit(false);
    }
  };

  const runAction = async (script: Script, action: 'publish' | 'archive') => {
    const confirmation = action === 'publish'
      ? `Xuất bản “${script.title}” v${script.versionNo}? Bản đang áp dụng cùng mã sẽ được lưu trữ.`
      : `Lưu trữ “${script.title}” v${script.versionNo}?`;
    if (!window.confirm(confirmation)) return;
    setActionId(script.id);
    setError('');
    setNotice('');
    try {
      const response = await fetch(`/api/ai-scripts/${script.id}/${action}`, { method: 'POST' });
      const json = await readJson(response);
      if (!response.ok) throw new Error(apiMessage(json.error, `Không thể ${action === 'publish' ? 'xuất bản' : 'lưu trữ'} kịch bản.`));
      setNotice(action === 'publish' ? 'Đã xuất bản. Các lượt chat mới sẽ dùng nội dung này.' : 'Đã lưu trữ kịch bản.');
      await loadScripts();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể cập nhật kịch bản.');
    } finally {
      setActionId('');
    }
  };

  return (
    <div className="min-h-screen bg-calm-deep-moss px-4 py-5 text-calm-paper-white sm:px-6 lg:px-10 lg:py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col justify-between gap-5 rounded-[30px] border border-white/10 bg-white/[0.06] p-5 shadow-glass backdrop-blur-xl sm:flex-row sm:items-center sm:p-7">
          <div className="flex items-start gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-calm-lichen/30 bg-calm-lichen/10 text-calm-lichen">
              <WandSparkles className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-calm-pollen">Không gian biên tập</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Thư viện kịch bản AI</h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-calm-fog/80">Soạn những hướng dẫn đã được duyệt để Life Lab trò chuyện nhất quán, sâu và an toàn hơn với người dùng.</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-calm-lichen/30 bg-calm-lichen/10 px-3 py-2 text-[11px] font-semibold text-calm-lichen"><ShieldCheck className="h-3.5 w-3.5" /> Biên tập viên AI</span>
            <Link href="/app" className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-semibold text-calm-fog transition hover:bg-white/10 hover:text-calm-paper-white">Về Life Lab</Link>
          </div>
        </header>

        <div className="grid gap-3 sm:grid-cols-4">
          {[
            ['Tổng kịch bản', counts.total, <FileText key="total" className="h-4 w-4" />],
            ['Đang áp dụng', counts.published, <Check key="published" className="h-4 w-4" />],
            ['Bản nháp', counts.drafts, <FileEdit key="drafts" className="h-4 w-4" />],
            ['Lưu trữ', counts.archived, <Archive key="archived" className="h-4 w-4" />],
          ].map(([label, value, icon]) => (
            <div key={String(label)} className="rounded-3xl border border-white/10 bg-white/[0.045] p-4 shadow-glass">
              <div className="flex items-center justify-between text-calm-fog/70"><span className="text-xs">{label}</span><span className="text-calm-lichen">{icon}</span></div>
              <p className="mt-2 text-2xl font-semibold">{value}</p>
            </div>
          ))}
        </div>

        {(error || notice) && (
          <div role="status" aria-live="polite" className={`flex items-start justify-between gap-3 rounded-2xl border px-4 py-3 text-sm ${error ? 'border-rose-300/30 bg-rose-400/10 text-rose-100' : 'border-calm-lichen/30 bg-calm-lichen/10 text-calm-lichen'}`}>
            <span>{error || notice}</span>
            <button type="button" onClick={() => { setError(''); setNotice(''); }} className="shrink-0 opacity-70 hover:opacity-100" aria-label="Đóng thông báo"><X className="h-4 w-4" /></button>
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
          <section className="rounded-[30px] border border-white/10 bg-white/[0.055] p-5 shadow-glass sm:p-7">
            <div className="mb-5 flex items-start gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-calm-pollen/10 text-calm-pollen"><Plus className="h-5 w-5" /></div>
              <div><h2 className="text-lg font-semibold">Thêm kịch bản mới</h2><p className="mt-1 text-xs leading-relaxed text-calm-fog/70">Tạo bản nháp trước. Chỉ nội dung đã xuất bản mới được đưa vào AI.</p></div>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-xs font-medium text-calm-fog">Mã kịch bản <span className="text-calm-pollen">*</span><input required pattern="[a-z0-9][a-z0-9_-]{1,80}" value={form.scriptKey} onChange={(event) => updateForm('scriptKey', event.target.value.toLowerCase())} placeholder="onboarding-welcome" className="mt-1.5 w-full rounded-2xl border border-white/10 bg-black/10 px-3.5 py-3 text-sm text-calm-paper-white outline-none transition placeholder:text-calm-fog/35 focus:border-calm-lichen/50" /></label>
                <label className="block text-xs font-medium text-calm-fog">Tiêu đề <span className="text-calm-pollen">*</span><input required minLength={2} maxLength={160} value={form.title} onChange={(event) => updateForm('title', event.target.value)} placeholder="Chào đón người dùng mới" className="mt-1.5 w-full rounded-2xl border border-white/10 bg-black/10 px-3.5 py-3 text-sm text-calm-paper-white outline-none transition placeholder:text-calm-fog/35 focus:border-calm-lichen/50" /></label>
              </div>
              <label className="block text-xs font-medium text-calm-fog">Mô tả ngắn<input maxLength={500} value={form.description} onChange={(event) => updateForm('description', event.target.value)} placeholder="Khi nào và vì sao AI dùng kịch bản này" className="mt-1.5 w-full rounded-2xl border border-white/10 bg-black/10 px-3.5 py-3 text-sm text-calm-paper-white outline-none transition placeholder:text-calm-fog/35 focus:border-calm-lichen/50" /></label>
              <label className="block text-xs font-medium text-calm-fog">Tải Word / TXT / Markdown <span className="font-normal text-calm-fog/50">(không bắt buộc nếu dán nội dung)</span><span className="mt-1.5 flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-white/15 bg-black/10 px-3.5 py-3 text-sm text-calm-fog transition hover:border-calm-lichen/40"><Upload className="h-4 w-4 text-calm-lichen" /><span className="min-w-0 flex-1 truncate">{file ? file.name : 'Chọn tệp .docx, .txt hoặc .md'}</span><input ref={fileInputRef} type="file" accept=".docx,.txt,.md,text/plain,text/markdown,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={(event) => setFile(event.target.files?.[0] || null)} className="sr-only" /></span></label>
              <label className="block text-xs font-medium text-calm-fog">Hoặc dán nội dung kịch bản <span className="text-calm-pollen">*</span><textarea required={!file} minLength={1} maxLength={60000} value={form.content} onChange={(event) => updateForm('content', event.target.value)} placeholder="Viết các nguyên tắc, câu hỏi gợi mở, giới hạn và cách phản hồi của AI…" className="mt-1.5 min-h-56 w-full resize-y rounded-2xl border border-white/10 bg-black/10 px-3.5 py-3 text-sm leading-relaxed text-calm-paper-white outline-none transition placeholder:text-calm-fog/35 focus:border-calm-lichen/50" /></label>
              <div className="flex flex-col justify-between gap-3 border-t border-white/10 pt-4 text-[11px] text-calm-fog/60 sm:flex-row sm:items-center"><span>Tối đa 2 MB / 60.000 ký tự · Nội dung được lưu theo phiên bản.</span><button type="submit" disabled={submitting} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-calm-lichen px-4 py-3 text-xs font-semibold text-calm-deep-moss transition hover:bg-calm-warm-ivory disabled:cursor-not-allowed disabled:opacity-50">{submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Tạo bản nháp</button></div>
            </form>
          </section>

          <section className="rounded-[30px] border border-white/10 bg-white/[0.035] p-5 shadow-glass sm:p-7">
            <div className="mb-5 flex items-center justify-between gap-3"><div><h2 className="text-lg font-semibold">Các phiên bản kịch bản</h2><p className="mt-1 text-xs text-calm-fog/70">Mỗi mã chỉ có một phiên bản được áp dụng tại một thời điểm.</p></div><button type="button" onClick={() => void loadScripts(true)} disabled={refreshing} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-calm-fog transition hover:bg-white/10 disabled:opacity-50"><RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} /> Làm mới</button></div>
            {loading ? <div className="grid min-h-72 place-items-center text-calm-lichen"><Loader2 className="h-6 w-6 animate-spin" /></div> : scripts.length === 0 ? <div className="grid min-h-72 place-items-center rounded-2xl border border-dashed border-white/10 p-6 text-center"><Leaf className="h-8 w-8 text-calm-lichen/70" /><p className="mt-3 text-sm font-medium">Chưa có kịch bản nào</p><p className="mt-1 max-w-xs text-xs leading-relaxed text-calm-fog/60">Tạo bản nháp đầu tiên ở khung bên trái để bắt đầu xây thư viện kiến thức cho AI.</p></div> : <div className="space-y-3">{scripts.map((script) => { const meta = statusMeta[script.status]; const busy = actionId === script.id; return <article key={script.id} className="rounded-2xl border border-white/10 bg-black/[0.1] p-4 transition hover:border-white/20"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${meta.className}`}>{meta.label}</span><span className="text-[10px] font-mono text-calm-fog/55">{script.scriptKey} · v{script.versionNo}</span></div><h3 className="mt-2 truncate text-sm font-semibold text-calm-paper-white">{script.title}</h3>{script.description && <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-calm-fog/70">{script.description}</p>}<p className="mt-2 text-[10px] text-calm-fog/50">{sourceLabel(script)} · cập nhật {new Date(script.updatedAt).toLocaleString('vi-VN')}</p></div><div className="flex shrink-0 flex-wrap items-center gap-2">{script.status === 'draft' && <button type="button" onClick={() => startEditing(script)} className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 px-2.5 py-2 text-[11px] font-semibold text-calm-fog transition hover:bg-white/10"><FileEdit className="h-3.5 w-3.5" /> Sửa</button>}{script.status === 'draft' && <button type="button" onClick={() => void runAction(script, 'publish')} disabled={busy} className="inline-flex items-center gap-1.5 rounded-xl bg-calm-lichen px-2.5 py-2 text-[11px] font-semibold text-calm-deep-moss transition hover:bg-calm-warm-ivory disabled:opacity-50">{busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Xuất bản</button>}{script.status === 'published' && <span className="inline-flex items-center gap-1.5 rounded-xl border border-calm-lichen/20 bg-calm-lichen/10 px-2.5 py-2 text-[11px] font-semibold text-calm-lichen"><Check className="h-3.5 w-3.5" /> Đang dùng</span>}{script.status !== 'archived' && <button type="button" onClick={() => void runAction(script, 'archive')} disabled={busy} className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 px-2.5 py-2 text-[11px] font-semibold text-calm-fog/70 transition hover:bg-white/10 disabled:opacity-50"><Archive className="h-3.5 w-3.5" /> Lưu trữ</button>}</div></div></article>; })}</div>}
          </section>
        </div>

        {editingId && <section id="script-editor" className="scroll-mt-6 rounded-[30px] border border-calm-lichen/25 bg-calm-lichen/[0.06] p-5 shadow-glass sm:p-7"><div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-calm-lichen">Chỉnh sửa bản nháp</p><h2 className="mt-1 text-lg font-semibold">Nội dung trước khi xuất bản</h2><p className="mt-1 text-xs text-calm-fog/70">Mã kịch bản và số phiên bản không đổi; bản đang áp dụng chỉ thay đổi sau khi bạn bấm Xuất bản.</p></div><button type="button" onClick={() => setEditingId('')} className="rounded-xl border border-white/10 p-2 text-calm-fog hover:bg-white/10" aria-label="Đóng trình sửa"><X className="h-4 w-4" /></button></div><form onSubmit={saveEditing} className="mt-5 space-y-4"><div className="grid gap-4 md:grid-cols-2"><label className="block text-xs font-medium text-calm-fog">Mã kịch bản<input readOnly value={editingForm.scriptKey} className="mt-1.5 w-full rounded-2xl border border-white/10 bg-black/10 px-3.5 py-3 text-sm text-calm-fog/60 outline-none" /></label><label className="block text-xs font-medium text-calm-fog">Tiêu đề<input required minLength={2} maxLength={160} value={editingForm.title} onChange={(event) => setEditingForm((current) => ({ ...current, title: event.target.value }))} className="mt-1.5 w-full rounded-2xl border border-white/10 bg-black/10 px-3.5 py-3 text-sm text-calm-paper-white outline-none focus:border-calm-lichen/50" /></label></div><label className="block text-xs font-medium text-calm-fog">Mô tả ngắn<input maxLength={500} value={editingForm.description} onChange={(event) => setEditingForm((current) => ({ ...current, description: event.target.value }))} className="mt-1.5 w-full rounded-2xl border border-white/10 bg-black/10 px-3.5 py-3 text-sm text-calm-paper-white outline-none focus:border-calm-lichen/50" /></label><label className="block text-xs font-medium text-calm-fog">Nội dung<textarea required minLength={1} maxLength={60000} value={editingForm.content} onChange={(event) => setEditingForm((current) => ({ ...current, content: event.target.value }))} className="mt-1.5 min-h-72 w-full resize-y rounded-2xl border border-white/10 bg-black/10 px-3.5 py-3 text-sm leading-relaxed text-calm-paper-white outline-none focus:border-calm-lichen/50" /></label><div className="flex flex-wrap justify-end gap-2"><button type="button" onClick={() => setEditingId('')} className="rounded-2xl border border-white/10 px-4 py-3 text-xs font-semibold text-calm-fog hover:bg-white/10">Hủy</button><button type="submit" disabled={savingEdit} className="inline-flex items-center gap-2 rounded-2xl bg-calm-lichen px-4 py-3 text-xs font-semibold text-calm-deep-moss hover:bg-calm-warm-ivory disabled:opacity-50">{savingEdit ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Lưu bản nháp</button></div></form></section>}

        <footer className="flex flex-col gap-2 border-t border-white/10 pt-5 text-[11px] leading-relaxed text-calm-fog/55 sm:flex-row sm:items-center sm:justify-between"><span>Quyền biên tập chỉ thay đổi nội dung AI đã được duyệt; không xem được tài khoản hay cuộc trò chuyện riêng tư.</span><span>Giới hạn: 8 kịch bản / 18.000 ký tự được nạp cho mỗi lượt chat.</span></footer>
      </div>
    </div>
  );
}
