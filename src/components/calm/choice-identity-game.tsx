'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Heart,
  Compass,
  Shield,
  Search,
  ArrowRight,
  RotateCcw,
  Volume2,
  VolumeX,
  X,
  MessageCircleHeart,
  CheckCircle2,
  HelpCircle,
  TrendingUp,
  Scale,
  type LucideIcon,
} from 'lucide-react';

export type ForceKey = 'autonomy' | 'connection' | 'stability' | 'exploration';

export interface ForceScore {
  key: ForceKey;
  label: string;
  sublabel: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: LucideIcon;
  score: number;
  percentage: number;
}

export type AgeGroup = '18-24' | '25-35';

export interface ChoiceOption {
  id: string;
  text: string;
  forces: Partial<Record<ForceKey, number>>;
  meaning: string;
  soundFreq: number;
}

export interface ChoiceScenario {
  id: number;
  title: string;
  story: string;
  options: ChoiceOption[];
}

// 6 Situations for Group 18-24
const SCENARIOS_18_24: ChoiceScenario[] = [
  {
    id: 1,
    title: 'Tình huống 1/6: Lời mời công việc đầu tiên',
    story: 'Một lời mời nghề nghiệp đến sớm hơn bạn nghĩ. Bạn nhận được một công việc ổn định. Nó không đúng lĩnh vực bạn tò mò nhất, nhưng lương và lộ trình thăng tiến rất rõ ràng.',
    options: [
      {
        id: '18_1_a',
        text: 'Nhận việc để có một nền tảng tài chính và kinh nghiệm vững vàng.',
        forces: { stability: 2 },
        meaning: 'Sự vững vàng và an toàn tài chính đang là ưu tiên hàng đầu của bạn.',
        soundFreq: 396,
      },
      {
        id: '18_1_b',
        text: 'Xin thêm thời gian hoặc từ chối để thử sức với hướng đi mình tò mò.',
        forces: { exploration: 2 },
        meaning: 'Nhu cầu khám phá và trải nghiệm những khả năng mới đang rất mạnh mẽ.',
        soundFreq: 528,
      },
      {
        id: '18_1_c',
        text: 'Trao đổi, tham khảo gia đình rồi tự mình đưa ra quyết định cuối cùng.',
        forces: { connection: 1, autonomy: 1 },
        meaning: 'Bạn muốn vừa giữ sự gắn kết gia đình, vừa bảo vệ quyền tự quyết của mình.',
        soundFreq: 432,
      },
    ],
  },
  {
    id: 2,
    title: 'Tình huống 2/6: Kỳ vọng từ gia đình & Định hướng riêng',
    story: 'Gia đình rất mong muốn bạn theo đuổi một con đường quen thuộc, an toàn; nhưng trong lòng bạn đang ấp ủ một hướng đi khác biệt.',
    options: [
      {
        id: '18_2_a',
        text: 'Thẳng thắn chia sẻ con đường riêng và nhận toàn bộ trách nhiệm về mình.',
        forces: { autonomy: 2 },
        meaning: 'Quyền tự quyết cách sống là giá trị bạn kiên quyết bảo vệ.',
        soundFreq: 432,
      },
      {
        id: '18_2_b',
        text: 'Lắng nghe và chọn theo định hướng gia đình trước để người thân yên tâm.',
        forces: { connection: 2 },
        meaning: 'Sự an tâm của người thân và gắn kết tình cảm có sức nặng lớn với bạn.',
        soundFreq: 396,
      },
      {
        id: '18_2_c',
        text: 'Tìm cách vừa giữ công việc an tâm cho người nhà, vừa bí mật thử nghiệm hướng đi mới.',
        forces: { stability: 1, exploration: 1 },
        meaning: 'Bạn tìm kiếm sự cân bằng giữa nền tảng an toàn và ngọn lửa khám phá.',
        soundFreq: 528,
      },
    ],
  },
  {
    id: 3,
    title: 'Tình huống 3/6: Một buổi tối hoàn toàn rảnh',
    story: 'Bạn kết thúc một tuần bận rộn và có trọn vẹn một buổi tối không vướng bận bất kỳ lịch trình hay nghĩa vụ nào.',
    options: [
      {
        id: '18_3_a',
        text: 'Dành trọn thời gian bên bạn bè, người thân hoặc người bạn quan tâm.',
        forces: { connection: 2 },
        meaning: 'Sự hiện diện bên những mối quan hệ thân thiết giúp bạn tái tạo năng lượng.',
        soundFreq: 432,
      },
      {
        id: '18_3_b',
        text: 'Tập trung học một kỹ năng mới, đọc tài liệu hoặc làm dự án cá nhân ấp ủ.',
        forces: { exploration: 1, autonomy: 1 },
        meaning: 'Bạn tận dụng tự do để học hỏi và mở rộng chân trời của bản thân.',
        soundFreq: 528,
      },
      {
        id: '18_3_c',
        text: 'Nghỉ ngơi tĩnh dưỡng, dọn dẹp lại không gian sống và sắp xếp kế hoạch tài chính.',
        forces: { stability: 2 },
        meaning: 'Sự trật tự, ổn định nội tại và nền tảng cá nhân đem lại bình yên cho bạn.',
        soundFreq: 396,
      },
    ],
  },
  {
    id: 4,
    title: 'Tình huống 4/6: Nhìn thấy bạn bè bứt phá sớm',
    story: 'Lướt mạng xã hội, bạn thấy vài người bạn đồng trang lứa đã đạt được thành tựu lớn, mua sắm hoặc kiếm tiền vượt trội.',
    options: [
      {
        id: '18_4_a',
        text: 'Tập trung củng cố kiến thức chuyên môn, tích lũy nền tảng tài chính của riêng mình.',
        forces: { stability: 2 },
        meaning: 'Bạn tin vào việc xây móng chắc chắn thay vì chạy theo sự hào nhoáng nhất thời.',
        soundFreq: 396,
      },
      {
        id: '18_4_b',
        text: 'Tìm kiếm ngay các cơ hội mới, dự án mới để thử sức bứt phá giới hạn.',
        forces: { exploration: 2 },
        meaning: 'Cảm giác tò mò và khao khát dấn thân thôi thúc bạn tìm cơ hội mới.',
        soundFreq: 528,
      },
      {
        id: '18_4_c',
        text: 'Tự nhủ mỗi người có một múi giờ riêng và kiên định đi theo chuẩn mực của bản thân.',
        forces: { autonomy: 2 },
        meaning: 'Bạn tự chủ bảo vệ định nghĩa thành công và nhịp sống của chính mình.',
        soundFreq: 432,
      },
    ],
  },
  {
    id: 5,
    title: 'Tình huống 5/6: Cơ hội đi xa hoặc chuyển đến môi trường mới',
    story: 'Bạn nhận được lời mời tham gia một dự án tại thành phố khác trong 6 tháng, môi trường hoàn toàn xa lạ.',
    options: [
      {
        id: '18_5_a',
        text: 'Sẵn sàng xách balo lên đường để trải nghiệm và mở mang tầm mắt.',
        forces: { exploration: 2 },
        meaning: 'Bạn muốn xem mình có thể phát triển ra sao khi bước vào vùng đất mới.',
        soundFreq: 528,
      },
      {
        id: '18_5_b',
        text: 'Ở lại gần gia đình, bạn bè và mạng lưới quen thuộc để duy trì sự gắn kết.',
        forces: { connection: 2 },
        meaning: 'Gốc rễ tình cảm và sự hiện diện bên người thân là điểm tựa quý giá.',
        soundFreq: 432,
      },
      {
        id: '18_5_c',
        text: 'Chỉ nhận lời nếu cơ hội đó mang lại cho bạn toàn quyền quyết định lộ trình tương lai.',
        forces: { autonomy: 1, stability: 1 },
        meaning: 'Bạn cân nhắc kỹ giữa quyền tự quyết và giá trị tích lũy thực tế.',
        soundFreq: 396,
      },
    ],
  },
  {
    id: 6,
    title: 'Tình huống 6/6: Điều cần bảo vệ nhất trong 12 tháng tới',
    story: 'Đứng trước ngưỡng cửa một năm mới, nếu chỉ được chọn một điều tối quan trọng để bảo vệ, bạn sẽ chọn gì?',
    options: [
      {
        id: '18_6_a',
        text: 'Quyền tự do lựa chọn cách sống và con đường nghề nghiệp theo ý mình.',
        forces: { autonomy: 2 },
        meaning: 'Quyền tự quyết là chiếc la bàn định hướng cho bạn trong năm tới.',
        soundFreq: 432,
      },
      {
        id: '18_6_b',
        text: 'Sự an toàn tài chính, khoản tiết kiệm và một nền tảng kỹ năng vững chãi.',
        forces: { stability: 2 },
        meaning: 'Sự vững vàng là bàn đạp để bạn tự tin bước vào mọi thử thách.',
        soundFreq: 396,
      },
      {
        id: '18_6_c',
        text: 'Mối quan hệ sâu sắc với những người thực sự thấu hiểu và quan trọng.',
        forces: { connection: 2 },
        meaning: 'Sự gắn kết chân thành là bến đỗ bình yên nhất cho tâm hồn bạn.',
        soundFreq: 528,
      },
    ],
  },
];

// 6 Situations for Group 25-35
const SCENARIOS_25_35: ChoiceScenario[] = [
  {
    id: 1,
    title: 'Tình huống 1/6: Cơ hội đổi việc khi đang mệt mỏi',
    story: 'Một lời mời đổi việc đến đúng lúc bạn đang cảm thấy mệt. Công việc mới có mức lương cao hơn đáng kể, nhưng áp lực và thời gian cam kết có vẻ khắt khe hơn.',
    options: [
      {
        id: '35_1_a',
        text: 'Chọn mức thu nhập tốt hơn để củng cố nền tảng tài chính cho bản thân và gia đình.',
        forces: { stability: 2 },
        meaning: 'Bạn ưu tiên bảo vệ sự vững vàng tài chính để chăm lo cho cuộc sống.',
        soundFreq: 396,
      },
      {
        id: '35_1_b',
        text: 'Hỏi kỹ về quyền tự chủ thời gian và không gian sống trước khi nhận lời.',
        forces: { autonomy: 2 },
        meaning: 'Bạn bảo vệ quyền làm chủ nhịp sống và sức khỏe tinh thần của mình.',
        soundFreq: 432,
      },
      {
        id: '35_1_c',
        text: 'Tạm hoãn quyết định để nghỉ ngơi và làm rõ điều mình thực sự khao khát lúc này.',
        forces: { exploration: 1, connection: 1 },
        meaning: 'Bạn không muốn ra quyết định vội vàng khi chưa hiểu rõ bản thân.',
        soundFreq: 528,
      },
    ],
  },
  {
    id: 2,
    title: 'Tình huống 2/6: Cân bằng giữa gia đình và sự nghiệp',
    story: 'Công việc mở ra cơ hội thăng chức lớn nhưng đòi hỏi bạn thường xuyên phải đi công tác và tăng ca buổi tối.',
    options: [
      {
        id: '35_2_a',
        text: 'Ưu tiên giữ trọn vẹn sự hiện diện và thời gian chất lượng cho người thân.',
        forces: { connection: 2 },
        meaning: 'Gắn kết gia đình và các mối quan hệ quý giá là ưu tiên hàng đầu.',
        soundFreq: 432,
      },
      {
        id: '35_2_b',
        text: 'Tận dụng giai đoạn này để tối đa hóa thu nhập và vị thế sự nghiệp vững chắc.',
        forces: { stability: 2 },
        meaning: 'Xây dựng nền móng kinh tế dài hạn cho tương lai là mục tiêu thiết thực.',
        soundFreq: 396,
      },
      {
        id: '35_2_c',
        text: 'Đàm phán một cơ chế làm việc linh hoạt để tự mình làm chủ cả công việc lẫn cuộc sống.',
        forces: { autonomy: 2 },
        meaning: 'Bạn tìm kiếm quyền tự quyết và không muốn bị trói buộc một chiều.',
        soundFreq: 528,
      },
    ],
  },
  {
    id: 3,
    title: 'Tình huống 3/6: Một buổi tối hoàn toàn rảnh rỗi',
    story: 'Sau chuỗi ngày quay cuồng với trách nhiệm, bạn bất ngờ có một khoảng thời gian hoàn toàn thuộc về riêng mình.',
    options: [
      {
        id: '35_3_a',
        text: 'Nấu một bữa ăn ấm cúng, trò chuyện sâu sắc cùng gia đình hoặc người thương.',
        forces: { connection: 2 },
        meaning: 'Sự hiện diện ấm áp bên người thân là cách bạn nuôi dưỡng tâm hồn.',
        soundFreq: 432,
      },
      {
        id: '35_3_b',
        text: 'Dành thời gian nuôi dưỡng dự án cá nhân, kinh doanh nhỏ hoặc viết lách.',
        forces: { autonomy: 1, exploration: 1 },
        meaning: 'Bạn khao khát tạo dựng một điều gì đó do chính mình toàn quyền sở hữu.',
        soundFreq: 528,
      },
      {
        id: '35_3_c',
        text: 'Nghỉ ngơi phục hồi thể lực, rà soát lại quỹ dự phòng và kế hoạch sống.',
        forces: { stability: 2 },
        meaning: 'Cảm giác an tâm và kiểm soát được nền tảng cuộc sống giúp bạn tái tạo năng lượng.',
        soundFreq: 396,
      },
    ],
  },
  {
    id: 4,
    title: 'Tình huống 4/6: Cảm giác chững lại trong công việc quen thuộc',
    story: 'Công việc hiện tại của bạn đã rất ổn định và quen thuộc, nhưng bạn bắt đầu cảm thấy thiếu động lực đổi mới.',
    options: [
      {
        id: '35_4_a',
        text: 'Bắt đầu học hỏi một lĩnh vực mới hoặc thử nghiệm một hướng rẽ tò mò ngoài giờ.',
        forces: { exploration: 2 },
        meaning: 'Bạn muốn mở ra những tiềm năng mới thay vì để bản thân bị mòn mỏi.',
        soundFreq: 528,
      },
      {
        id: '35_4_b',
        text: 'Tiếp tục duy trì vì công việc này mang lại nguồn thu an toàn và sự ổn định.',
        forces: { stability: 2 },
        meaning: 'Bạn trân trọng sự an toàn tài chính và trách nhiệm bảo đảm cuộc sống.',
        soundFreq: 396,
      },
      {
        id: '35_4_c',
        text: 'Tái cấu trúc lại nhịp làm việc để giành thêm nhiều quyền tự chủ cho bản thân.',
        forces: { autonomy: 2 },
        meaning: 'Bạn muốn tự cầm lái cách mình làm việc hơn là bị cuốn theo guồng máy.',
        soundFreq: 432,
      },
    ],
  },
  {
    id: 5,
    title: 'Tình huống 5/6: Dự án riêng hay tiếp tục vùng an toàn',
    story: 'Bạn có một ý tưởng ấp ủ từ lâu nhưng việc dấn thân hoàn toàn sẽ mang lại nhiều rủi ro cho gia đình.',
    options: [
      {
        id: '35_5_a',
        text: 'Xây dựng thử nghiệm nhỏ song song với công việc chính, đi từng bước chắc chắn.',
        forces: { autonomy: 1, stability: 1 },
        meaning: 'Bạn chọn tự do một cách có trách nhiệm: mở quyền chọn mà không phá vỡ nền tảng.',
        soundFreq: 432,
      },
      {
        id: '35_5_b',
        text: 'Dành toàn bộ năng lượng chăm lo cho tổ ấm và những người quan trọng nhất.',
        forces: { connection: 2 },
        meaning: 'Gắn kết và hạnh phúc gia đình là chiếc neo vững chắc nhất đời bạn.',
        soundFreq: 396,
      },
      {
        id: '35_5_c',
        text: 'Dành một khoản ngân sách thử nghiệm để dấn thân khám phá điều mới mẻ.',
        forces: { exploration: 2 },
        meaning: 'Bạn tin rằng cuộc sống cần những phép thử để không phải nuối tiếc.',
        soundFreq: 528,
      },
    ],
  },
  {
    id: 6,
    title: 'Tình huống 6/6: Điều cần bảo vệ nhất trong 12 tháng tới',
    story: 'Đứng trước nhiều ngã rẽ và trách nhiệm lớn, đâu là giá trị bạn quyết tâm giữ gìn nhất trong năm tới?',
    options: [
      {
        id: '35_6_a',
        text: 'Quyền tự quyết cách sống và làm việc phù hợp với hệ giá trị của mình.',
        forces: { autonomy: 2 },
        meaning: 'Quyền tự chủ là điều kiện tiên quyết để bạn cảm thấy thực sự đang sống.',
        soundFreq: 432,
      },
      {
        id: '35_6_b',
        text: 'Sự an toàn tài chính, khoản dự phòng vững vàng và sức khỏe dài hạn.',
        forces: { stability: 2 },
        meaning: 'Nền tảng vững chắc là chỗ dựa an tâm cho chính bạn và những người thân yêu.',
        soundFreq: 396,
      },
      {
        id: '35_6_c',
        text: 'Sự hiện diện ý nghĩa và thời gian chất lượng bên người thân yêu.',
        forces: { connection: 2 },
        meaning: 'Sự gắn kết chân thành là tài sản quý giá nhất mà bạn không muốn đánh mất.',
        soundFreq: 528,
      },
    ],
  },
];

const FORCE_METADATA: Record<
  ForceKey,
  {
    label: string;
    sublabel: string;
    color: string;
    bgColor: string;
    borderColor: string;
    icon: LucideIcon;
  }
> = {
  autonomy: {
    label: 'Quyền tự quyết',
    sublabel: 'Tôi có được tự chọn cách sống và làm việc không?',
    color: 'text-amber-300',
    bgColor: 'bg-amber-400/20',
    borderColor: 'border-amber-400/40',
    icon: Compass,
  },
  exploration: {
    label: 'Khám phá',
    sublabel: 'Tôi có đang mở ra những khả năng mới cho đời mình?',
    color: 'text-emerald-300',
    bgColor: 'bg-emerald-400/20',
    borderColor: 'border-emerald-400/40',
    icon: Search,
  },
  stability: {
    label: 'Sự vững vàng',
    sublabel: 'Tôi có đủ an toàn tài chính, kỹ năng và nền tảng không?',
    color: 'text-sky-300',
    bgColor: 'bg-sky-400/20',
    borderColor: 'border-sky-400/40',
    icon: Shield,
  },
  connection: {
    label: 'Gắn kết',
    sublabel: 'Tôi có thời gian và sự hiện diện cho người quan trọng?',
    color: 'text-rose-300',
    bgColor: 'bg-rose-400/20',
    borderColor: 'border-rose-400/40',
    icon: Heart,
  },
};

// Trade-off reflections based on Top 2 forces
function getTradeOffInsight(top1: ForceKey, top2: ForceKey): { tension: string; nextQuestion: string } {
  const pair = [top1, top2].sort().join('_');

  switch (pair) {
    case 'autonomy_stability':
      return {
        tension:
          'Bạn muốn có nhiều quyền tự quyết hơn, nhưng sự vững vàng cũng rất quan trọng với bạn. Có thể điều bạn cần không phải "nghỉ việc ngay", mà là tìm một cách có thêm quyền chọn mà không đánh mất nền tảng đang có.',
        nextQuestion: 'Bạn cần xây điều gì để có thêm quyền chọn mà không đánh mất sự an tâm?',
      };
    case 'connection_stability':
      return {
        tension:
          'Bạn thường chọn gắn kết và sự vững vàng. Có thể bạn đang xây một cuộc sống an toàn cho người mình yêu quý. Nhưng liệu trong đó còn đủ không gian cho điều bạn muốn riêng cho mình không?',
        nextQuestion: 'Bạn đang xây sự ổn định cho ai, và bạn có muốn cuộc sống đó trông như thế nào?',
      };
    case 'autonomy_connection':
      return {
        tension:
          'Bạn muốn tự chọn cuộc sống của mình, nhưng cũng muốn giữ người thân ở trong lựa chọn đó. Làm sao để quyền tự chủ của bạn hòa hợp với sự hiện diện bên những người quan trọng?',
        nextQuestion: 'Bạn muốn tự chọn cuộc sống của mình, nhưng cũng muốn giữ ai ở trong lựa chọn đó?',
      };
    case 'exploration_stability':
      return {
        tension:
          'Bạn có nhu cầu mở ra những chân trời mới nhưng vẫn cần sự chắc chắn. Bạn có thể thử điều mình tò mò theo cách từng bước nhỏ mà vẫn giữ được nền tảng an toàn.',
        nextQuestion: 'Bạn có thể thử điều mình tò mò theo cách nào mà vẫn giữ được nền tảng an tâm?',
      };
    case 'autonomy_exploration':
      return {
        tension:
          'Bạn không chỉ muốn một công việc "ổn". Bạn muốn biết mình có thể trở thành ai khi được thử những điều mới và tự cầm lái cuộc đời mình.',
        nextQuestion: 'Có điều gì bạn tò mò muốn thử, dù chưa biết kết quả?',
      };
    case 'connection_exploration':
      return {
        tension:
          'Bạn khao khát khám phá những khả năng mới nhưng luôn trân trọng sự đồng hành và kết nối với người quan trọng.',
        nextQuestion: 'Bạn muốn sự hiện diện của mình có ý nghĩa hơn với ai khi bắt đầu hành trình mới?',
      };
    default:
      return {
        tension:
          'Đây không phải con người cố định của bạn — mà là những điều đang có sức nặng và kéo bạn theo nhiều hướng khác nhau lúc này.',
        nextQuestion: 'Điều gì đang thực sự có ý nghĩa nhất với bạn ở giai đoạn này?',
      };
  }
}

// Audio synthesizer for warm ambient feedback
function playGentleChord(freq: number) {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;
    const freqs = [freq, freq * 1.25, freq * 1.5]; // Major triad

    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.08 / (i + 1), now + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 1.3);
    });
  } catch {
    // Audio context not allowed without interaction
  }
}

interface ChoiceIdentityGameProps {
  onClose?: () => void;
  isModal?: boolean;
}

export function ChoiceIdentityGame({ onClose, isModal = false }: ChoiceIdentityGameProps) {
  const router = useRouter();

  const [step, setStep] = useState<'intro' | 'select_age' | 'scenarios' | 'result'>('intro');
  const [ageGroup, setAgeGroup] = useState<AgeGroup | null>(null);
  const [currentScenarioIndex, setCurrentScenarioIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [feedbackMeaning, setFeedbackMeaning] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  // Scores accumulator
  const [forcePoints, setForcePoints] = useState<Record<ForceKey, number>>({
    autonomy: 0,
    connection: 0,
    stability: 0,
    exploration: 0,
  });

  const scenarios = ageGroup === '25-35' ? SCENARIOS_25_35 : SCENARIOS_18_24;
  const currentScenario = scenarios[currentScenarioIndex];

  // Handle option select
  const handleSelectOption = (option: ChoiceOption) => {
    if (selectedOptionId) return; // Prevent double click
    setSelectedOptionId(option.id);
    setFeedbackMeaning(option.meaning);

    if (!isMuted) {
      playGentleChord(option.soundFreq || 432);
    }

    // Accumulate forces
    setForcePoints((prev) => {
      const next = { ...prev };
      Object.entries(option.forces).forEach(([k, v]) => {
        const key = k as ForceKey;
        next[key] = (next[key] || 0) + (v || 0);
      });
      return next;
    });

    // Auto progress after short pause or user can tap continue
    setTimeout(() => {
      if (currentScenarioIndex < scenarios.length - 1) {
        setCurrentScenarioIndex((prev) => prev + 1);
        setSelectedOptionId(null);
        setFeedbackMeaning(null);
      } else {
        setStep('result');
      }
    }, 1400);
  };

  // Calculate percentage and rankings
  const totalPoints = Object.values(forcePoints).reduce((a, b) => a + b, 0) || 1;
  const forceList: ForceScore[] = (Object.keys(FORCE_METADATA) as ForceKey[]).map((key) => {
    const meta = FORCE_METADATA[key];
    const score = forcePoints[key] || 0;
    const percentage = Math.round((score / totalPoints) * 100);
    return {
      key,
      label: meta.label,
      sublabel: meta.sublabel,
      color: meta.color,
      bgColor: meta.bgColor,
      borderColor: meta.borderColor,
      icon: meta.icon,
      score,
      percentage,
    };
  });

  // Sort descending
  forceList.sort((a, b) => b.score - a.score);
  const top1 = forceList[0] || forceList[0];
  const top2 = forceList[1] || forceList[1];
  const tradeOff = getTradeOffInsight(top1.key, top2.key);

  const handleStartLifeLabDialogue = useCallback(() => {
    if (typeof window === 'undefined') return;

    // Prepare tailored Life Lab opening and user quick pills
    const personalizedPrompt = `Trong game Căn Cước Lựa Chọn, bạn thường chọn những điều giúp mình ${top1.label.toLowerCase()} hơn, đồng thời ${top2.label.toLowerCase()} cũng rất quan trọng với bạn. Bạn có thấy điều đó đúng với mình lúc này không?`;
    
    // Store game context for seamless onboarding
    window.sessionStorage.setItem('lifelab_preloaded_prompt', personalizedPrompt);
    window.sessionStorage.setItem(
      'lifelab_game_context',
      JSON.stringify({
        gameType: 'choice_identity',
        ageGroup,
        top1: top1.key,
        top1Label: top1.label,
        top2: top2.key,
        top2Label: top2.label,
        nextQuestion: tradeOff.nextQuestion,
      })
    );

    if (onClose) onClose();
    router.push(
      `/app/conversations?fromGame=choice_identity&top1=${top1.key}&top2=${top2.key}&ageGroup=${ageGroup || '25-35'}&prompt=${encodeURIComponent(personalizedPrompt)}`
    );
  }, [top1, top2, tradeOff.nextQuestion, ageGroup, onClose, router]);

  return (
    <div className="relative w-full max-w-2xl mx-auto overflow-hidden rounded-[32px] border border-calm-lichen/30 bg-gradient-to-b from-[#1b261d]/95 via-[#141e16]/95 to-[#0d140e]/95 p-5 sm:p-8 backdrop-blur-2xl text-calm-paper-white shadow-[0_25px_60px_rgba(0,0,0,0.5)]">
      {/* Ambient background bloom */}
      <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-calm-pollen/15 blur-3xl" />
      <div className="pointer-events-none absolute -left-20 -bottom-20 h-72 w-72 rounded-full bg-calm-lichen/15 blur-3xl" />

      {/* Top Header Bar */}
      <div className="relative z-10 flex items-center justify-between pb-4 border-b border-white/10 mb-6">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-calm-lichen/20 text-calm-lichen border border-calm-lichen/30 shadow-[0_0_12px_rgba(185,198,165,0.2)]">
            <Compass size={18} />
          </span>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">Căn Cước Lựa Chọn</h2>
            <p className="text-[10px] text-calm-fog/80">Nhìn rõ điều bạn đang ưu tiên & bảo vệ</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsMuted(!isMuted)}
            className="grid h-8 w-8 place-items-center rounded-full border border-white/15 bg-white/5 text-calm-fog hover:text-white transition"
            title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
          >
            {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>
          {isModal && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="grid h-8 w-8 place-items-center rounded-full border border-white/15 bg-white/5 text-calm-fog hover:text-white transition"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* MAIN GAME CONTAINER */}
      <div className="relative z-10 min-h-[420px] flex flex-col justify-between">
        <AnimatePresence mode="wait">
          {/* STEP 1: INTRO */}
          {step === 'intro' && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6 text-center py-6 sm:py-8"
            >
              <div className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-tr from-calm-lichen/20 via-calm-pollen/20 to-emerald-500/20 border border-calm-lichen/40 shadow-[0_0_30px_rgba(185,198,165,0.25)]">
                <Scale size={36} className="text-calm-pollen animate-pulse" />
              </div>

              <div className="space-y-3 max-w-lg mx-auto">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-calm-pollen/30 bg-calm-pollen/10 px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider text-calm-pollen">
                  <Sparkles size={12} /> Khám Phá Lực Kéo Đời Sống
                </span>
                <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-white leading-tight">
                  Căn cước lựa chọn của bạn là gì?
                </h3>
                <p className="text-sm sm:text-[15px] text-calm-fog/90 leading-relaxed">
                  Đi qua 6 tình huống đời thường để nhìn rõ điều bạn đang muốn giữ lại, theo đuổi hoặc sẵn sàng đánh đổi.
                  <strong className="text-calm-warm-ivory block mt-1">Không có đáp án đúng hay sai.</strong>
                </p>
              </div>

              <div className="pt-4">
                <button
                  type="button"
                  onClick={() => setStep('select_age')}
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-calm-lichen via-emerald-400 to-calm-pollen px-8 py-3.5 text-sm font-bold text-black shadow-[0_0_25px_rgba(185,198,165,0.4)] hover:scale-105 active:scale-95 transition-all"
                >
                  <span>Bắt đầu trải nghiệm</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: SELECT AGE GROUP */}
          {step === 'select_age' && (
            <motion.div
              key="select_age"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6 py-4"
            >
              <div className="text-center space-y-2">
                <span className="text-[11px] font-semibold text-calm-pollen uppercase tracking-widest">
                  Bước 1 — Chọn bối cảnh
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-white">Hiện bạn đang đứng ở đâu?</h3>
                <p className="text-xs sm:text-sm text-calm-fog/80 max-w-md mx-auto">
                  Cùng một câu hỏi về tiền hay công việc sẽ mang ý nghĩa rất khác nhau tùy theo chặng đường bạn đang đi.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 pt-2">
                {/* 18-24 */}
                <button
                  type="button"
                  onClick={() => {
                    setAgeGroup('18-24');
                    setCurrentScenarioIndex(0);
                    setStep('scenarios');
                  }}
                  className="group flex flex-col justify-between text-left p-5 rounded-2xl border border-white/15 bg-white/[0.04] hover:bg-white/[0.08] hover:border-calm-lichen/50 transition-all hover:scale-[1.02] active:scale-95 shadow-md"
                >
                  <div className="space-y-2">
                    <span className="inline-block rounded-lg bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 text-[11px] font-bold text-emerald-300">
                      18–24 tuổi
                    </span>
                    <h4 className="text-base font-bold text-white group-hover:text-calm-lichen transition">
                      Đang bắt đầu
                    </h4>
                    <p className="text-xs text-calm-fog/85 leading-relaxed">
                      &quot;Tôi đang chọn hướng đi hoặc mới bước vào đời sống tự chủ.&quot;
                    </p>
                  </div>
                  <div className="mt-4 flex items-center gap-1 text-[11px] font-semibold text-calm-lichen">
                    <span>Chọn bối cảnh này</span>
                    <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>

                {/* 25-35 */}
                <button
                  type="button"
                  onClick={() => {
                    setAgeGroup('25-35');
                    setCurrentScenarioIndex(0);
                    setStep('scenarios');
                  }}
                  className="group flex flex-col justify-between text-left p-5 rounded-2xl border border-white/15 bg-white/[0.04] hover:bg-white/[0.08] hover:border-calm-pollen/50 transition-all hover:scale-[1.02] active:scale-95 shadow-md"
                >
                  <div className="space-y-2">
                    <span className="inline-block rounded-lg bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 text-[11px] font-bold text-amber-300">
                      25–35 tuổi
                    </span>
                    <h4 className="text-base font-bold text-white group-hover:text-calm-pollen transition">
                      Đang nhìn lại
                    </h4>
                    <p className="text-xs text-calm-fog/85 leading-relaxed">
                      &quot;Tôi đã đi làm, nhưng muốn hiểu lại hướng sống và giá trị của mình.&quot;
                    </p>
                  </div>
                  <div className="mt-4 flex items-center gap-1 text-[11px] font-semibold text-calm-pollen">
                    <span>Chọn bối cảnh này</span>
                    <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3 & 4: 6 SCENARIOS */}
          {step === 'scenarios' && currentScenario && (
            <motion.div
              key={`scenario-${currentScenarioIndex}`}
              initial={{ opacity: 0, x: 25 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -25 }}
              className="space-y-5 py-2"
            >
              {/* Progress bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-medium text-calm-fog">
                  <span className="text-calm-pollen font-semibold">{currentScenario.title}</span>
                  <span>{currentScenarioIndex + 1} / {scenarios.length}</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-calm-lichen via-emerald-400 to-calm-pollen"
                    initial={{ width: `${((currentScenarioIndex) / scenarios.length) * 100}%` }}
                    animate={{ width: `${((currentScenarioIndex + 1) / scenarios.length) * 100}%` }}
                    transition={{ duration: 0.4 }}
                  />
                </div>
              </div>

              {/* Situation story box */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:p-5 backdrop-blur-md">
                <p className="text-sm sm:text-[15.5px] leading-relaxed text-calm-paper-white font-medium">
                  {currentScenario.story}
                </p>
              </div>

              {/* 3 Options */}
              <div className="space-y-2.5">
                {currentScenario.options.map((option, idx) => {
                  const isSelected = selectedOptionId === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      disabled={Boolean(selectedOptionId)}
                      onClick={() => handleSelectOption(option)}
                      className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 flex items-start gap-3.5 ${
                        isSelected
                          ? 'border-calm-pollen bg-calm-pollen/20 shadow-[0_0_20px_rgba(238,213,150,0.3)] scale-[1.01]'
                          : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.07] hover:border-white/20 active:scale-[0.99]'
                      } ${selectedOptionId && !isSelected ? 'opacity-40' : ''}`}
                    >
                      <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold ${
                        isSelected ? 'bg-calm-pollen text-black' : 'bg-white/10 text-calm-fog'
                      }`}>
                        {idx + 1}
                      </span>
                      <p className="text-xs sm:text-sm text-calm-paper-white leading-relaxed font-normal">
                        &quot;{option.text}&quot;
                      </p>
                    </button>
                  );
                })}
              </div>

              {/* Short subtle reflection feedback */}
              {feedbackMeaning && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border border-calm-lichen/30 bg-calm-lichen/10 px-4 py-2.5 text-center text-xs text-calm-lichen"
                >
                  <p className="font-medium">{feedbackMeaning}</p>
                  <span className="text-[10px] text-calm-fog/70 mt-0.5 block">
                    Không có lựa chọn đúng hay sai. Điều này giúp Life Lab nhìn nhận điều bạn đang hướng tới.
                  </span>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* STEP 5 & 6 & 7: RESULT & 4 FORCES & TRADE-OFF REFLECTION */}
          {step === 'result' && (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6 py-2"
            >
              {/* Header result */}
              <div className="text-center space-y-2">
                <span className="inline-flex items-center gap-1 rounded-full border border-calm-lichen/40 bg-calm-lichen/15 px-3 py-0.5 text-[10px] font-bold uppercase tracking-widest text-calm-lichen">
                  <CheckCircle2 size={12} /> Bản Phác Thảo Căn Cước Lựa Chọn
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-white">
                  Có vẻ ở giai đoạn này, bạn đang muốn tự cầm lái nhiều hơn
                </h3>
                <p className="text-xs sm:text-[13px] text-calm-fog/90 max-w-lg mx-auto leading-relaxed">
                  Trong những lựa chọn vừa rồi, <strong className="text-calm-pollen">{top1.label}</strong> xuất hiện rõ nét nhất.
                  Đồng thời <strong className="text-calm-lichen">{top2.label}</strong> cũng là một lực kéo quan trọng.
                  Đây không phải nhãn dán cố định — mà là điều đang có trọng lượng với bạn lúc này.
                </p>
              </div>

              {/* 4 Forces Horizontal Progress Bars */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5 space-y-3.5 backdrop-blur-md">
                <h4 className="text-xs font-bold uppercase tracking-wider text-calm-fog/70 flex items-center gap-1.5">
                  <TrendingUp size={13} /> 4 Lực kéo đời sống hiện tại
                </h4>

                <div className="space-y-3">
                  {forceList.map((f, i) => {
                    const Icon = f.icon;
                    return (
                      <div key={f.key} className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <div className="flex items-center gap-2">
                            <span className={`grid h-6 w-6 place-items-center rounded-lg ${f.bgColor} ${f.color} border ${f.borderColor}`}>
                              <Icon size={13} />
                            </span>
                            <span className="text-white font-medium">{f.label}</span>
                            {i === 0 && (
                              <span className="rounded-full bg-calm-pollen/20 px-2 py-0.2 text-[9px] font-bold text-calm-pollen border border-calm-pollen/30">
                                Nổi bật nhất
                              </span>
                            )}
                          </div>
                          <span className={`${f.color} font-bold`}>{f.percentage}%</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                          <motion.div
                            className={`h-full rounded-full ${i === 0 ? 'bg-gradient-to-r from-calm-pollen to-amber-400' : 'bg-gradient-to-r from-calm-lichen to-emerald-400'}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.max(f.percentage, 10)}%` }}
                            transition={{ duration: 0.8, delay: i * 0.1 }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Step 6: Trade-off / Contradiction Reflection Card */}
              <div className="rounded-2xl border border-calm-pollen/30 bg-gradient-to-r from-[#243327]/90 to-[#19241b]/90 p-4 sm:p-5 backdrop-blur-md shadow-md space-y-2">
                <div className="flex items-center gap-2 text-calm-pollen text-xs font-bold uppercase tracking-wide">
                  <Scale size={14} /> Phản chiếu Trade-off & Mâu thuẫn
                </div>
                <p className="text-xs sm:text-sm text-calm-paper-white/95 leading-relaxed font-normal">
                  {tradeOff.tension}
                </p>
              </div>

              {/* Step 7: Next Question & Life Lab CTA */}
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4 sm:p-5 space-y-3 text-center">
                <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                  Câu hỏi tiếp theo mở ra Life Lab
                </p>
                <p className="text-sm sm:text-base font-semibold text-white italic">
                  &quot;{tradeOff.nextQuestion}&quot;
                </p>
                <p className="text-[11px] text-calm-fog/80">
                  Game là cánh cửa dẫn vào Life Lab để bắt đầu cuộc trò chuyện sâu sắc cùng AI.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setStep('select_age');
                    setCurrentScenarioIndex(0);
                    setSelectedOptionId(null);
                    setFeedbackMeaning(null);
                    setForcePoints({ autonomy: 0, connection: 0, stability: 0, exploration: 0 });
                  }}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-4 py-3 text-xs font-semibold text-calm-fog hover:text-white hover:bg-white/10 transition"
                >
                  <RotateCcw size={13} />
                  <span>Chọn lại từ đầu</span>
                </button>

                <button
                  type="button"
                  onClick={handleStartLifeLabDialogue}
                  className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-calm-lichen via-emerald-400 to-calm-pollen px-6 py-3.5 text-sm font-bold text-black shadow-[0_0_25px_rgba(185,198,165,0.4)] hover:scale-105 active:scale-95 transition-all"
                >
                  <MessageCircleHeart size={16} />
                  <span>Khám phá cùng Life Lab →</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export function ChoiceIdentityGameModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl my-auto animate-in fade-in zoom-in-95 duration-200">
        <ChoiceIdentityGame onClose={onClose} isModal={true} />
      </div>
    </div>
  );
}
