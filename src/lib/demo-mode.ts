/**
 * Explicit, in-memory preview mode for deployments and local runs that do not
 * have Supabase configured.
 */

export function isDemoMode() {
  return process.env.DEMO_MODE === 'true';
}

export const DEMO_USER_ID = '00000000-0000-4000-8000-000000000001';

export interface DemoGap {
  id: string;
  dimension: string;
  title: string;
  current_state: string;
  desired_state: string;
  priority: number;
  status: string;
  source_insight_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface DemoExperiment {
  id: string;
  gap_id: string | null;
  title: string;
  hypothesis: string;
  smallest_step: string;
  success_signal: string;
  observation_focus: string[];
  start_date: string;
  target_date: string;
  progress_percent: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface DemoReflection {
  id: string;
  experiment_id: string;
  result: string;
  learning_candidate: string;
  feeling: string;
  next_action: string;
  rating: number;
  created_at: string;
  updated_at: string;
  experiment_title?: string;
}

export interface DemoResource {
  id: string;
  dimension: string;
  resource_type: string;
  name: string;
  description: string | null;
  confidence: number;
  source_insight_id: string | null;
  created_at: string;
  updated_at: string;
}

const today = new Date().toISOString().split('T')[0];

class DemoStore {
  gaps: DemoGap[] = [];
  experiments: DemoExperiment[] = [
    {
      id: 'demo-exp-1',
      gap_id: null,
      title: '15 phút đi dạo buổi sáng không điện thoại',
      hypothesis: 'Tâm trí sẽ thoáng đãng và giảm áp lực công việc đầu ngày.',
      smallest_step: 'Để điện thoại ở bàn, bước ra ngoài 15 phút.',
      success_signal: 'Cảm thấy tỉnh táo và hít thở sâu.',
      observation_focus: ['Mức độ căng thẳng', 'Sự tập trung'],
      progress_percent: 60,
      status: 'active',
      start_date: today,
      target_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];
  reflections: DemoReflection[] = [];
  resources: DemoResource[] = [];
  lifeProfile = {
    current: null,
    draft: null,
    snapshot: {
      schema_version: 1,
      desire: 'Muốn có cuộc sống cân bằng, tự do sáng tạo và đủ đầy.',
      escape: 'Thoát khỏi sự quá tải và áp lực vô hình.',
      life_vision: 'Sống trọn vẹn, phát triển công việc ý nghĩa bên gia đình.',
      dimensions: {
        my_life: { summary: 'Áp lực công việc và thiếu thời gian cho bản thân.', current_state: 'Đang chịu áp lực cao', desired_state: 'Cân bằng và an yên hơn', evidence_ids: [] },
        what_matters: { summary: 'Sự tự do, gia đình và sức khỏe tinh thần.', current_state: 'Chưa dành đủ ưu tiên', desired_state: 'Đặt sức khỏe lên hàng đầu', evidence_ids: [] },
        my_ideal_day: { summary: 'Buổi sáng thảnh thơi, tập trung làm việc sâu 4 giờ.', current_state: 'Bị gián đoạn liên tục', desired_state: 'Làm việc có nhịp điệu', evidence_ids: [] },
        what_it_takes: { summary: 'Kỷ luật từ chối những việc không quan trọng.', current_state: 'Dễ nhận thêm việc', desired_state: 'Rõ ràng ranh giới', evidence_ids: [] },
        my_trade_offs: { summary: 'Bớt thời gian lướt mạng để ngủ đủ giấc.', current_state: 'Thức khuya', desired_state: 'Ngủ trước 23h', evidence_ids: [] },
        the_question: { summary: 'Làm sao để vừa đạt kết quả cao vừa bình an?', current_state: 'Đang tìm câu trả lời', desired_state: 'Có hệ thống rõ ràng', evidence_ids: [] },
      },
    },
    insights: [],
  };

  createGap(data: Partial<DemoGap>): DemoGap {
    const now = new Date().toISOString();
    const gap: DemoGap = {
      id: `demo-gap-${Date.now()}`,
      dimension: data.dimension || 'other',
      title: data.title || 'Mục tiêu mới',
      current_state: data.current_state || '',
      desired_state: data.desired_state || '',
      priority: data.priority ?? 1,
      status: 'open',
      source_insight_id: null,
      created_at: now,
      updated_at: now,
    };
    this.gaps.unshift(gap);
    return gap;
  }

  updateGap(id: string, patch: Partial<DemoGap>): DemoGap | null {
    const index = this.gaps.findIndex((g) => g.id === id);
    if (index === -1) return null;
    this.gaps[index] = { ...this.gaps[index], ...patch, updated_at: new Date().toISOString() };
    return this.gaps[index];
  }

  deleteGap(id: string): boolean {
    const prevLen = this.gaps.length;
    this.gaps = this.gaps.filter((g) => g.id !== id);
    return this.gaps.length < prevLen;
  }

  createExperiment(data: Partial<DemoExperiment>): DemoExperiment {
    const now = new Date().toISOString();
    const exp: DemoExperiment = {
      id: `demo-exp-${Date.now()}`,
      gap_id: data.gap_id || null,
      title: data.title || 'Thử nghiệm mới',
      hypothesis: data.hypothesis || '',
      smallest_step: data.smallest_step || '',
      success_signal: data.success_signal || '',
      observation_focus: data.observation_focus || [],
      start_date: data.start_date || today,
      target_date: data.target_date || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      progress_percent: data.progress_percent ?? 0,
      status: data.status || 'active',
      created_at: now,
      updated_at: now,
    };
    this.experiments.unshift(exp);
    return exp;
  }

  updateExperiment(id: string, patch: Partial<DemoExperiment>): DemoExperiment | null {
    const index = this.experiments.findIndex((e) => e.id === id);
    if (index === -1) return null;
    this.experiments[index] = { ...this.experiments[index], ...patch, updated_at: new Date().toISOString() };
    return this.experiments[index];
  }

  deleteExperiment(id: string): boolean {
    const prevLen = this.experiments.length;
    this.experiments = this.experiments.filter((e) => e.id !== id);
    return this.experiments.length < prevLen;
  }

  createReflection(data: Partial<DemoReflection>): DemoReflection {
    const now = new Date().toISOString();
    const experiment = this.experiments.find((e) => e.id === data.experiment_id) || this.experiments[0];
    if (experiment && experiment.status !== 'completed') {
      experiment.status = 'completed';
      experiment.progress_percent = 100;
      experiment.updated_at = now;
    }
    const reflection: DemoReflection = {
      id: `demo-ref-${Date.now()}`,
      experiment_id: data.experiment_id || experiment?.id || 'demo-exp-1',
      result: data.result || '',
      learning_candidate: data.learning_candidate || '',
      feeling: data.feeling || '',
      next_action: data.next_action || '',
      rating: data.rating ?? 5,
      created_at: now,
      updated_at: now,
      experiment_title: experiment?.title || 'Thử nghiệm',
    };
    const existingIndex = this.reflections.findIndex((r) => r.experiment_id === reflection.experiment_id);
    if (existingIndex >= 0) {
      this.reflections[existingIndex] = reflection;
    } else {
      this.reflections.unshift(reflection);
    }
    return reflection;
  }

  createResource(data: Partial<DemoResource>): DemoResource {
    const now = new Date().toISOString();
    const resource: DemoResource = {
      id: `demo-res-${Date.now()}`,
      dimension: data.dimension || 'other',
      resource_type: data.resource_type || 'other',
      name: data.name || 'Tài nguyên mới',
      description: data.description || null,
      confidence: data.confidence ?? 1,
      source_insight_id: null,
      created_at: now,
      updated_at: now,
    };
    this.resources.unshift(resource);
    return resource;
  }

  updateResource(id: string, patch: Partial<DemoResource>): DemoResource | null {
    const index = this.resources.findIndex((r) => r.id === id);
    if (index === -1) return null;
    this.resources[index] = { ...this.resources[index], ...patch, updated_at: new Date().toISOString() };
    return this.resources[index];
  }

  deleteResource(id: string): boolean {
    const prevLen = this.resources.length;
    this.resources = this.resources.filter((r) => r.id !== id);
    return this.resources.length < prevLen;
  }
}

// Global demo store instance across API routes in dev process
const globalForDemo = globalThis as unknown as { __demoStore?: DemoStore };
export const demoStore = globalForDemo.__demoStore ?? (globalForDemo.__demoStore = new DemoStore());
