import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Send,
  ArrowLeft,
  RotateCcw,
  PauseCircle,
  BookmarkCheck,
  Layers,
  AlertTriangle,
  Activity,
  ArrowRight,
  CheckCircle2,
  X,
  MessageCircle,
  Leaf,
  PhoneCall,
  Compass
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  getStoredGeminiKey,
  callGeminiCompanionAPI,
  summarizeSessionInsight,
  isCrisisResponse,
  isCrisisIntent
} from '../../services/geminiService';
import { SessionOutcomeType } from '../../config/betaFlags';
import { saveConversationToCloud, loadConversationFromCloud, saveMemoryToCloud } from '../../services/supabaseService';
import { createExperimentFromSession } from '../../services/experimentService';
import { DecisionCardModal } from '../decision/DecisionCardModal';
import { DecisionCanvas } from '../decision/DecisionCanvas';
import { IncidentReportModal } from '../beta/IncidentReportModal';
import { BetaDashboardModal } from '../beta/BetaDashboardModal';
import {
  CORE_PROBLEM_SCENARIOS,
  extractDecisionCardFromConversation,
  extractLiveCardOptimistic,
  getActiveDecisionCard,
  saveActiveDecisionCard,
  ProblemScenario
} from '../../services/decisionService';
import { DecisionCardData } from '../../types/decisionCard';

interface SanctuaryChatViewProps {
  onBackToHome: () => void;
  onGoToExperiments?: () => void;
}

interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
}

export const SanctuaryChatView: React.FC<SanctuaryChatViewProps> = ({
  onBackToHome,
  onGoToExperiments,
}) => {
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Chat state
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: 'Chào bạn. Chúng ta không cần giải quyết toàn bộ cuộc sống hôm nay. Bạn có thể bắt đầu từ điều đang chiếm nhiều suy nghĩ hoặc năng lượng. Bạn muốn bắt đầu từ đâu?',
      timestamp: 'Ngay bây giờ',
    },
  ]);

  const [inputText, setInputText] = useState('');
  const apiKey = getStoredGeminiKey();
  const [isAiTyping, setIsAiTyping] = useState(false);

  // Decision Card Canvas State (Live Studio)
  const [decisionCard, setDecisionCard] = useState<DecisionCardData>(getActiveDecisionCard);
  const [isExtractingCard, setIsExtractingCard] = useState(false);
  const [isLiveSyncing, setIsLiveSyncing] = useState(false);
  const [cardUpdatedNotice, setCardUpdatedNotice] = useState(false);
  const [activeMobileTab, setActiveMobileTab] = useState<'dialogue' | 'studio'>('dialogue');

  // Checkpoint & Memory State
  const [showCheckpointModal, setShowCheckpointModal] = useState(false);
  const [selectedOutcome, setSelectedOutcome] = useState<SessionOutcomeType | null>(null);
  const [memoryConsent, setMemoryConsent] = useState<'granted' | 'declined' | null>(null);
  const [isSessionClosed, setIsSessionClosed] = useState(false);
  const [isCrisisLocked, setIsCrisisLocked] = useState(false);
  const [checkpointNote, setCheckpointNote] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [showDecisionCardModal, setShowDecisionCardModal] = useState(false);
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [showBetaDashboard, setShowBetaDashboard] = useState(false);
  const [activeScenarioId, setActiveScenarioId] = useState<'work_life' | 'purpose' | 'major_decision' | null>(null);
  const [conversationId, setConversationId] = useState<string>(() => Date.now().toString());

  // Tải lại hội thoại đã lưu từ Cloud / LocalStorage
  useEffect(() => {
    loadConversationFromCloud().then(saved => {
      if (saved && saved.messages && saved.messages.length > 0) {
        setConversationId(saved.conversationId);
        setMessages(saved.messages);
        if (saved.messages.some(m => isCrisisResponse(m.text))) {
          setIsSessionClosed(true);
          setIsCrisisLocked(true);
        }
      }
    });

    const storedCard = getActiveDecisionCard();
    if (storedCard) {
      setDecisionCard(storedCard);
    }
  }, []);

  // Auto-scroll whenever messages change
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages, isAiTyping]);

  const handleOpenCheckpointModal = async () => {
    setShowCheckpointModal(true);
    if (!checkpointNote && messages.some(m => m.sender === 'user')) {
      setIsSummarizing(true);
      try {
        const summary = await summarizeSessionInsight(messages);
        setCheckpointNote(summary);
        if (!selectedOutcome) {
          setSelectedOutcome('CONFIRMED_INSIGHT');
        }
      } finally {
        setIsSummarizing(false);
      }
    }
  };

  const handleSelectScenario = async (scenario: ProblemScenario) => {
    setActiveScenarioId(scenario.id);

    // Cập nhật Thẻ Quyết Định theo mẫu tình huống
    const scenarioCard: DecisionCardData = {
      ...decisionCard,
      ...scenario.defaultCardData,
      scenarioCategory: scenario.id,
      version: decisionCard.version + 1,
      status: 'USER_REVIEW',
      updatedAt: new Date().toISOString(),
    };
    setDecisionCard(scenarioCard);
    saveActiveDecisionCard(scenarioCard);
    setCardUpdatedNotice(true);
    setTimeout(() => setCardUpdatedNotice(false), 3000);

    submitMessage(scenario.starterPrompt);
  };

  const handleRefreshCanvasFromChat = async () => {
    setIsExtractingCard(true);
    try {
      const extracted = await extractDecisionCardFromConversation(
        messages,
        activeScenarioId || undefined
      );
      setDecisionCard(extracted);
      saveActiveDecisionCard(extracted);
      setCardUpdatedNotice(true);
      setTimeout(() => setCardUpdatedNotice(false), 3000);
    } finally {
      setIsExtractingCard(false);
    }
  };

  const handleUpdateCardFromCanvas = (updated: DecisionCardData) => {
    setDecisionCard(updated);
    saveActiveDecisionCard(updated);
  };

  const submitMessage = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || isAiTyping || isSessionClosed) return;

    const newMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedWithUser: Message[] = [...messages, newMsg];
    setMessages(updatedWithUser);
    saveConversationToCloud(conversationId, updatedWithUser);
    setInputText('');
    setIsAiTyping(true);

    // ⚡ CẬP NHẬT TỨC THÌ (INSTANT LIVE SYNC < 50ms):
    // Bóc tách ngay lập tức nan đề, tiêu chí và phương án theo câu người dùng vừa gửi
    const liveOptimisticCard = extractLiveCardOptimistic(trimmed, decisionCard, activeScenarioId || undefined);
    setDecisionCard(liveOptimisticCard);
    saveActiveDecisionCard(liveOptimisticCard);
    setIsLiveSyncing(true);
    setCardUpdatedNotice(true);

    try {
      const activeKey = apiKey.trim() || getStoredGeminiKey();
      const result = await callGeminiCompanionAPI(activeKey, trimmed, messages);
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: result.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      const updatedWithAi: Message[] = [...updatedWithUser, aiMsg];
      setMessages(updatedWithAi);
      saveConversationToCloud(conversationId, updatedWithAi);

      // Nếu phát hiện khủng hoảng / sdt đường dây nóng: ĐÓNG VÀ NGƯNG CHAT LẬP TỨC
      if (result.isCrisis || isCrisisResponse(result.text)) {
        setIsSessionClosed(true);
        setIsCrisisLocked(true);
        setIsLiveSyncing(false);
      } else if (result.isUserStop) {
        setIsSessionClosed(true);
        setIsLiveSyncing(false);
      } else {
        // Tự động kết tinh sâu bằng AI (Groq / Gemini) và hoàn tất cập nhật Thẻ Quyết Định
        extractDecisionCardFromConversation(updatedWithAi, activeScenarioId || undefined)
          .then(cardData => {
            setDecisionCard(cardData);
            saveActiveDecisionCard(cardData);
            setIsLiveSyncing(false);
            setCardUpdatedNotice(true);
            setTimeout(() => setCardUpdatedNotice(false), 3500);
          })
          .catch(() => {
            setIsLiveSyncing(false);
          });
      }
    } catch {
      const fallbackMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: 'Mình vẫn đang ở đây lắng nghe bạn. Bạn cứ thong thả chia sẻ điều đang chiếm nhiều năng lượng nhất lúc này, chúng ta sẽ cùng nhìn lại từng chút một.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      const updatedWithFallback: Message[] = [...updatedWithUser, fallbackMsg];
      setMessages(updatedWithFallback);
      saveConversationToCloud(conversationId, updatedWithFallback);
    } finally {
      setIsAiTyping(false);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    submitMessage(inputText);
  };

  // User Stop handler (P0-01)
  const handleUserStop = () => {
    setIsSessionClosed(true);
    setMessages(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        sender: 'ai',
        text: 'Cảm ơn bạn đã ghé lại và dành thời gian cho chính mình. Chúng ta dừng tại đây nhé. Khi nào cần một khoảng lặng để nhìn lại, bạn luôn có thể quay lại.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  // Reset conversation handler: Làm mới toàn bộ phiên đối thoại, xóa cache
  const handleResetConversation = () => {
    if (isAiTyping) return;
    const newConvId = Date.now().toString();
    const initialWelcome: Message = {
      id: 'welcome_' + newConvId,
      sender: 'ai',
      text: 'Chào bạn. Chúng ta không cần giải quyết toàn bộ cuộc sống hôm nay. Bạn có thể bắt đầu từ điều đang chiếm nhiều suy nghĩ hoặc năng lượng. Bạn muốn bắt đầu từ đâu?',
      timestamp: 'Ngay bây giờ',
    };

    setConversationId(newConvId);
    setMessages([initialWelcome]);
    setInputText('');
    setIsSessionClosed(false);
    setIsCrisisLocked(false);
    setSelectedOutcome(null);
    setCheckpointNote('');
    setActiveScenarioId(null);
    setIsLiveSyncing(false);

    // Reset Decision Card về trạng thái lắng nghe trong trẻo ban đầu
    const freshListeningCard: DecisionCardData = {
      id: 'dec_' + newConvId,
      version: 1,
      status: 'DRAFT',
      title: 'Thẻ Quyết Định Của Bạn',
      source: 'conversation_extracted',
      sourceSnippet: 'Đang lắng nghe để tự động bóc tách theo dòng đối thoại',
      decisionQuestion: 'Đang lắng nghe để kết tinh nan đề cốt lõi của bạn...',
      criteria: [
        'Bảo toàn năng lượng sống và sức khỏe tinh thần',
        'Đảm bảo sự an toàn và ổn định thực tế',
        'Tôn trọng giá trị và nhịp điệu riêng của bạn'
      ],
      hardConstraints: [
        'Chưa xác lập ranh giới đỏ (Sẽ tự động cập nhật khi bạn chia sẻ trong chat)'
      ],
      options: [
        { id: 'opt_1', name: 'Hướng A: Đang lắng nghe...', description: 'Sẽ tự động bóc tách theo dòng đối thoại của bạn.' },
        { id: 'opt_2', name: 'Hướng B: Đang lắng nghe...', description: 'Sẽ tự động so sánh theo chia sẻ của bạn.' },
        { id: 'opt_3', name: 'Hướng C: Bước thử an toàn', description: 'Gợi ý vi hành động thử nghiệm an toàn.' }
      ],
      uncertainties: [
        { id: 'unc_1', question: 'Ẩn số quan trọng nhất sẽ được nhận diện khi bạn chia sẻ câu chuyện.' }
      ],
      experiment: {
        learningQuestion: 'Thử nghiệm vi mô 7 ngày sẽ xuất hiện tại đây khi nan đề rõ ràng.',
        action: 'Dành 15 phút mỗi ngày lắng nghe bản thân.',
        durationDays: 7
      },
      reviewDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('vi-VN'),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setDecisionCard(freshListeningCard);
    saveActiveDecisionCard(freshListeningCard);

    try {
      localStorage.removeItem('unionfam_messages_cache');
      localStorage.removeItem('unionfam_conversation_id');
      localStorage.removeItem('unionfam_active_decision_card');
      saveConversationToCloud(newConvId, [initialWelcome]);
    } catch (e) {
      console.warn('Reset storage notice:', e);
    }
  };

  // Confirm Checkpoint & Memory Permission
  const handleConfirmCheckpoint = () => {
    if (!selectedOutcome) return;
    const outcomeLabels: Record<SessionOutcomeType, string> = {
      REFLECTIVE_PAUSE: 'Dừng lại với điều vừa rõ',
      BETTER_QUESTION: 'Giữ một câu hỏi ngẫm nghĩ',
      CONFIRMED_INSIGHT: 'Tiếp tục khám phá thấu suốt',
      MEANINGFUL_NEXT_STEP: 'Nhìn rõ một quyết định',
      LIFE_EXPERIMENT: 'Thử một bước nhỏ thực tế',
    };

    const outcomeText = outcomeLabels[selectedOutcome];

    if (memoryConsent === 'granted') {
      saveMemoryToCloud({
        id: Date.now().toString(),
        category: 'insight',
        title: outcomeText,
        reflection: checkpointNote || `Phiên hội thoại ngày ${new Date().toLocaleDateString('vi-VN')}: ${outcomeText}`,
        date: 'Vừa xong',
      });
    }

    setShowCheckpointModal(false);
    confetti({ particleCount: 40, spread: 45 });
  };

  return (
    <div className="relative w-full min-h-screen bg-calm-forest-dusk text-calm-paper-white flex flex-col justify-between pt-16 sm:pt-20 pb-4 px-3 sm:px-6">
      
      {/* Background Ambient Glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div
          className="absolute inset-0 opacity-80"
          style={{
            background:
              'radial-gradient(circle at 80% 20%, rgba(198,214,180,0.14), transparent 50%), radial-gradient(circle at 15% 80%, rgba(89,106,85,0.22), transparent 55%), linear-gradient(180deg, #263128 0%, #1c251f 60%, #121914 100%)',
          }}
        />
      </div>

      {/* Main Studio Shell */}
      <div className="relative z-10 w-full max-w-[1600px] mx-auto flex-1 flex flex-col">
        
        {/* Top Controls Bar */}
        <div className="flex items-center justify-between pb-3 px-1 gap-2">
          {/* Back to Home Button */}
          <button
            onClick={onBackToHome}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-calm-deep-moss/80 hover:bg-calm-moss border border-calm-lichen/30 text-calm-fog text-xs font-sans transition cursor-pointer shadow-soft shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-calm-lichen" />
            <span className="hidden sm:inline">Về trang chủ</span>
            <span className="sm:hidden">Trang chủ</span>
          </button>

          {/* Center: Mobile View Switcher Tabs (< lg) OR Desktop Title (>= lg) */}
          <div className="lg:hidden flex items-center bg-calm-deep-moss/90 border border-calm-lichen/30 rounded-full p-1 shadow-soft">
            <button
              type="button"
              onClick={() => setActiveMobileTab('dialogue')}
              className={`px-3 py-1 rounded-full text-xs font-sans transition cursor-pointer flex items-center gap-1.5 ${
                activeMobileTab === 'dialogue'
                  ? 'bg-calm-moss text-white font-semibold shadow-sm'
                  : 'text-calm-fog hover:text-white'
              }`}
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Đối thoại</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveMobileTab('studio')}
              className={`px-3 py-1 rounded-full text-xs font-sans transition cursor-pointer flex items-center gap-1.5 ${
                activeMobileTab === 'studio'
                  ? 'bg-calm-moss text-white font-semibold shadow-sm'
                  : 'text-calm-fog hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-calm-pollen" />
              <span>Thẻ Quyết Định</span>
              {cardUpdatedNotice && (
                <span className="w-2 h-2 rounded-full bg-calm-pollen animate-ping" />
              )}
            </button>
          </div>

          <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-calm-deep-moss/70 border border-calm-lichen/25 text-calm-lichen text-xs font-mono font-medium">
            <Compass className="w-3.5 h-3.5 text-calm-pollen" />
            <span>DECISION STUDIO · STUDIO SONG SONG (ĐỐI THOẠI & THẺ QUYẾT ĐỊNH)</span>
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Incident Report */}
            <button
              onClick={() => setShowIncidentModal(true)}
              className="w-8 h-8 rounded-full border border-rose-400/40 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 flex items-center justify-center transition cursor-pointer"
              title="Báo lỗi / Góp ý"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
            </button>

            {/* Beta Dashboard */}
            <button
              onClick={() => setShowBetaDashboard(true)}
              className="w-8 h-8 rounded-full border border-indigo-400/40 bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 flex items-center justify-center transition cursor-pointer"
              title="Beta Dashboard"
            >
              <Activity className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Studio Workspace: Dual-Pane on Desktop (lg+), Tabbed Switcher on Mobile (< lg) */}
        <div className="flex-1 lg:grid lg:grid-cols-12 gap-5 h-[calc(100vh-7.5rem)] min-h-[580px] overflow-hidden">
          
          {/* LEFT PANE: Mindful Dialogue (Active if Desktop OR Mobile tab is 'dialogue') */}
          <div
            className={`lg:col-span-5 flex-col h-full rounded-3xl bg-calm-forest-dusk/95 border border-calm-lichen/30 backdrop-blur-2xl shadow-2xl overflow-hidden ${
              activeMobileTab === 'dialogue' ? 'flex' : 'hidden lg:flex'
            }`}
          >
            {/* Dialogue Header */}
            <div className="px-4 sm:px-6 py-3.5 border-b border-calm-lichen/15 bg-calm-deep-moss/90 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-calm-moss/40 border border-calm-lichen/30 flex items-center justify-center text-calm-lichen shrink-0">
                  <Leaf className="w-4 h-4 text-calm-lichen" />
                </div>
                <div>
                  <h3 className="font-serif text-sm sm:text-base text-calm-paper-white font-medium flex items-center gap-2">
                    <span>Life Lab Mirror Companion</span>
                    <span className="text-[10px] bg-calm-moss/30 text-calm-lichen px-2 py-0.5 rounded-full border border-calm-lichen/40 flex items-center gap-1 font-sans">
                      <span className="w-1.5 h-1.5 rounded-full bg-calm-lichen animate-pulse" />
                      <span>AI Active</span>
                    </span>
                  </h3>
                  <span className="text-[10px] text-calm-fog/70 font-mono tracking-wider">
                    Lắng Nghe Không Phán Xét
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {/* Reset Conversation Button */}
                <button
                  type="button"
                  onClick={handleResetConversation}
                  disabled={isAiTyping}
                  className="text-[11px] text-calm-fog hover:text-white font-sans bg-calm-moss/20 hover:bg-calm-moss/40 disabled:opacity-40 px-2.5 py-1 rounded-full border border-calm-lichen/20 transition flex items-center gap-1 cursor-pointer shadow-sm"
                  title="Làm mới cuộc trò chuyện"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-calm-pollen" />
                  <span className="hidden sm:inline">Làm mới</span>
                </button>

                {/* Checkpoint Button */}
                <button
                  type="button"
                  onClick={handleOpenCheckpointModal}
                  className="text-[11px] text-calm-lichen font-sans bg-calm-lichen/15 hover:bg-calm-lichen/25 px-2.5 py-1 rounded-full border border-calm-lichen/30 transition flex items-center gap-1 shadow-sm cursor-pointer"
                  title="Đúc kết phiên đối thoại"
                >
                  <BookmarkCheck className="w-3.5 h-3.5 text-calm-lichen" />
                  <span>Đúc Kết</span>
                </button>

                {/* Stop Button */}
                <button
                  type="button"
                  onClick={handleUserStop}
                  disabled={isSessionClosed}
                  className="text-[11px] text-calm-fog font-sans bg-white/5 hover:bg-calm-forest-dusk disabled:opacity-40 px-2.5 py-1 rounded-full border border-calm-lichen/15 transition flex items-center gap-1 cursor-pointer"
                  title="Dừng phiên trò chuyện ngay lúc này"
                >
                  <PauseCircle className="w-3.5 h-3.5 text-calm-fog/70" />
                  <span>{isSessionClosed ? 'Đã dừng' : 'Dừng'}</span>
                </button>
              </div>
            </div>

            {/* Messages Flow Area */}
            <div
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 scroll-smooth"
            >
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} animate-fadeIn`}
                >
                  <div
                    className={`max-w-[88%] sm:max-w-[80%] p-3.5 sm:p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-gradient-to-r from-amber-700/90 to-amber-600/90 text-white font-sans font-medium rounded-br-none shadow-md border border-amber-400/20'
                        : 'bg-calm-deep-moss/95 border border-calm-lichen/20 text-calm-fog font-serif rounded-bl-none shadow-lg whitespace-pre-line'
                    }`}
                  >
                    {msg.text}

                    {/* Switch to Decision Studio pill for mobile if AI mentions decision card */}
                    {msg.sender === 'ai' && (
                      msg.text.toLowerCase().includes('decision card') ||
                      msg.text.toLowerCase().includes('thẻ quyết định')
                    ) && (
                      <div className="lg:hidden mt-2.5">
                        <button
                          type="button"
                          onClick={() => setActiveMobileTab('studio')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-calm-moss/40 hover:bg-calm-moss/60 border border-calm-lichen/40 text-calm-pollen text-xs font-sans transition shadow-sm cursor-pointer"
                        >
                          <Layers className="w-3.5 h-3.5 text-calm-pollen" />
                          <span>Xem Thẻ Quyết Định Live</span>
                          <ArrowRight className="w-3 h-3 text-calm-pollen" />
                        </button>
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-calm-fog/60 mt-1 font-mono px-1">
                    {msg.timestamp}
                  </span>
                </div>
              ))}

              {isAiTyping && (
                <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-calm-deep-moss/80 border border-calm-lichen/15 text-calm-pollen text-xs w-36 animate-fadeIn">
                  <span className="w-2 h-2 rounded-full bg-calm-pollen animate-bounce" />
                  <span className="w-2 h-2 rounded-full bg-calm-pollen animate-bounce [animation-delay:0.2s]" />
                  <span className="w-2 h-2 rounded-full bg-calm-pollen animate-bounce [animation-delay:0.4s]" />
                  <span className="text-[11px] font-sans text-calm-fog/70 ml-1">Đang suy ngẫm...</span>
                </div>
              )}
              <div ref={chatEndRef} className="h-2 w-full" />
            </div>

            {/* Bottom Actions: If Crisis -> Locked banner, Else -> Scenario Bar & Input */}
            {isCrisisLocked ? (
              <div className="p-5 border-t border-calm-lichen/20 bg-calm-deep-moss/95 text-center space-y-3 animate-fadeIn">
                <div className="w-10 h-10 rounded-full bg-calm-forest-dusk border border-calm-lichen/30 flex items-center justify-center mx-auto text-calm-lichen">
                  <Leaf className="w-5 h-5 text-calm-lichen" />
                </div>
                <div className="font-serif text-base sm:text-lg text-calm-warm-ivory font-light">
                  Cuộc trò chuyện đã khép lại
                </div>
                <p className="text-xs sm:text-sm text-calm-fog/80 max-w-md mx-auto leading-relaxed font-light">
                  Không gian đối thoại AI đã ngưng để bạn được nghỉ ngơi và ưu tiên sự an toàn cho chính mình.
                </p>
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleResetConversation}
                    className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-xs text-calm-paper-white transition flex items-center gap-1.5 cursor-pointer shadow-soft"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-calm-pollen" />
                    <span>Bắt đầu cuộc trò chuyện mới</span>
                  </button>
                  <button
                    type="button"
                    onClick={onBackToHome}
                    className="px-4 py-2 rounded-full bg-calm-moss hover:bg-calm-fern border border-calm-lichen/40 text-xs text-white transition flex items-center gap-1.5 cursor-pointer shadow-soft"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Về trang chủ</span>
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* 3 Core Problem Scenarios Quick Bar */}
                <div className="px-3.5 py-2 bg-calm-deep-moss/90 border-t border-calm-lichen/15 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-calm-lichen font-mono flex items-center uppercase tracking-wider font-semibold">
                      3 TÌNH HUỐNG TRỌNG TÂM:
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveMobileTab('studio')}
                      className="lg:hidden text-[10px] font-mono text-calm-pollen hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3 text-calm-pollen" />
                      <span>Xem Studio</span>
                    </button>
                  </div>

                  <div className="flex gap-2 overflow-x-auto pb-1 text-[11px] font-sans items-center scrollbar-none">
                    {CORE_PROBLEM_SCENARIOS.map(sc => (
                      <button
                        key={sc.id}
                        type="button"
                        onClick={() => handleSelectScenario(sc)}
                        disabled={isSessionClosed}
                        className={`px-3 py-1 rounded-full border transition whitespace-nowrap shrink-0 hover:scale-105 flex items-center gap-1 cursor-pointer ${
                          activeScenarioId === sc.id
                            ? 'bg-calm-moss border-calm-lichen text-white font-semibold shadow-soft'
                            : 'bg-calm-forest-dusk/90 border-calm-lichen/20 text-calm-fog hover:text-white hover:border-calm-lichen/50'
                        }`}
                      >
                        <span className="text-[9px] font-mono font-bold text-calm-pollen">{sc.badge}:</span>
                        <span>{sc.title}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Input Box */}
                <form onSubmit={handleSendMessage} className="p-3.5 border-t border-calm-lichen/15 bg-calm-deep-moss/90 flex gap-2">
                  <input
                    type="text"
                    value={inputText}
                    disabled={isSessionClosed}
                    onChange={e => setInputText(e.target.value)}
                    placeholder={
                      isSessionClosed
                        ? 'Phiên đối thoại đã dừng. Nhấn Bắt đầu lại để trò chuyện mới.'
                        : 'Gõ chia sẻ của bạn tại không gian này (không giới hạn chủ đề)...'
                    }
                    className="flex-1 bg-calm-forest-dusk/90 border border-calm-lichen/30 rounded-2xl px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-calm-paper-white placeholder-calm-fog/40 focus:outline-none focus:border-calm-lichen transition disabled:opacity-50"
                  />
                  {isSessionClosed ? (
                    <button
                      type="button"
                      onClick={handleResetConversation}
                      className="px-4 py-2.5 sm:py-3 rounded-2xl bg-calm-moss hover:bg-calm-fern text-white font-sans font-semibold text-xs sm:text-sm transition flex items-center gap-1.5 shadow-soft cursor-pointer whitespace-nowrap"
                      title="Bắt đầu lại cuộc trò chuyện mới"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span className="hidden sm:inline">Bắt đầu lại</span>
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={!inputText.trim() || isAiTyping}
                      className="px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl bg-calm-moss hover:bg-calm-fern disabled:opacity-40 text-white font-sans font-semibold text-xs sm:text-sm transition flex items-center gap-1.5 shadow-soft cursor-pointer"
                    >
                      <span>Gửi</span>
                      <Send className="w-4 h-4" />
                    </button>
                  )}
                </form>
              </>
            )}
          </div>

          {/* RIGHT PANE: Live Decision Studio Canvas (Active if Desktop OR Mobile tab is 'studio') */}
          <div
            className={`lg:col-span-7 h-full ${
              activeMobileTab === 'studio' ? 'flex flex-col' : 'hidden lg:flex flex-col'
            }`}
          >
            <DecisionCanvas
              card={decisionCard}
              onUpdateCard={handleUpdateCardFromCanvas}
              onRefreshFromChat={handleRefreshCanvasFromChat}
              onSelectScenario={handleSelectScenario}
              isExtracting={isExtractingCard}
              isLiveSyncing={isLiveSyncing}
              userMessageCount={messages.filter(m => m.sender === 'user').length}
              onGoToExperiments={onGoToExperiments}
              onSaveToMemories={handleOpenCheckpointModal}
            />
          </div>

        </div>
      </div>

      {/* Session Outcome Checkpoint Modal */}
      {showCheckpointModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-xl rounded-3xl bg-calm-forest-dusk border border-calm-lichen/40 p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-calm-lichen/20 pb-4">
              <div>
                <h3 className="font-serif text-lg sm:text-xl text-calm-warm-ivory font-medium flex items-center gap-2">
                  <BookmarkCheck className="w-5 h-5 text-calm-lichen" />
                  <span>Đúc Kết Phiên Đối Thoại</span>
                </h3>
                <p className="text-xs text-calm-fog/70 font-sans mt-0.5">
                  Session Outcome Checkpoint • Life Lab Master V8.7.5
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCheckpointModal(false)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-calm-fog hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 5 Outcomes Choice */}
            <div className="space-y-3">
              <label className="text-xs font-mono uppercase tracking-wider text-calm-lichen block">
                1. Bạn muốn khép lại phiên hôm nay với kết quả nào?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  { id: 'REFLECTIVE_PAUSE', title: 'Dừng với điều vừa rõ', desc: 'Không cần làm gì thêm, cho phép bản thân nghỉ ngơi.' },
                  { id: 'BETTER_QUESTION', title: 'Giữ một câu hỏi ngẫm nghĩ', desc: 'Mang theo một câu hỏi lắng đọng để quan sát.' },
                  { id: 'CONFIRMED_INSIGHT', title: 'Tiếp tục khám phá thấu suốt', desc: 'Nhìn sâu hơn vào gốc rễ điều đang diễn ra.' },
                  { id: 'MEANINGFUL_NEXT_STEP', title: 'Nhìn rõ một quyết định', desc: 'Một lựa chọn mà bạn cảm thấy yên tâm khi bước tiếp.' },
                  { id: 'LIFE_EXPERIMENT', title: 'Thử một bước nhỏ thực tế', desc: 'Một vi hành động nhỏ, nhẹ nhàng trong 1-3 ngày tới.' },
                ].map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedOutcome(item.id as SessionOutcomeType)}
                    className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between cursor-pointer ${
                      selectedOutcome === item.id
                        ? 'bg-calm-moss border-calm-lichen text-white shadow-soft'
                        : 'bg-calm-deep-moss/80 border-calm-lichen/20 text-calm-fog hover:border-calm-lichen/50'
                    }`}
                  >
                    <span className="font-serif font-medium text-xs sm:text-sm">{item.title}</span>
                    <span className="text-[11px] text-calm-fog/70 font-sans mt-1">{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Summary Insight */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono uppercase tracking-wider text-calm-lichen block">
                  2. Đúc kết nhận thức của phiên (1 câu):
                </label>
                {isSummarizing && (
                  <span className="text-[11px] font-sans text-calm-pollen animate-pulse">
                    AI đang tóm tắt...
                  </span>
                )}
              </div>
              <textarea
                value={checkpointNote}
                onChange={e => setCheckpointNote(e.target.value)}
                placeholder="Ghi lại bài học hoặc nhận thức lớn nhất bạn nhận ra hôm nay..."
                rows={2}
                className="w-full bg-calm-deep-moss border border-calm-lichen/30 rounded-2xl p-3 text-xs sm:text-sm text-calm-paper-white placeholder-calm-fog/40 focus:outline-none focus:border-calm-lichen"
              />
            </div>

            {/* Granular Memory Consent */}
            <div className="space-y-2">
              <label className="text-xs font-mono uppercase tracking-wider text-calm-lichen block">
                3. Quyền lưu trữ bộ nhớ (Bảo mật riêng tư):
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMemoryConsent('granted')}
                  className={`flex-1 p-2.5 rounded-xl border text-xs font-sans transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    memoryConsent === 'granted'
                      ? 'bg-calm-moss border-calm-lichen text-white font-semibold'
                      : 'bg-calm-deep-moss/70 border-calm-lichen/20 text-calm-fog hover:border-calm-lichen/40'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-calm-lichen" />
                  <span>Cho phép lưu an toàn</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMemoryConsent('declined')}
                  className={`flex-1 p-2.5 rounded-xl border text-xs font-sans transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    memoryConsent === 'declined'
                      ? 'bg-rose-950/60 border-rose-400 text-rose-200 font-semibold'
                      : 'bg-calm-deep-moss/70 border-calm-lichen/20 text-calm-fog hover:border-calm-lichen/40'
                  }`}
                >
                  <span>Không lưu (No Memory)</span>
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-calm-lichen/20">
              <button
                type="button"
                onClick={() => setShowCheckpointModal(false)}
                className="px-4 py-2 rounded-full text-xs font-sans text-calm-fog/70 hover:text-white"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmCheckpoint}
                disabled={!selectedOutcome}
                className="px-6 py-2.5 rounded-full bg-calm-moss hover:bg-calm-fern disabled:opacity-40 text-white font-sans text-xs font-semibold shadow-soft cursor-pointer"
              >
                Xác nhận đúc kết
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Decision Card Modal (Optional Full Screen fallback) */}
      <DecisionCardModal
        isOpen={showDecisionCardModal}
        onClose={() => setShowDecisionCardModal(false)}
        messages={messages}
      />

      {/* Incident Report Modal */}
      <IncidentReportModal
        isOpen={showIncidentModal}
        onClose={() => setShowIncidentModal(false)}
      />

      {/* Beta Dashboard Modal */}
      <BetaDashboardModal
        isOpen={showBetaDashboard}
        onClose={() => setShowBetaDashboard(false)}
      />

    </div>
  );
};
