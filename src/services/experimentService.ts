export interface LifeExperiment {
  id: string;
  title: string;
  description: string;
  source: 'ai_session' | 'manual';
  days: boolean[];
  energyLevel: number;
  externalExpectation: string;
  internalNeed: string;
  createdAt: string;
  updatedAt: string;
}

const LOCAL_EXPERIMENT_KEY = 'unionfam_active_experiment';

const DEFAULT_EXPERIMENT: LifeExperiment = {
  id: 'default_exp',
  title: 'Thực Nghiệm 3 Ngày: Giữ Nhịp Thở & Ranh Giới Cá Nhân',
  description: 'Dành ra 10 phút tĩnh lặng vào cuối ngày, ghi nhận những áp lực đã nhận và trả lại không gian cho nhu cầu thực sự của bản thân.',
  source: 'manual',
  days: [false, false, false, false, false, false, false],
  energyLevel: 6.0,
  externalExpectation: 'Phải luôn nhanh chóng phản hồi mọi kỳ vọng và gồng mình chứng minh bản thân.',
  internalNeed: 'Cần sự thong thả, được bảo toàn năng lượng và làm việc từ sự sáng rõ.',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

/**
 * Lấy Thử Nghiệm 7 Ngày đang kích hoạt
 */
export function getActiveExperiment(): LifeExperiment {
  try {
    const raw = localStorage.getItem(LOCAL_EXPERIMENT_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.days)) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Error reading active experiment:', e);
  }
  return DEFAULT_EXPERIMENT;
}

/**
 * Lưu toàn bộ thông tin Thử Nghiệm vào LocalStorage
 */
export function saveActiveExperiment(experiment: LifeExperiment): void {
  try {
    const payload = {
      ...experiment,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(LOCAL_EXPERIMENT_KEY, JSON.stringify(payload));
  } catch (e) {
    console.warn('Error saving experiment:', e);
  }
}

/**
 * Tạo mới một Thử Nghiệm từ kết quả phiên đối thoại ở Cổng 1
 */
export function createExperimentFromSession(
  title: string,
  description?: string,
  gap?: { external?: string; internal?: string }
): LifeExperiment {
  const current = getActiveExperiment();
  const newExperiment: LifeExperiment = {
    id: Date.now().toString(),
    title: title.trim() || 'Hành Động Nhỏ Cho Nhịp Sống Mới',
    description:
      description?.trim() ||
      'Thực hiện một điều chỉnh nhỏ trong 1–3 ngày tới để quan sát cảm giác và sự chuyển biến sau phiên đối thoại.',
    source: 'ai_session',
    days: [false, false, false, false, false, false, false],
    energyLevel: current.energyLevel || 6.0,
    externalExpectation:
      gap?.external?.trim() ||
      'Áp lực phải làm tròn mọi vai và gồng mình trước đòi hỏi bên ngoài.',
    internalNeed:
      gap?.internal?.trim() ||
      'Nhu cầu được tôn trọng nhịp điệu riêng và giữ gìn sự bình thản bên trong.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  saveActiveExperiment(newExperiment);
  return newExperiment;
}

/**
 * Đánh dấu điểm danh ngày i (0 đến 6)
 */
export function toggleExperimentDay(dayIndex: number): LifeExperiment {
  const exp = getActiveExperiment();
  const nextDays = [...exp.days];
  nextDays[dayIndex] = !nextDays[dayIndex];
  const updated: LifeExperiment = {
    ...exp,
    days: nextDays,
  };
  saveActiveExperiment(updated);
  return updated;
}

/**
 * Cập nhật điểm thang đo năng lượng sinh khí (Q6 Energy Scale 1 - 10)
 */
export function updateExperimentEnergy(level: number): LifeExperiment {
  const exp = getActiveExperiment();
  const updated: LifeExperiment = {
    ...exp,
    energyLevel: Math.min(Math.max(level, 1), 10),
  };
  saveActiveExperiment(updated);
  return updated;
}

/**
 * Cập nhật nội dung The Gap (Khoảng Cách Thực Tế)
 */
export function updateExperimentGap(external: string, internal: string): LifeExperiment {
  const exp = getActiveExperiment();
  const updated: LifeExperiment = {
    ...exp,
    externalExpectation: external,
    internalNeed: internal,
  };
  saveActiveExperiment(updated);
  return updated;
}

/**
 * Tính toán trạng thái mở khóa động cho 5 Viên Ngọc Clarity ở Cổng 3
 */
export function getClarityGemsProgress(): {
  gem1: boolean; // Tỉnh thức (Có ít nhất 1 phiên chat hoặc tin nhắn ở Cổng 1)
  gem2: boolean; // Nhận diện khoảng cách (Đã có bài thử nghiệm Cổng 2)
  gem3: boolean; // Vùng đệm an tâm (Đã check-in ít nhất 3 ngày)
  gem4: boolean; // Ý nghĩa thực sự (Đã lưu ít nhất 1 đúc kết vào Cổng 3)
  gem5: boolean; // Tự do lựa chọn (Đã hoàn thành 7 ngày hoặc thực hiện 1 lần Kintsugi)
} {
  let hasMessages = false;
  let hasMemories = false;
  let hasKintsugi = false;

  try {
    const rawMsg = localStorage.getItem('unionfam_messages_cache');
    if (rawMsg) {
      const msgs = JSON.parse(rawMsg);
      if (Array.isArray(msgs) && msgs.length > 1) hasMessages = true;
    }

    const rawMem = localStorage.getItem('unionfam_memories_cache');
    if (rawMem) {
      const mems = JSON.parse(rawMem);
      if (Array.isArray(mems) && mems.length > 0) {
        hasMemories = true;
        hasKintsugi = mems.some((m: { kintsugiRepaired?: boolean }) => Boolean(m.kintsugiRepaired));
      }
    }
  } catch {}

  const exp = getActiveExperiment();
  const checkedDaysCount = exp.days.filter(Boolean).length;

  return {
    gem1: hasMessages,
    gem2: Boolean(exp && exp.title),
    gem3: checkedDaysCount >= 3,
    gem4: hasMemories,
    gem5: checkedDaysCount >= 7 || hasKintsugi,
  };
}
