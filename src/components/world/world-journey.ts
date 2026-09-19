import type { CityZoneId, WorldJourney, WorldQuest } from './world-types';

export interface WorldJourneySource {
  questionnaireProgress?: number;
  conversations?: number;
  activeExperimentProgress?: number;
  streak?: number;
  profileDimensionCount?: number;
  lifeMapFocuses?: number;
  collectedLetters?: number;
  confirmedInsights?: number;
  confirmedProfiles?: number;
  completedExperiments?: number;
  reflections?: number;
  confirmedLearnings?: number;
  resources?: number;
  arcadeDiscoveries?: number;
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
      'Trò chuyện với Mộc và xác nhận ít nhất một điều thật sự đúng với bạn.',
      'Trò chuyện cùng AI',
      '/app/conversations',
      'Mở khóa Hạt Sáng',
      source.confirmedInsights || 0,
      1,
      '#5eead4'
    ),
    quest(
      'life-map-stars',
      'observatory',
      'Chọn chòm sao dẫn đường',
      'Xác nhận Bản đồ cuộc sống và chọn một vùng cần được chăm sóc trước.',
      'Mở Life Map',
      '/app/life-map',
      'Mở khóa Vương Miện Sao',
      ((source.confirmedProfiles || 0) > 0 ? 1 : 0) + ((source.lifeMapFocuses || 0) > 0 ? 1 : 0),
      2,
      '#fde047'
    ),
    quest(
      'greenhouse-growth',
      'greenhouse',
      'Ươm một thay đổi thật',
      'Hoàn thành một thử nghiệm đời thực để nhà kính nở hoa.',
      'Chăm thử nghiệm',
      '/app/experiments',
      'Mở khóa Hoa Dũng Khí',
      (source.completedExperiments || 0) > 0 ? 100 : source.activeExperimentProgress || 0,
      100,
      '#86efac'
    ),
    quest(
      'lost-letters',
      'lake',
      'Mặt hồ biết nhớ',
      'Viết một phản chiếu và tự xác nhận bài học bạn muốn mang theo.',
      'Viết bên hồ',
      '/app/reflections',
      'Mở khóa Giọt Nước Phản Chiếu',
      ((source.reflections || 0) > 0 ? 1 : 0) + ((source.confirmedLearnings || 0) > 0 ? 1 : 0),
      2,
      '#fbbf24'
    ),
    quest(
      'midnight-discovery',
      'arcade',
      'Chuyến tàu lúc nửa đêm',
      'Hoàn thành một trò chơi khám phá và mang kết quả vào cuộc đối thoại.',
      'Lên chuyến tàu',
      '/app/game',
      'Mở khóa Vé Tàu Nội Tâm',
      source.arcadeDiscoveries || 0,
      1,
      '#fb7185'
    ),
    quest(
      'resource-key',
      'vault',
      'Kho báu đã có sẵn',
      'Ghi nhận ít nhất một nguồn lực thật bạn đang có.',
      'Mở kho nguồn lực',
      '/app/resources',
      'Mở khóa Chìa Khóa Nguồn Lực',
      source.resources || 0,
      1,
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
