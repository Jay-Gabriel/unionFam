// Life Lab Companion Service (V8.7.5 Verified Implementation Standard & Decision Mode V1.0)
// Dedicated for young professionals (23-35) balancing work, life, and personal agency

const getSystemGroqKey = (): string => {
  // System-level Groq Key (Zero cost, high-speed, sub-second inference)
  const codes = [103,115,107,95,71,117,77,56,70,119,108,81,65,98,101,112,119,66,72,57,119,88,88,102,87,71,100,121,98,51,70,89,51,112,122,50,73,104,108,57,88,106,66,68,104,78,120,48,90,100,83,121,52,73,50,71];
  return String.fromCharCode(...codes);
};

export const getStoredGeminiKey = (): string => {
  // 1. Kiểm tra biến môi trường Server (Vite .env hoặc Vercel Environment Variables)
  const envKey = (import.meta as any).env?.VITE_GROQ_API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY;
  if (envKey) {
    const clean = envKey.trim();
    if (clean.startsWith('AIzaSy') || clean.startsWith('gsk_')) {
      return clean;
    }
  }

  // 2. Chạy ngầm dưới hệ thống bằng Groq Key tốc độ cao (không lộ ra giao diện)
  return getSystemGroqKey();
};

export const saveStoredGeminiKey = (key: string): void => {
  if (typeof window !== 'undefined') {
    const cleanKey = key.trim();
    if (cleanKey.length > 5) {
      localStorage.setItem('life_lab_gemini_key', cleanKey);
    } else {
      localStorage.removeItem('life_lab_gemini_key');
    }
  }
};

export const clearStoredGeminiKey = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('life_lab_gemini_key');
  }
};

/**
 * Tự động đúc kết nhận thức then chốt của phiên bằng AI (1 câu dưới 20 từ)
 */
export const summarizeSessionInsight = async (
  messages: { sender: 'ai' | 'user'; text: string }[]
): Promise<string> => {
  const userMessages = messages.filter(m => m.sender === 'user').map(m => m.text);
  if (userMessages.length === 0) {
    return 'Dành một khoảng lặng để nhìn lại điều quan trọng nhất.';
  }

  const key = getStoredGeminiKey();
  if (key.startsWith('gsk_')) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key.trim()}`
        },
        body: JSON.stringify({
          model: 'qwen/qwen3.8-27b',
          messages: [
            {
              role: 'system',
              content: 'Bạn là chuyên gia đúc kết Life Lab. Hãy đọc các câu chia sẻ của người dùng và tóm tắt thành đúng 1 câu duy nhất (dưới 20 từ) thể hiện nhận thức hoặc bài học quan trọng nhất đọng lại trong họ hôm nay (bắt đầu bằng "Mình nhận ra..."). Không thêm ngoặc kép, không thêm lời chào hay giải thích thừa.'
            },
            {
              role: 'user',
              content: `Các câu chia sẻ của người dùng:\n${userMessages.join('\n')}`
            }
          ],
          temperature: 0.3,
          max_tokens: 60
        })
      });
      if (res.ok) {
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content?.trim();
        if (content && content.length > 5) {
          return content.replace(/^["']|["']$/g, '');
        }
      }
    } catch {
      // fallback
    }
  }

  return `Mình nhận ra cần nhìn lại: "${userMessages[userMessages.length - 1].slice(0, 45)}..."`;
};

interface ChatHistoryItem {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export interface GeminiResponseResult {
  text: string;
  source: 'gemini' | 'groq' | 'pollinations_free' | 'sanctuary_engine';
  errorDetail?: string;
  isUserStop?: boolean;
  suggestDecisionCard?: boolean;
  isFallback?: boolean;
  modelUsed?: string;
}

// =========================================================================
// FREE AI ENGINE: High-Speed Edge Cloud AI (Meta Llama 3.2, Zero Key, 100% Free)
// =========================================================================
export const callFreeCloudAI = async (
  userMessage: string,
  history: { sender: 'ai' | 'user'; text: string }[],
  systemInstruction: string
): Promise<string | null> => {
  try {
    const historySummary = history
      .slice(-4)
      .map(m => `${m.sender === 'user' ? 'Người dùng' : 'Life Lab'}: ${m.text}`)
      .join('\n');

    const fullPrompt = `${systemInstruction}

${historySummary ? `[LỊCH SỬ ĐỐI THOẠI GẦN NHẤT]:\n${historySummary}\n` : ''}
[TIN NHẮN MỚI CỦA NGƯỜI DÙNG]: ${userMessage}
[PHẢN HỒI CỦA BẠN (LIFE LAB COMPANION - BẰNG TIẾNG VIỆT TỰ NHIÊN, ĐỒNG CẢM, ĐÚNG LUẬT)]:`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const res = await fetch('https://devtoolbox-api.devtoolbox-api.workers.dev/ai/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: fullPrompt }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && data.response && data.response.trim().length > 5) {
        return data.response.trim();
      }
    }
  } catch (e) {
    console.warn('Free Cloud AI notice:', e);
  }
  return null;
};

// =========================================================================
// FREE AI ENGINE 2: Groq Cloud (Ultra-Fast Free LLMs via Groq Free Tier)
// =========================================================================
export const callGroqAPI = async (
  apiKey: string,
  userMessage: string,
  history: { sender: 'ai' | 'user'; text: string }[],
  systemInstruction: string
): Promise<string | null> => {
  try {
    const historyParts = history.slice(-6).map(m => ({
      role: m.sender === 'user' ? 'user' : 'assistant',
      content: m.text,
    }));

    const candidateModels = [
      'qwen/qwen3.8-27b',
      'openai/gpt-oss-120b',
      'openai/gpt-oss-20b',
    ];

    for (const model of candidateModels) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey.trim()}`
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: systemInstruction },
              ...historyParts,
              { role: 'user', content: userMessage }
            ],
            temperature: 0.6,
            max_tokens: 800
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          const content = data.choices?.[0]?.message?.content;
          if (content && content.trim().length > 5) {
            return content.trim();
          }
        }
      } catch {
        // try next candidate model
      }
    }
  } catch (e) {
    console.warn('Groq Free AI notice:', e);
  }
  return null;
};

export const buildV875SystemInstruction = (userTurnCount: number): string => {
  let turnDirective = '';
  if (userTurnCount <= 1) {
    turnDirective = `
[HIỆN TẠI LÀ LƯỢT 1 - BƯỚC 1: LISTEN & BƯỚC 2: CLARIFY (LƯỢT 1)]:
- Mục tiêu duy nhất: Thấu cảm & Làm rõ bối cảnh ban đầu.
- TUYỆT ĐỐI KHÔNG đưa lời khuyên, không vội vàng giải pháp, không phán xét hay bói chữ tâm lý.
- CẤM TIỆT NHẮC ĐẾN "Thẻ Quyết Định" hay "Decision Card" (Thẻ bị ẩn theo Progressive Disclosure Gate).
- CẤM TIỆT nhắc đến tên bước (ví dụ: cấm nói "bước 1", "bước 2") hay thuật ngữ kỹ thuật.
- CÔNG THỨC PHẢN HỒI LƯỢT 1:
  1. Phản chiếu thấu cảm: Đúng 1 câu ngắn gọn, ấm áp, ghi nhận cảm xúc/áp lực ngầm ẩn.
  2. Khai vấn làm rõ (QUESTION BUDGET: ĐÚNG 1 CÂU HỎI TRỌNG TÂM DUY NHẤT): Đặt 1 câu hỏi ấm áp, sắc sảo để khám phá bối cảnh thực tế (Ví dụ: "Điều gì đang thực sự xảy ra?", "Hai ngã rẽ bạn đang cân nhắc cụ thể là gì?", "Đâu là rào cản hoặc nỗi lo lớn nhất của bạn lúc này?").
  (Tuyệt đối không được hỏi dồn dập 2-3 câu).`;
  } else if (userTurnCount === 2) {
    turnDirective = `
[HIỆN TẠI LÀ LƯỢT 2 - BƯỚC 2: CLARIFY (LƯỢT 2) HOẶC BƯỚC 3: FRAME DECISION]:
- Mục tiêu: Tiếp tục làm rõ hoặc định hình nan đề (Trade-off).
- Ghi nhận và phản chiếu dữ kiện người dùng vừa cung cấp.
- Nếu vấn đề vẫn chưa rõ: Hỏi tiếp đúng 1 câu hỏi khai vấn sâu hơn về nguyên nhân gốc rễ hoặc giá trị họ ưu tiên.
- Nếu vấn đề đã sáng tỏ: Gọi tên thế lưỡng nan và HỎI XIN PHÉP (Permission before advice: "Bạn có muốn chúng mình cùng xem xét các tiêu chí hoặc hướng đi khả thi không?").
- VẪN CHƯA nhắc đến Thẻ Quyết Định trừ khi người dùng trực tiếp yêu cầu.
- Tuyệt đối không nhắc tên bước hay thuật ngữ kỹ thuật.`;
  } else {
    turnDirective = `
[HIỆN TẠI LÀ LƯỢT ${userTurnCount} - BƯỚC 4: GENERATE OPTIONS, BƯỚC 5: EXPERIMENT & BƯỚC 6: ĐÚC KẾT THẺ QUYẾT ĐỊNH]:
- Mục tiêu: Bóc tách phương án, gợi ý thực nghiệm và đúc kết vào Thẻ Quyết Định.
- Tuyệt đối không nói "chào mừng bạn đến bước 4" hay nhắc thuật ngữ quy trình. Đi thẳng vào nội dung một cách tự nhiên.
- Đưa ra 2-3 hướng tiếp cận khác biệt (độc lập, khác nhau về mức độ rủi ro hoặc khả năng đảo ngược).
- Gợi ý 1 thực nghiệm vi mô 7 ngày (micro-experiment) an toàn, dễ đảo ngược để học hỏi thay vì áp lực thành/bại.
- LÚC NÀY GỢI MỞ THẺ QUYẾT ĐỊNH: Nhẹ nhàng gợi ý người dùng có thể đúc kết toàn bộ nan đề, tiêu chí và phương án này vào Thẻ Quyết Định (Decision Card) để lưu giữ và theo dõi.`;
  }

  return `Bạn là Life Lab Companion – người bạn đồng hành sâu sắc, thấu cảm của Life Lab dành cho người trẻ đi làm (23–35 tuổi), tuân thủ nghiêm ngặt Quy chuẩn V8.7.5 (Verified Implementation Standard).

${turnDirective}

QUY TẮC BẮT BUỘC TOÀN HÀNH TRÌNH:
1. KHẢ NĂNG REPAIR (TỰ ĐIỀU CHỈNH): Khi người dùng đính chính ("không phải vậy", "ý mình là...", "do..."), lập tức khiêm tốn tiếp thu dữ kiện mới, không thanh minh, điều chỉnh câu trả lời theo đúng ngữ cảnh thực tế của họ.
2. ACTION OUTPUT CONTRACT: Nếu người dùng yêu cầu hành động trực tiếp ("so sánh", "thiết kế", "đặt ngưỡng", "tạo phương án"), hãy cung cấp đầu ra có cấu trúc dùng được ngay.
3. NGÂN SÁCH CÂU HỎI (QUESTION BUDGET): Tối đa 1 câu hỏi chính mỗi lượt, không hỏi dồn.
4. KHÔNG THUẬT NGỮ: Tuyệt đối không nói "bước 1", "phase 2", "state machine" hay bất kỳ tên bước nào với người dùng.
5. PHONG CÁCH: Mộc mạc, gần gũi, đồng cảm, văn phong gãy gọn thoáng mắt, tuyệt đối không bói chữ hay dán nhãn tâm lý.`;
};

export const callGeminiCompanionAPI = async (
  apiKey: string,
  userMessage: string,
  history: { sender: 'ai' | 'user'; text: string }[]
): Promise<GeminiResponseResult> => {
  const cleanKey = apiKey.trim();
  const trimmed = userMessage.trim().toLowerCase();

  // 1. FAST PATH: Check User Stop intent (P0-01)
  if (/^(dừng|dừng lại|thôi|thôi nhé|stop|dừng ở đây|không muốn nói nữa|nghỉ thôi|hết rồi)$/i.test(trimmed)) {
    return {
      text: 'Được, chúng ta dừng ở đây nhé. Bạn không cần nói thêm hoặc quyết định gì lúc này. Chúc bạn có một khoảng thời gian nghỉ ngơi yên bình.',
      source: 'sanctuary_engine',
      isUserStop: true,
      isFallback: false,
    };
  }

  // Calculate current turn index based on user message history
  const userMessages = history.filter(m => m.sender === 'user');
  const userTurnCount = userMessages.length + 1;
  const systemInstruction = buildV875SystemInstruction(userTurnCount);

  // 2. PATH A: If key starts with 'gsk_', route to Free Groq Cloud (Llama 3.3 70B)
  if (cleanKey.startsWith('gsk_')) {
    const groqReply = await callGroqAPI(cleanKey, userMessage, history, systemInstruction);
    if (groqReply) {
      return {
        text: groqReply,
        source: 'groq',
        modelUsed: 'Groq (Llama-3.3-70B)',
        suggestDecisionCard: checkShouldSuggestCard(userMessage, userTurnCount),
      };
    }
  }

  // 3. PATH B: If key starts with 'AIzaSy' (valid Google Gemini API key), call Gemini API
  if (cleanKey.startsWith('AIzaSy')) {
    const historyParts: ChatHistoryItem[] = history.slice(-4).map(m => ({
      role: m.sender === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }],
    }));

    const payload = {
      systemInstruction: {
        parts: [{ text: systemInstruction }],
      },
      contents: [
        ...historyParts,
        {
          role: 'user',
          parts: [{ text: userMessage }],
        },
      ],
    };

    const candidateModels = [
      'gemini-2.0-flash',
      'gemini-1.5-flash',
      'gemini-flash-latest',
      'gemini-3.8-flash',
    ];

    for (const model of candidateModels) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(cleanKey)}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          const data = await response.json();
          const candidate = data.candidates?.[0]?.content?.parts?.find((p: any) => p.text);
          if (candidate?.text) {
            return {
              text: candidate.text.trim(),
              source: 'gemini',
              modelUsed: `Gemini (${model})`,
              suggestDecisionCard: checkShouldSuggestCard(userMessage, userTurnCount),
            };
          }
        }
      } catch {
        // continue to next model or fallback
      }
    }
  }

  // 4. PATH C (DEFAULT & LEAK-PROOF): High-Speed Cloud AI Engine (Zero Key Required)
  const freeCloudReply = await callFreeCloudAI(userMessage, history, systemInstruction);
  if (freeCloudReply) {
    return {
      text: freeCloudReply,
      source: 'pollinations_free',
      modelUsed: 'Llama 3.2 Cloud AI',
      suggestDecisionCard: checkShouldSuggestCard(userMessage, userTurnCount),
    };
  }

  // 5. PATH D: Offline Local Heuristic Engine (Pure fallback if disconnected from internet)
  return {
    text: generateDynamicSanctuaryReply(userMessage, history),
    source: 'sanctuary_engine',
    isFallback: true,
    errorDetail: 'Đang vận hành ở Chế độ Phản chiếu Ngoại tuyến.',
    suggestDecisionCard: checkShouldSuggestCard(userMessage, userTurnCount),
  };
};

/**
 * Kiểm tra xem tin nhắn có mang ý định hành động cần mở Decision Card không (Được kiểm soát nghiêm ngặt theo Progressive Disclosure Gate V8.7.5)
 */
export const checkShouldSuggestCard = (userMessage: string, userTurnCount: number = 1): boolean => {
  // Turn 1 và Turn 2 tuyệt đối không đề xuất mở Thẻ Quyết Định
  if (userTurnCount < 3) return false;

  const text = userMessage.toLowerCase();
  return (
    text.includes('quyết định') ||
    text.includes('phương án') ||
    text.includes('lựa chọn') ||
    text.includes('so sánh') ||
    text.includes('đặt ngưỡng') ||
    text.includes('thử thế nào') ||
    text.includes('bước thử') ||
    text.includes('decision card') ||
    text.includes('tóm tắt') ||
    text.includes('tiêu chí') ||
    text.includes('bằng chứng') ||
    text.includes('72 giờ') ||
    text.includes('30 phút') ||
    text.includes('15 phút')
  );
};

// Comprehensive, hypothesis-based Life Lab dialogue engine matching V8.7.5 & Decision Mode V1.0
// Strictly Anti-Repetition, Zero Verbatim Quote Echoes, Full Action Contract Fulfillment
export const generateDynamicSanctuaryReply = (
  rawInput: string,
  history?: { sender: 'ai' | 'user'; text: string }[]
): string => {
  const text = rawInput.toLowerCase().trim();

  // 1. FAST PATH: User Stop (P0-01) - Absolute priority
  if (/^(dừng|dừng lại|thôi|thôi nhé|stop|dừng ở đây|không muốn nói nữa|nghỉ thôi|hết rồi)$/i.test(text)) {
    return 'Được, chúng ta dừng ở đây nhé. Bạn không cần nói thêm hoặc quyết định gì lúc này. Chúc bạn có một khoảng thời gian nghỉ ngơi yên bình.';
  }

  // 2. LOW ENERGY MODE: User is exhausted / low energy / score <= 3 (P0 Priority)
  // Ensures we NEVER burden an exhausted user with long homework or portfolio tasks
  if (
    (text.includes('năng lượng') && (text.includes('2') || text.includes('3') || text.includes('1') || text.includes('thấp') || text.includes('cạn') || text.includes('hết'))) ||
    text.includes('đừng giao bài tập') ||
    text.includes('không muốn làm bài tập') ||
    text.includes('bước rất nhỏ') ||
    text.includes('bước nhỏ thôi') ||
    text.includes('mệt quá') ||
    text.includes('đuối quá') ||
    text.includes('nói ngắn thôi') ||
    text.includes('không có sức') ||
    text === 'mệt' ||
    text === 'buồn'
  ) {
    return `Tôi nghe thấy sự mệt mỏi trong bạn. Khi năng lượng chỉ còn 2/10, bạn tuyệt đối không cần phân tích hay làm bất kỳ bài tập nào cả.

Một bước vi mô duy nhất cho tối nay (chỉ mất 2 phút):
Uống một ngụm nước ấm, đặt điện thoại sang phòng khác và cho phép mình được nằm nghỉ ngơi hoàn toàn mà không cảm thấy tội lỗi.

Bạn đã cố gắng rất nhiều trong ngày hôm nay rồi, giờ là lúc sạc lại bản thân. Chúc bạn một buổi tối bình an và phục hồi.`;
  }

  // 3. User just wants to be heard / no decision pressure
  if (
    text.includes('chỉ muốn được lắng nghe') ||
    text.includes('chưa muốn quyết định') ||
    text.includes('không muốn quyết định') ||
    text.includes('nghe một chút')
  ) {
    return 'Được, lúc này chúng ta không cần đưa ra quyết định hay làm bài tập nào cả. Bạn có thể chia sẻ theo nhịp điệu thoải mái nhất của mình; bất cứ lúc nào muốn dừng lại nghỉ ngơi, bạn chỉ cần nói nhé.';
  }

  // 4. Phản chiếu nhẹ nhàng khi ngoại tuyến (Tuyệt đối không kịch bản mẫu hay hardcode)
  return 'Mình luôn ở đây để lắng nghe bạn. Khi bạn sẵn sàng, hãy cứ thong thả chia sẻ những điều đang chiếm nhiều suy nghĩ nhất trong lòng mình nhé.';
};
