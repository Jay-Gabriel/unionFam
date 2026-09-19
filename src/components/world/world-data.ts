import type { CityZone } from './world-types';

export const CITY_SIZE = 70;

export const CITY_ZONES: CityZone[] = [
  {
    id: 'home', name: 'Ngôi Nhà Bình Minh', subtitle: 'Không gian riêng của hành trình',
    description: 'Trở về mỗi ngày để nhận lời nhắn từ Mây, xem tiến độ và chăm sóc thế giới của bạn.', color: '#f9a8d4',
    position: [-45, 0, -15], radius: 9, actionLabel: 'Trở về nhà', targetHref: '/app/world',
  },
  {
    id: 'square', name: 'Quảng Trường Mây', subtitle: 'Trung tâm hành trình hôm nay',
    description: 'Lõi năng lượng phản chiếu toàn bộ tiến độ Life Lab của bạn.', color: '#a78bfa',
    position: [-15, 0, -15], radius: 8, actionLabel: 'Mở tổng quan', targetHref: '/app',
  },
  {
    id: 'academy', name: 'Học Viện Ban Mai', subtitle: 'Hiểu mình qua những câu hỏi đúng',
    description: 'Mỗi câu trả lời thắp sáng thêm một ô cửa của học viện.', color: '#34d399',
    position: [-15, 0, 45], radius: 10, actionLabel: 'Tiếp tục câu hỏi', targetHref: '/app/questions',
  },
  {
    id: 'sanctuary', name: 'Vườn Lắng Nghe', subtitle: 'Không gian trò chuyện cùng AI',
    description: 'Một khu vườn yên tĩnh để gọi tên điều bạn đang thật sự cảm thấy.', color: '#5eead4',
    position: [-45, 0, 15], radius: 10, actionLabel: 'Trò chuyện cùng AI', targetHref: '/app/conversations',
    aiPromptStarter: 'Mình đang đứng ở Vườn Lắng Nghe. Hãy giúp mình nhìn rõ điều đang chiếm nhiều tâm trí nhất hôm nay.',
  },
  {
    id: 'observatory', name: 'Đài Quan Sát Cuộc Đời', subtitle: 'Nhìn toàn cảnh các chiều cuộc sống',
    description: 'Quan sát công việc, sức khỏe, tài chính và những mối quan hệ từ trên cao.', color: '#fde047',
    position: [45, 0, 15], radius: 10, actionLabel: 'Mở Life Map', targetHref: '/app/life-map',
  },
  {
    id: 'greenhouse', name: 'Nhà Kính Dũng Khí', subtitle: 'Biến suy nghĩ thành thử nghiệm nhỏ',
    description: 'Những thay đổi ngoài đời thật sẽ làm khu nhà kính nở hoa.', color: '#86efac',
    position: [-45, 0, -45], radius: 10, actionLabel: 'Chăm thử nghiệm', targetHref: '/app/experiments',
  },
  {
    id: 'lake', name: 'Bến Hồ Phản Chiếu', subtitle: 'Nhìn lại điều đã đi qua',
    description: 'Bến gỗ bên hồ dành cho ghi nhận, suy ngẫm và những bài học mới.', color: '#38bdf8',
    position: [0, 0, -59], radius: 9, actionLabel: 'Viết ghi nhận', targetHref: '/app/reflections',
  },
  {
    id: 'arcade', name: 'Ga Trò Chơi 00:00', subtitle: 'Khám phá bản thân bằng lựa chọn',
    description: 'Các trò chơi ngắn biến quyết định vô thức thành tín hiệu để hiểu mình.', color: '#fb7185',
    position: [45, 0, -45], radius: 10, actionLabel: 'Vào khu trò chơi', targetHref: '/app/game',
  },
  {
    id: 'vault', name: 'Ngân Hàng Nguồn Lực', subtitle: 'Tài chính và nguồn lực cá nhân',
    description: 'Sắp xếp những gì bạn đang có để xây một kế hoạch vững vàng hơn.', color: '#fbbf24',
    position: [45, 0, -15], radius: 9, actionLabel: 'Xem nguồn lực', targetHref: '/app/resources',
  },
];

export const MEMORY_SHARDS: Array<{ id: string; position: [number, number, number]; color: string }> = [
  { id: 'memory-1', position: [-25, 1.2, 9], color: '#fbbf24' },
  { id: 'memory-2', position: [25, 1.2, 42], color: '#a78bfa' },
  { id: 'memory-3', position: [42, 1.2, -7], color: '#38bdf8' },
  { id: 'memory-4', position: [-39, 1.2, -31], color: '#34d399' },
];

export const CITY_COLLIDERS = [
  // Major Quest Buildings (precise bounding footprints)
  { x: -45, z: -15, radius: 4.5 }, // Dawn Home
  { x: -45, z: 15, radius: 4.2 },  // Sanctuary
  { x: -45, z: -45, radius: 4.8 }, // Greenhouse
  { x: -15, z: 45, radius: 4.5 },  // Academy
  { x: 45, z: 15, radius: 4.5 },   // Observatory
  { x: 45, z: -15, radius: 4.5 },  // Resource Bank
  { x: 45, z: -45, radius: 4.8 },  // Arcade
  
  // Shophouses and City Block interiors
  { x: -15, z: -15, radius: 3.5 }, // Central Plaza Feature
  { x: 15, z: -15, radius: 3.5 },  // Cafe Terrace
  { x: 15, z: 45, radius: 3.8 },   // Market Stalls
  { x: -40, z: 40, radius: 4.2 },  // Northwest Block Building
  { x: 40, z: 40, radius: 4.2 },   // Northeast Block Building
  { x: -40, z: -16, radius: 4.0 }, // West Shophouse
  { x: 40, z: -16, radius: 4.0 },  // East Shophouse
];

export function isWorldPointWalkable(x: number, z: number): boolean {
  // Outer island boundary
  const dist = Math.hypot(x, z);
  if (dist > CITY_SIZE - 2) return false;

  // Deep lake boundary (past the wooden boardwalk at z = -61)
  if (z < -61.5) return false;

  // Check all landmark and shophouse colliders
  for (let i = 0; i < CITY_COLLIDERS.length; i++) {
    const c = CITY_COLLIDERS[i];
    const dx = x - c.x;
    const dz = z - c.z;
    if (dx * dx + dz * dz < c.radius * c.radius) {
      return false;
    }
  }

  return true;
}

