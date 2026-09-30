import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { TopBar } from './components/ui/TopBar';
import { LivingMap3D } from './components/3d/LivingMap3D';
import { ConsultingEnginePanel } from './components/ui/ConsultingEnginePanel';
import { BottomBar } from './components/ui/BottomBar';
import { LoginModal } from './components/ui/LoginModal';
import { InteractiveHandsOnTour, HandsOnQuest } from './components/ui/InteractiveHandsOnTour';
import { GuideTourModal } from './components/ui/GuideTourModal';
import { LifeExperimentModal } from './components/ui/LifeExperimentModal';
import { MemoryCenterModal } from './components/ui/MemoryCenterModal';
import { RepairModal } from './components/ui/RepairModal';
import { TopicSelectorModal } from './components/ui/TopicSelectorModal';
import { GeminiKeyModal } from './components/ui/GeminiKeyModal';
import { askGeminiLifeLab } from './services/geminiService';
import { INITIAL_MAP_NODES, INITIAL_MEMORIES, INITIAL_CLARITY_SCORE } from './data/initialState';
import { MapNode, ChatMessage, MemoryItem, ClarityScoreState } from './types';
import { MapPin, MessageSquare, Sparkles, Rocket, Brain } from 'lucide-react';

export const App: React.FC = () => {
  // User Session State
  const [user, setUser] = useState<{ name: string; email?: string; avatar?: string; focusArea: string; provider: 'google' | 'guest' } | null>(null);
  const [isLoginOpen, setIsLoginOpen] = useState(true);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);

  // Gemini API Key State
  const [geminiApiKey, setGeminiApiKey] = useState<string>(() => {
    return (import.meta.env.VITE_GEMINI_API_KEY as string) || localStorage.getItem('life_lab_gemini_api_key') || '';
  });

  // Active step in the side panel ('chat' vs 'experiment')
  const [activeStep, setActiveStep] = useState<'chat' | 'experiment'>('chat');

  // Official UnionFam Blueprint 7.0 Experiment State
  const [currentExperiment, setCurrentExperiment] = useState({
    title: '30 Phút Tự Quyết Mỗi Tối (No Distraction)',
    desc: 'Mỗi buổi tối dành 30 phút không điện thoại, ghi lại 3 quyết định bạn tự đưa ra trong ngày mà không bị chi phối bởi ý kiến bên ngoài.',
    days: [true, true, true, false, false, false, false],
    energy: 8.5,
    insight: '"Tiền bạc là phương tiện phục vụ cuộc đời, không phải mục tiêu tự thân."',
    gap: 'Kỳ vọng ngoài: Bận rộn liên tục ➔ Nhu cầu trong: Bình an, có thời gian cho bản thân.',
  });

  // Real-Time Hands-On Quests
  const [isHandsOnActive, setIsHandsOnActive] = useState(false);
  const [currentQuestIndex, setCurrentQuestIndex] = useState(0);
  const [quests, setQuests] = useState<HandsOnQuest[]>([
    {
      id: 0,
      title: 'Khám phá Bản đồ 3D',
      instruction: 'Hãy nhấp chuột vào một địa danh trên The Living Map (ví dụ: Work, Money, Relationships hoặc Desired Difference).',
      hint: 'Giữ chuột trái để xoay 3D 360°, nhấp vào thẻ địa danh để hướng ngọn hải đăng tới đó.',
      isCompleted: false,
      icon: <MapPin className="w-4 h-4 text-emerald-400" />,
    },
    {
      id: 1,
      title: 'Đối thoại với AI Coaching',
      instruction: 'Hãy chọn một câu hỏi mẫu (Q1, Q2, Q5) hoặc gõ tin nhắn vào ô chat bên phải.',
      hint: 'Bạn có thể chia sẻ về áp lực sự nghiệp, tiền bạc hoặc cảm giác mắc kẹt hiện tại.',
      isCompleted: false,
      icon: <MessageSquare className="w-4 h-4 text-sky-400" />,
    },
    {
      id: 2,
      title: 'Xác thực Insight (Verify)',
      instruction: 'Hãy bấm nút [ Right on ] dưới khung chat để xác nhận AI đã hiểu đúng và xem pháo hoa + thăng cấp Clarity Score!',
      hint: 'Nếu AI hiểu chưa đúng, bạn có thể bấm [ ✦ Repair ] để tự sửa lại định nghĩa.',
      isCompleted: false,
      icon: <Sparkles className="w-4 h-4 text-amber-400" />,
    },
    {
      id: 3,
      title: 'Thực hành Thử nghiệm 7 Ngày',
      instruction: 'Chuyển sang tab [ 🧪 2. Thử Nghiệm 7 Ngày ] và tích thử vào các ngày hoàn thành hoặc chỉnh thanh Năng lượng.',
      hint: 'Thử nghiệm giúp bạn kiểm chứng giả thuyết bằng hành vi nhỏ và tự rút ra bài học.',
      isCompleted: false,
      icon: <Rocket className="w-4 h-4 text-amber-300" />,
    },
    {
      id: 4,
      title: 'Kiểm tra Memory Center',
      instruction: 'Hãy bấm nút [ Memory Center ] ở thanh công cụ dưới cùng để kiểm tra các insight và thử nghiệm đã được bảo lưu an toàn.',
      hint: 'Bạn luôn có quyền xem, sửa, xóa hoặc thu hồi bất kỳ ký ức nào theo kịch bản V7.',
      isCompleted: false,
      icon: <Brain className="w-4 h-4 text-purple-400" />,
    },
  ]);

  // Map State
  const [nodes, setNodes] = useState<MapNode[]>(INITIAL_MAP_NODES);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('current_focus');
  const [currentFocusId, setCurrentFocusId] = useState<string>('current_focus');

  // Conversation History
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg_1',
      sender: 'coach',
      text: 'Chào bạn! Tôi là Life Lab AI — người bạn đồng hành phản chiếu cuộc đời (UnionFam Blueprint V7.0). Hãy tưởng tượng bạn đang sống một cuộc đời do chính mình lựa chọn: Trong một ngày bình thường, bạn muốn dành thời gian và năng lượng của mình cho những điều gì?',
      timestamp: new Date(),
    },
  ]);

  const [clarityScore, setClarityScore] = useState<ClarityScoreState>(INITIAL_CLARITY_SCORE);
  const [memories, setMemories] = useState<MemoryItem[]>(INITIAL_MEMORIES);
  const [noMemoryMode, setNoMemoryMode] = useState(false);
  const [isAiThinking, setIsAiThinking] = useState(false);

  // Modals state
  const [isMemoryOpen, setIsMemoryOpen] = useState(false);
  const [isRepairOpen, setIsRepairOpen] = useState(false);
  const [isExperimentOpen, setIsExperimentOpen] = useState(false);
  const [isTopicOpen, setIsTopicOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const topicTitle = 'Điều gì đang khiến tôi băn khoăn?';

  // Save Gemini Key
  const handleSaveGeminiKey = (key: string) => {
    setGeminiApiKey(key);
    localStorage.setItem('life_lab_gemini_api_key', key);
    if (key) {
      const notifyMsg: ChatMessage = {
        id: `msg_k_${Date.now()}`,
        sender: 'coach',
        text: '✦ Đã kích hoạt kết nối trực tiếp với Google Gemini 2.5 Flash AI! Giờ đây mọi đối thoại của bạn sẽ được phản chiếu thông minh theo thời gian thực.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, notifyMsg]);
    }
  };

  // Advance Hands-On Quest Helper
  const completeQuestStep = (stepId: number) => {
    setQuests((prev) =>
      prev.map((q) => (q.id === stepId ? { ...q, isCompleted: true } : q))
    );
    if (stepId === currentQuestIndex && stepId < quests.length - 1) {
      setCurrentQuestIndex(stepId + 1);
    }
  };

  // Toggle 7-Day Experiment Checkbox
  const handleToggleExperimentDay = (index: number) => {
    setCurrentExperiment((prev) => {
      const newDays = [...prev.days];
      newDays[index] = !newDays[index];
      return { ...prev, days: newDays };
    });
    completeQuestStep(3);
  };

  const handleChangeEnergy = (energy: number) => {
    setCurrentExperiment((prev) => ({ ...prev, energy }));
    completeQuestStep(3);
  };

  // Handle Login & Start Hands-On Tour
  const handleLoginSuccess = (userData: { name: string; email?: string; avatar?: string; focusArea: string; provider: 'google' | 'guest' }) => {
    setUser(userData);
    setIsLoginOpen(false);

    const welcomeMsg: ChatMessage = {
      id: `msg_w_${Date.now()}`,
      sender: 'coach',
      text: `Chào mừng ${userData.name} (${userData.provider === 'google' ? 'Google / UnionFam Member' : 'Khách'}) đến với Life Lab! Bạn có thể bắt đầu bằng việc chọn một trong các câu hỏi gợi ý bên dưới (Q1, Q2, Q5, Q10) hoặc nhấp vào địa danh trên bản đồ 3D nhé.`,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, welcomeMsg]);

    setIsHandsOnActive(true);
    setCurrentQuestIndex(0);
  };

  // 1. Handle Selecting a 3D Node
  const handleSelectNode = (node: MapNode) => {
    setSelectedNodeId(node.id);
    setCurrentFocusId(node.id);
    completeQuestStep(0);

    let scriptPrompt = '';
    if (node.id === 'money') {
      scriptPrompt =
        '✦ Cán cân [Money]: "Chúng ta không bảo bạn đừng kiếm tiền. Chúng ta hỏi: Hãy kiếm tiền, nhưng trước tiên hãy biết tiền đang phục vụ cuộc đời nào?" Bạn cảm thấy tài chính hiện tại đang đáp ứng nhu cầu an toàn hay đang là nguồn cơn của áp lực?';
    } else if (node.id === 'work') {
      scriptPrompt =
        '✦ Thành trì [Work]: "Tôi đang đạt được những thứ người khác bảo là tốt, nhưng tại sao tôi không thấy đây là cuộc sống mình muốn?" Điều gì trong công việc đang tạo nên khoảng trống lớn nhất cho bạn?';
    } else if (node.id === 'relationships') {
      scriptPrompt =
        '✦ Rừng [Relationships]: Bạn có nhận ra mình đang chọn nghề, mua nhà hay sống theo kỳ vọng của gia đình và xã hội? Đâu là ranh giới giữa điều bạn muốn và điều người khác muốn ở bạn?';
    } else if (node.id === 'values_tradeoffs') {
      scriptPrompt =
        '✦ Bậc thang [Values & Trade-offs]: Nơi bạn nhìn lại những giá trị cốt lõi của mình. Để sống một cuộc đời nhẹ nhõm hơn, bạn cảm thấy mình sẵn sàng từ bỏ điều gì và kiên quyết giữ lấy điều gì?';
    } else if (node.id === 'desired_difference') {
      scriptPrompt =
        '✦ Hòn đảo [Desired Difference]: "Better version" không mặc định là kiếm nhiều tiền hơn hay địa vị cao hơn. "Better" là phiên bản phù hợp với cuộc đời do CHÍNH BẠN lựa chọn. Bức tranh bạn mong ước trông như thế nào?';
    } else if (node.id === 'the_gap') {
      scriptPrompt =
        '✦ Vùng sương mù [The Gap]: Khoảng cách giữa thực tại bạn đang sống và nơi bạn muốn đến. Điều gì đang là rào cản lớn nhất ngăn bạn bước qua sương mù?';
    } else {
      scriptPrompt = `✦ Ngọn hải đăng vừa hướng về [${node.label}] — ${node.subtitle || node.description}. Bạn muốn chúng ta cùng đào sâu vào khía cạnh nào ở khu vực này?`;
    }

    const coachResponse: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: 'coach',
      text: scriptPrompt,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, coachResponse]);
  };

  // 2. Intelligent AI Reflection Engine (Rich Dynamic Contextual Logic)
  const handleSendMessage = async (text: string) => {
    const userMsg: ChatMessage = {
      id: `msg_u_${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date(),
    };

    const updatedHistory = [...messages, userMsg];
    setMessages(updatedHistory);
    setIsAiThinking(true);
    completeQuestStep(1);

    // If Gemini Key is present, try live Google Gemini API first!
    if (geminiApiKey) {
      try {
        const liveReply = await askGeminiLifeLab(text, updatedHistory, geminiApiKey);
        setIsAiThinking(false);
        const coachMsg: ChatMessage = {
          id: `msg_c_${Date.now()}`,
          sender: 'coach',
          text: liveReply,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, coachMsg]);
        return;
      } catch (err) {
        console.warn('Gemini live call fallback to Offline Contextual Engine:', err);
      }
    }

    // Comprehensive Offline Contextual Reasoning Engine (Never repeats!)
    setTimeout(() => {
      setIsAiThinking(false);
      const lower = text.toLowerCase().trim();
      let aiReply = '';
      let newExp = null;

      // Check current landmark context
      const currentNode = nodes.find((n) => n.id === currentFocusId);
      const nodeLabel = currentNode?.label || 'Bản đồ';

      // Branch 1: "Tôi đang ở đâu?" / Vị trí
      if (lower.includes('ở đâu') || lower.includes('đây là đâu') || lower.includes('vị trí')) {
        aiReply = `Bạn đang hướng ngọn hải đăng tại khu vực [${nodeLabel}] — ${currentNode?.subtitle || currentNode?.description}. Tại đây, bạn có thể nhìn nhận các giá trị và lựa chọn của mình. Bạn đang cảm thấy băn khoăn điều gì nhất tại địa danh này?`;
      }
      // Branch 2: Cảm xúc buồn bã, chán nản, cô đơn
      else if (lower.includes('buồn') || lower.includes('chán') || lower.includes('cô đơn') || lower.includes('tủi thân') || lower.includes('thất vọng')) {
        aiReply = 'Tôi cảm nhận được nỗi buồn và sức nặng mà bạn đang mang trong lòng. Nỗi buồn thường là tín hiệu cho thấy một giá trị sâu kín bên trong bạn đang bị tổn thương hoặc chưa được lắng nghe. Điều gì đã kích hoạt cảm xúc này gần đây nhất?';
      }
      // Branch 3: Lạc lối, mất phương hướng, không biết làm gì
      else if (lower.includes('mất phương hướng') || lower.includes('lạc lối') || lower.includes('không biết làm gì') || lower.includes('mông lung') || lower.includes('bế tắc')) {
        aiReply = 'Cảm giác mất phương hướng không phải là dấu chấm hết, mà là khoảnh khắc bạn nhận ra chiếc la bàn cũ không còn phù hợp. Nếu tạm thời gác lại mọi kỳ vọng của người khác, điều đầu tiên bạn muốn làm cho riêng mình trong hôm nay là gì?';
      }
      // Branch 4: Chào hỏi
      else if (/^(chào|chao|hi|hello|alo|hey|ơi|oi|bạn là ai|giúp gì)/i.test(lower) && !lower.includes('tiền') && !lower.includes('việc') && !lower.includes('áp lực')) {
        aiReply = 'Chào bạn! Rất vui được đồng hành cùng bạn tại UnionFam Life Lab. Tôi ở đây để giúp bạn lắng nghe chính mình và chuyển hóa một định hướng thành nhịp sống cụ thể. Bạn có thể bắt đầu bằng câu hỏi: Trong một ngày lý tưởng, điều gì bạn muốn dành nhiều năng lượng nhất?';
      }
      // Branch 5: Tài chính & Tự do
      else if (lower.includes('tiền') || lower.includes('tài chính') || lower.includes('thu nhập') || lower.includes('giàu') || lower.includes('lương')) {
        aiReply = 'Life Lab phản chiếu (Cán cân Money): Có vẻ điều bạn thực sự tìm kiếm không phải là con số tiền bạc, mà là sự tự do và cảm giác an tâm khi không còn nỗi sợ thiếu thốn. Nếu áp lực tài chính được gỡ bỏ, bạn muốn dành thời gian đó cho điều gì?';
        newExp = {
          title: '7 Ngày Tách Tiền Khỏi Giá Trị Bản Thân',
          desc: 'Mỗi ngày ghi nhận 1 niềm vui thuần túy không tốn tiền và viết 1 quyết định chi tiêu phục vụ sự bình an dài hạn.',
          days: [true, false, false, false, false, false, false],
          energy: 7.5,
          insight: '"Tài chính lành mạnh là khi bạn kiếm tiền để sống tự do, chứ không sống để làm nô lệ của đồng tiền."',
          gap: 'Khoảng cách: Kỳ vọng kiếm tiền nhanh ➔ Mong muốn: Bình an và tự chủ thời gian.',
        };
      }
      // Branch 6: Kỳ vọng gia đình & Xã hội
      else if (lower.includes('kỳ vọng') || lower.includes('gia đình') || lower.includes('bố mẹ') || lower.includes('áp lực') || lower.includes('trách nhiệm')) {
        aiReply = 'Life Lab phản chiếu (Rừng Relationships): Tôi tự hỏi có phải bạn đang gánh vác kỳ vọng của người khác quá lâu và quên mất ranh giới cho chính mình? Sự hy sinh chỉ bền vững khi bạn không đánh mất bản thể trọn vẹn. Bạn sẵn sàng thử buông điều gì nhỏ trong tuần này?';
        newExp = {
          title: '7 Ngày Thiết Lập Ranh Giới Lành Mạnh',
          desc: 'Nói "Tôi cần suy nghĩ thêm" trước các đề nghị ngoài giờ hoặc việc không phục vụ mục tiêu trọng tâm.',
          days: [true, true, false, false, false, false, false],
          energy: 8.0,
          insight: '"Bảo vệ ranh giới cá nhân là bước đầu tiên để trở thành phiên bản do chính mình lựa chọn."',
          gap: 'Khoảng cách: Sợ làm người khác thất vọng ➔ Mong muốn: Được sống thật với giá trị riêng.',
        };
      }
      // Branch 7: Mệt mỏi, kiệt sức & Năng lượng
      else if (lower.includes('mệt') || lower.includes('kiệt sức') || lower.includes('mắc kẹt') || lower.includes('năng lượng') || lower.includes('thời gian')) {
        aiReply = 'Life Lab phản chiếu: Dường như bạn đang bị cuốn trôi trong việc bận liên tục mà thiếu các khoảng dừng (Point of Pause). Gợi ý bước nhỏ: Hãy chuyển sang tab [2. Thử Nghiệm 7 Ngày] để trải nghiệm thử thách 30 phút tự quyết mỗi tối không màn hình nhé.';
        newExp = {
          title: '30 Phút Tự Quyết Mỗi Tối (No Distraction)',
          desc: 'Mỗi buổi tối dành 30 phút không điện thoại, ghi lại 3 quyết định bạn tự đưa ra trong ngày mà không bị chi phối bởi ý kiến bên ngoài.',
          days: [true, true, true, false, false, false, false],
          energy: 8.5,
          insight: '"Dành 30 phút tự quyết mỗi ngày giúp phục hồi 50% cảm giác kiệt sức vào cuối tuần."',
          gap: 'Khoảng cách: Bận rộn việc người khác ➔ Trọng tâm: 30 phút hồi sinh năng lượng tự thân.',
        };
      }
      // Branch 8: Định hướng nghề nghiệp & Một ngày lý tưởng
      else if (lower.includes('định hướng') || lower.includes('nghề') || lower.includes('công việc') || lower.includes('sự nghiệp') || lower.includes('tương lai') || lower.includes('lý tưởng')) {
        aiReply = 'Life Lab phản chiếu (Thành trì Work): Định hướng cuộc đời không bắt đầu từ việc chạy theo tiêu chuẩn người khác, mà bắt đầu từ nhịp điệu một ngày bạn muốn sống. Bạn hình dung một ngày làm việc tràn đầy cảm hứng của mình sẽ như thế nào?';
        newExp = {
          title: '7 Ngày Quan Sát Bản Thân & Điểm Tựa Nghề Nghiệp',
          desc: 'Ghi lại 1 khoảnh khắc trong ngày bạn làm việc hiệu quả và cảm thấy có ý nghĩa sâu sắc nhất.',
          days: [true, false, false, false, false, false, false],
          energy: 8.0,
          insight: '"Nghề nghiệp lý tưởng là giao điểm giữa điều bạn làm giỏi, điều bạn yêu thích và điều cuộc đời cần."',
          gap: 'Khoảng cách: Làm vì quán tính ➔ Mong muốn: Thiết kế công việc phục vụ phong cách sống.',
        };
      }
      // Branch 9: Đánh đổi & Giá trị
      else if (lower.includes('đánh đổi') || lower.includes('từ bỏ') || lower.includes('chọn') || lower.includes('giá trị')) {
        aiReply = 'Mọi lựa chọn lớn trong đời đều đi kèm với sự đánh đổi (Trade-off). Không có con đường hoàn hảo không mất mát, chỉ có con đường mà cái giá phải trả là xứng đáng với bạn. Bạn cảm thấy mình sẵn sàng đánh đổi điều gì để có được sự tự do tâm trí?';
      }
      // Branch 10: Phản hồi tự nhiên mở rộng
      else {
        aiReply = `Tôi nghe thấy chia sẻ của bạn về: "${text}". Dường như bạn đang mong muốn tháo gỡ một rào cản bên trong. Nếu nhìn lại sự việc này từ góc nhìn của 1 năm sau, bạn nghĩ điều quan trọng nhất bạn học được từ nó sẽ là gì?`;
      }

      const coachMsg: ChatMessage = {
        id: `msg_c_${Date.now()}`,
        sender: 'coach',
        text: aiReply,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, coachMsg]);
      if (newExp) setCurrentExperiment(newExp);
    }, 450);
  };

  // 3. Handle Feedback (Completes Quest 2)
  const handleProvideFeedback = (feedback: 'right_on' | 'partly_right' | 'not_quite') => {
    if (feedback === 'right_on') {
      confetti({
        particleCount: 80,
        spread: 90,
        origin: { y: 0.82, x: 0.8 },
      });

      setNodes((prev) =>
        prev.map((n) => {
          if (n.id === currentFocusId) {
            return {
              ...n,
              status: 'DEFINED',
              dots: ['DEFINED', 'DEFINED', 'GROUNDED'],
            };
          }
          return n;
        })
      );

      setClarityScore((prev) => ({
        score: Math.min(prev.score + 1, 5),
        gems: ['ruby', 'bronze', 'crystal', 'sapphire', 'emerald'],
      }));

      const newInsight: MemoryItem = {
        id: `mem_${Date.now()}`,
        type: 'CONFIRMED_INSIGHT',
        title: `Insight xác thực: ${nodes.find((n) => n.id === currentFocusId)?.label || 'Cuộc sống'}`,
        content: messages[messages.length - 1]?.text || 'Nhận thức rõ ràng về mục tiêu cuộc sống.',
        verified: true,
        date: 'Hôm nay',
        nodeId: currentFocusId,
      };
      setMemories((prev) => [newInsight, ...prev]);

      completeQuestStep(2);

      const confirmMsg: ChatMessage = {
        id: `msg_f_${Date.now()}`,
        sender: 'coach',
        text: '✦ Tuyệt vời! Bạn vừa xác nhận Insight thành công. Giờ hãy chuyển sang tab [2. Thử Nghiệm 7 Ngày] ở trên cùng để thiết lập hành động thực tế nhé!',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, confirmMsg]);
    } else if (feedback === 'partly_right') {
      const partialMsg: ChatMessage = {
        id: `msg_f_${Date.now()}`,
        sender: 'coach',
        text: 'Phần nào trong diễn giải vừa rồi bạn cảm thấy đúng, và phần nào chưa thực sự khớp với bạn?',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, partialMsg]);
    } else {
      setIsRepairOpen(true);
    }
  };

  // 4. Handle Memory Center Opened (Completes Quest 4)
  const handleOpenMemoryCenter = () => {
    setIsMemoryOpen(true);
    completeQuestStep(4);
    confetti({
      particleCount: 100,
      spread: 120,
      origin: { y: 0.5, x: 0.5 },
    });
  };

  // Handle Repair Submission
  const handleSubmitRepair = (correctedText: string) => {
    const userCorrection: ChatMessage = {
      id: `msg_r_u_${Date.now()}`,
      sender: 'user',
      text: `[Hiệu chỉnh]: ${correctedText}`,
      timestamp: new Date(),
    };

    const coachAck: ChatMessage = {
      id: `msg_r_c_${Date.now()}`,
      sender: 'coach',
      text: `Cảm ơn bạn đã hiệu chỉnh rõ ràng: "${correctedText}". Tôi đã cập nhật lại góc nhìn chính xác vào hệ thống.`,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userCorrection, coachAck]);
  };

  return (
    <div className="w-screen h-screen flex flex-col bg-[#181a1b] overflow-hidden select-none">
      {/* 1. Top Navigation Bar */}
      <TopBar
        sessionTitle={user ? `${user.name} — UnionFam Blueprint V7` : 'UnionFam Life Lab'}
        clarityState={clarityScore}
        onOpenGuide={() => setIsGuideOpen(true)}
      />

      {/* 2. Main Content Viewport */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left / Center Living Map Viewport */}
        <div className="flex-1 h-full relative">
          <LivingMap3D
            nodes={nodes}
            onSelectNode={handleSelectNode}
            selectedNodeId={selectedNodeId}
            currentFocusId={currentFocusId}
          />
        </div>

        {/* Right UnionFam Blueprint 7.0 Consulting & Experiment Panel */}
        <ConsultingEnginePanel
          messages={messages}
          onSendMessage={handleSendMessage}
          onProvideFeedback={handleProvideFeedback}
          onOpenRepair={() => setIsRepairOpen(true)}
          onOpenKeyModal={() => setIsKeyModalOpen(true)}
          hasGeminiKey={Boolean(geminiApiKey)}
          topicTitle={topicTitle}
          isAiThinking={isAiThinking}
          currentExperiment={currentExperiment}
          onToggleExperimentDay={handleToggleExperimentDay}
          onChangeEnergy={handleChangeEnergy}
          activeStep={activeStep}
          onChangeActiveStep={(step) => {
            setActiveStep(step);
            if (step === 'experiment') completeQuestStep(3);
          }}
        />
      </div>

      {/* 3. Bottom Action Bar */}
      <BottomBar
        onStop={() => {
          const stopMsg: ChatMessage = {
            id: `msg_stop_${Date.now()}`,
            sender: 'system',
            text: 'Phiên làm việc đã tạm dừng theo yêu cầu (USER_STOP). Mọi tiến trình được bảo lưu trọn vẹn.',
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, stopMsg]);
        }}
        onChangeTopic={() => setIsTopicOpen(true)}
        onOpenMemoryCenter={handleOpenMemoryCenter}
        onOpenSettings={() => setIsSettingsOpen(true)}
        noMemoryMode={noMemoryMode}
        onToggleNoMemory={setNoMemoryMode}
      />

      {/* 4. Google / UnionFam Login Modal */}
      <LoginModal
        isOpen={isLoginOpen}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* 5. Live Hands-On Interactive Quest Tour */}
      <InteractiveHandsOnTour
        isActive={isHandsOnActive}
        currentQuestIndex={currentQuestIndex}
        quests={quests}
        onClose={() => setIsHandsOnActive(false)}
        onSkip={() => setIsHandsOnActive(false)}
      />

      {/* 6. Guide Tour & Handbook Modal */}
      <GuideTourModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />

      {/* 7. Gemini API Key Modal */}
      <GeminiKeyModal
        isOpen={isKeyModalOpen}
        onClose={() => setIsKeyModalOpen(false)}
        onSaveKey={handleSaveGeminiKey}
        currentKey={geminiApiKey}
      />

      {/* 8. Memory Center Modal */}
      <MemoryCenterModal
        isOpen={isMemoryOpen}
        onClose={() => setIsMemoryOpen(false)}
        memories={memories}
        onUpdateMemories={setMemories}
      />

      {/* 9. Repair Modal */}
      <RepairModal
        isOpen={isRepairOpen}
        onClose={() => setIsRepairOpen(false)}
        onSubmitRepair={handleSubmitRepair}
      />

      {/* 10. Topic Selector Modal */}
      <TopicSelectorModal
        isOpen={isTopicOpen}
        onClose={() => setIsTopicOpen(false)}
        nodes={nodes}
        onSelectTopic={handleSelectNode}
        currentNodeId={currentFocusId}
      />

      {/* 11. Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-[#24282e] border border-stone-700/80 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl">
            <h2 className="font-serif-title font-semibold text-base text-stone-100">
              Cài đặt Hệ thống Life Lab
            </h2>
            <div className="space-y-3 text-xs text-stone-300">
              <div className="flex items-center justify-between p-2.5 bg-[#1b1e22] rounded-xl border border-stone-700/60">
                <span>Trí tuệ Nhân tạo UnionFam Life Lab</span>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold px-2.5 py-1 rounded-lg text-[11px]">
                  Tích hợp sẵn (Active)
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-[#1b1e22] rounded-xl border border-stone-700/60">
                <span>Âm thanh không gian & Sóng biển</span>
                <input type="checkbox" defaultChecked className="accent-amber-500 cursor-pointer" />
              </div>
              <div className="flex items-center justify-between p-2.5 bg-[#1b1e22] rounded-xl border border-stone-700/60">
                <span>Hiệu ứng ngọn hải đăng chiếu sáng</span>
                <input type="checkbox" defaultChecked className="accent-amber-500 cursor-pointer" />
              </div>
              <div className="flex items-center justify-between p-2.5 bg-[#1b1e22] rounded-xl border border-stone-700/60">
                <span>Chế độ ẩn danh (No Memory Tracking)</span>
                <input
                  type="checkbox"
                  checked={noMemoryMode}
                  onChange={(e) => setNoMemoryMode(e.target.checked)}
                  className="accent-amber-500 cursor-pointer"
                />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="bg-stone-700 hover:bg-stone-600 text-stone-200 px-4 py-1.5 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
