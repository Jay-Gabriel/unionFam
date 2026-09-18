import type { CityZoneId } from './world-types';

export type CityActivityKind = 'home' | 'overview' | 'questions' | 'chat' | 'life-map' | 'experiments' | 'reflections' | 'arcade' | 'resources';

export interface CityChapter {
  chapter: number;
  title: string;
  npc: string;
  npcRole: string;
  opening: string;
  objective: string;
  reward: string;
  activity: CityActivityKind;
  icon: string;
}

export const CITY_STORY: Record<CityZoneId, CityChapter> = {
  home: {
    chapter: 0,
    title: 'Nơi ánh sáng luôn chờ bạn',
    npc: 'Mây',
    npcRole: 'Người bạn đồng hành',
    opening: 'Đây là nơi hành trình của bạn được giữ lại. Mỗi lần trở về, ngôi nhà sẽ nhớ bạn đã đi tới đâu và điều gì đang chờ được chăm sóc.',
    objective: 'Nhận quà trở lại, xem nhiệm vụ hôm nay và tiếp tục đúng nơi bạn đã dừng.',
    reward: '25 Hạt Sáng mỗi ngày',
    activity: 'home',
    icon: '🏡',
  },
  square: {
    chapter: 0,
    title: 'Thành phố đánh mất bình minh',
    npc: 'Mây',
    npcRole: 'Người giữ Quảng Trường',
    opening: 'Một màn sương mang tên Quên Lãng đã làm sáu khu phố mất ánh sáng. Thành phố không cần một anh hùng hoàn hảo — chỉ cần một người dám thành thật với chính mình.',
    objective: 'Khôi phục năng lượng cho các địa danh bằng những lựa chọn thật trong cuộc sống của bạn.',
    reward: 'La bàn Hạt Sáng',
    activity: 'overview',
    icon: '☁️',
  },
  academy: {
    chapter: 1,
    title: 'Những ô cửa chưa sáng',
    npc: 'An',
    npcRole: 'Thủ thư Ban Mai',
    opening: 'Mỗi ô cửa trong học viện giữ một câu hỏi mà cư dân từng né tránh. Khi bạn trả lời bằng điều thật lòng, một căn phòng sẽ lại sáng đèn.',
    objective: 'Đi qua bộ câu hỏi khám phá để gọi tên cuộc đời bạn muốn sống.',
    reward: 'Đèn Ban Mai',
    activity: 'questions',
    icon: '📚',
  },
  sanctuary: {
    chapter: 2,
    title: 'Tiếng nói dưới tán cây',
    npc: 'Mộc',
    npcRole: 'Người lắng nghe',
    opening: 'Khu vườn chỉ nở hoa khi một điều chưa từng được nói thành lời cuối cùng được lắng nghe mà không phán xét.',
    objective: 'Trò chuyện với Mộc và nhìn rõ điều đang chiếm nhiều tâm trí nhất hôm nay.',
    reward: 'Hạt Lắng Nghe',
    activity: 'chat',
    icon: '🌿',
  },
  observatory: {
    chapter: 3,
    title: 'Chòm sao đời sống',
    npc: 'Astra',
    npcRole: 'Nhà quan sát',
    opening: 'Bầu trời của mỗi người có nhiều chòm sao: công việc, sức khỏe, tiền bạc, tình yêu và ý nghĩa. Một vùng tối không có nghĩa cả bầu trời đã tắt.',
    objective: 'Đọc bản đồ cuộc sống và chọn một vùng cần được chăm sóc trước.',
    reward: 'Mảnh Kính Sao',
    activity: 'life-map',
    icon: '🔭',
  },
  greenhouse: {
    chapter: 4,
    title: 'Hạt giống của hành động',
    npc: 'Nia',
    npcRole: 'Người chăm nhà kính',
    opening: 'Ý định chỉ trở thành cây khi được gieo xuống đời thật. Ở đây, mỗi thử nghiệm nhỏ sẽ mọc thành một loài hoa riêng.',
    objective: 'Tạo một thử nghiệm bảy ngày đủ nhỏ để bạn thật sự bắt đầu.',
    reward: 'Hoa Dũng Khí',
    activity: 'experiments',
    icon: '🌱',
  },
  lake: {
    chapter: 5,
    title: 'Mặt hồ biết nhớ',
    npc: 'Noa',
    npcRole: 'Người giữ ký ức',
    opening: 'Mặt hồ không hỏi bạn đã làm đúng hay sai. Nó chỉ giữ lại điều đã xảy ra, cảm xúc còn sót lại và bài học bạn muốn mang theo.',
    objective: 'Ghi lại một trải nghiệm thật và rút ra bước tiếp theo.',
    reward: 'Giọt Nước Phản Chiếu',
    activity: 'reflections',
    icon: '💧',
  },
  arcade: {
    chapter: 6,
    title: 'Chuyến tàu lúc nửa đêm',
    npc: 'Kaito',
    npcRole: 'Trưởng ga 00:00',
    opening: 'Những lựa chọn trong trò chơi không chấm điểm bạn. Chúng hé lộ lực kéo, nỗi sợ và điều bạn đang âm thầm bảo vệ.',
    objective: 'Hoàn thành một trò chơi và mang kết quả vào cuộc đối thoại trong thành phố.',
    reward: 'Vé Tàu Nội Tâm',
    activity: 'arcade',
    icon: '🎮',
  },
  vault: {
    chapter: 7,
    title: 'Kho báu đã có sẵn',
    npc: 'Kim',
    npcRole: 'Người giữ nguồn lực',
    opening: 'Kho báu không chỉ là tiền. Một kỹ năng, một giờ rảnh, một người sẵn lòng giúp đỡ cũng có thể thay đổi cả hành trình.',
    objective: 'Ghi nhận những nguồn lực bạn đang có để biến kế hoạch thành điều khả thi.',
    reward: 'Chìa Khóa Nguồn Lực',
    activity: 'resources',
    icon: '🗝️',
  },
};

export const CITY_MAIN_STORY = {
  title: 'Hành Trình Tìm Lại Bình Minh',
  role: 'Người Mang Hạt Sáng',
  premise: 'Khôi phục Thành Phố Mây bằng cách hiểu mình, chọn một hướng và biến lựa chọn đó thành hành động ngoài đời thật.',
};
