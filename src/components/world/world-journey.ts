import type { CityZoneId, WorldJourney, WorldQuest } from './world-types';

export interface WorldJourneySource {
  questionnaireProgress?: number;
  conversations?: number;
  activeExperimentProgress?: number;
  streak?: number;
  profileDimensionCount?: number;
  lifeMapFocuses?: number;
  collectedLetters?: number;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
}

function quest(
  id: string,
  zoneId: CityZoneId,
  title: string,
  description: string,
  actionLabel: string,
  targetHref: string,
  reward: string,
  progress: number,
  total: number,
  accentColor: string
): WorldQuest {
  const safeProgress = clamp(progress, 0, total);
  const progressPercent = total > 0 ? Math.round((safeProgress / total) * 100) : 0;
  return {
    id,
    zoneId,
    title,
    description,
    actionLabel,
    targetHref,
    reward,
    progress: safeProgress,
    total,
    progressPercent,
    completed: progressPercent >= 100,
    accentColor,
  };
}

export function buildWorldJourney(source: WorldJourneySource, loading = false): WorldJourney {
  const quests = [
    quest(
      'awakening-path',
      'academy',
      'Con đường thức tỉnh',
      'Hoàn thành bộ câu hỏi để các ô cửa Học Viện Ban Mai sáng đèn.',
      'Tiếp tục bộ câu hỏi',
      '/app/questions',
      'Mở khóa Đèn Ban Mai',
      source.questionnaireProgress || 0,
      100,
      '#34d399'
    ),
    quest(
      'listening-fire',
      'sanctuary',
      'Giữ lửa lắng nghe',
      'Trò chuyện cùng Life Lab ba lần để Vườn Lắng Nghe bừng sáng.',
      'Trò chuyện cùng AI',
      '/app/conversations',
      'Mở khóa Hạt Sáng',
      source.conversations || 0,
      3,
      '#5eead4'
    ),
    quest(
      'life-map-stars',
      'observatory',
      'Chọn chòm sao dẫn đường',
      'Chọn một vùng cuộc sống cần được chăm sóc trước tại Đài Quan Sát.',
      'Mở Life Map',
      '/app/life-map',
      'Mở khóa Vương Miện Sao',
      (source.lifeMapFocuses || 0) > 0 || (source.profileDimensionCount || 0) > 0 ? 1 : 0,
      1,
      '#fde047'
    ),
    quest(
      'greenhouse-growth',
      'greenhouse',
      'Ươm một thay đổi thật',
      'Tiến độ thử nghiệm đời thực sẽ làm nhà kính nở hoa.',
      'Chăm thử nghiệm',
      '/app/experiments',
      'Mở khóa Hoa Dũng Khí',
      source.activeExperimentProgress || 0,
      100,
      '#86efac'
    ),
    quest(
      'lost-letters',
      'lake',
      'Những lá thư chưa gửi',
      'Tìm bốn mảnh ký ức quanh thành phố và mang câu hỏi của chúng vào cuộc sống.',
      'Tiếp tục khám phá',
      '/app/world',
      'Mở khóa Dấu Ấn Thành Phố',
      source.collectedLetters || 0,
      4,
      '#fbbf24'
    ),
  ];

  const completedQuests = quests.filter((item) => item.completed).length;
  const energy = Math.round(quests.reduce((sum, item) => sum + item.progressPercent, 0) / quests.length);

  return {
    level: Math.min(5, 1 + Math.floor(energy / 25)),
    energy,
    completedQuests,
    totalQuests: quests.length,
    streak: Math.max(0, Math.round(source.streak || 0)),
    loading,
    quests,
  };
}
