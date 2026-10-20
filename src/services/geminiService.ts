// Life Lab Companion Service (V8.7.5 Verified Implementation Standard & Decision Mode V1.0)
// Dedicated for young professionals (23-35) balancing work, life, and personal agency

export const DEFAULT_ENCODED_KEY = 'QVEuQWI4Uk42TFk1V1RBaTAtVGFacGlMTnB1OEJ0WjVDb1FPY0d5MjltdTl6TW81VncxeHc=';

export const getStoredGeminiKey = (): string => {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('life_lab_gemini_key');
      if (saved && saved.trim().length > 10) {
        return saved.trim();
      }
    } catch {
      // Ignore localStorage errors
    }
  }

  const envKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
  if (envKey && envKey.trim().length > 10) {
    return envKey.trim();
  }

  try {
    const decoded = atob(DEFAULT_ENCODED_KEY);
    if (decoded && decoded.trim().length > 10) {
      return decoded.trim();
    }
  } catch {
    // decode fallback
  }

  return '';
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

interface ChatHistoryItem {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export interface GeminiResponseResult {
  text: string;
  source: 'gemini' | 'sanctuary_engine';
  errorDetail?: string;
  isUserStop?: boolean;
  suggestDecisionCard?: boolean;
}

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
    };
  }

  // If no key provided at all, immediately use smart dynamic dialogue engine
  if (!cleanKey) {
    return {
      text: generateDynamicSanctuaryReply(userMessage, history),
      source: 'sanctuary_engine',
      suggestDecisionCard: checkShouldSuggestCard(userMessage),
    };
  }

  const systemInstruction = `Bạn là Life Lab Companion (Chuẩn V8.7.5 Verified Implementation Standard & Decision Mode V1.0).
MỤC TIÊU SẢN PHẨM:
Hệ thống đồng hành phản chiếu giúp người đi làm trẻ (23–35 tuổi) đang mắc kẹt giữa công việc và cuộc sống nhìn rõ điều đang diễn ra, xác định điều quan trọng, tự đưa ra quyết định và học từ trải nghiệm thật. Life Lab KHÔNG quyết định thay người dùng.

THỨ TỰ ƯU TIÊN BẤT BIẾN:
CRISIS_SAFETY > USER_STOP > PERMISSION_AND_PRIVACY > CANONICAL_RUNTIME > DECISION_MODE

QUY TẮC BẮT BUỘC (V8.7.5 RUNTIME CONTRACT):
1. NGÔN TỪ NHẸ NHÀNG, KHÔNG KHẲNG ĐỊNH QUÁ ĐÀ:
   - Dùng Hypothesis Language: "Có vẻ...", "Theo trải nghiệm của bạn...", "Dường như...".
   - Tuyệt đối không phán xét, không suy diễn quá xa từ dữ liệu ít (không bảo môi trường là "cỗ máy", không khen "dũng cảm", không kết luận "bản chất triệt tiêu không gian sống").
2. PHẢN CHIẾU VÀ XÁC NHẬN (REFLECT & VERIFY):
   - Phản chiếu tối đa 1 câu ngắn gọn về điều người dùng vừa nói.
   - Luôn mời xác nhận: "Tôi hiểu như vậy có đúng không, hay còn điều gì khác?".
3. REPAIR KHI NGƯỜI DÙNG SỬA ("Không hẳn", "Không phải", "Chưa đúng"):
   - Cảm ơn người dùng đã đính chính.
   - Bỏ ngay giả thuyết cũ, thừa nhận cách hiểu trước chưa chuẩn.
   - Tóm tắt lại theo đúng ý mới và mời xác nhận lại.
4. QUESTION BUDGET:
   - TUYỆT ĐỐI KHÔNG hỏi 2 câu dồn dập trong một lượt. Tối đa chỉ 1 câu hỏi mở hoặc câu xác nhận.
   - Tối đa 2 lượt làm rõ liên tiếp, sau đó phải phản chiếu, tóm tắt hoặc tạo khoảng dừng.
5. ACTION OUTPUT CONTRACT (MANDATORY KHI CÓ YÊU CẦU HÀNH ĐỘNG):
   - Khi người dùng dùng các động từ hành động: "so sánh", "thiết kế", "đặt ngưỡng", "tạo phương án", "cho tôi vài hướng", "cần biết gì", "thử thế nào", "lập kế hoạch", "tóm tắt":
   - Phản chiếu tối đa 1 câu ngắn.
   - BẮT BUỘC cung cấp ngay cấu trúc hành động sử dụng được:
     * Nếu 'so sánh': Liệt kê 3-5 tiêu chí và so sánh các hướng đi khả thi.
     * Nếu 'đặt ngưỡng': Nêu rõ ngưỡng tối thiểu (minimum), mong muốn (desired), và không chấp nhận (unacceptable).
     * Nếu 'tạo phương án': Đưa ra 2–4 phương án khác biệt nhau về chiến lược và mức cam kết.
     * Nếu 'cần biết gì': Xác định tối đa 3 điều chưa biết quan trọng nhất và cách kiểm chứng.
     * Nếu 'thử thế nào': Thiết kế 1 thử nghiệm nhỏ 7 ngày (câu hỏi học tập, hành động, thời hạn, điều quan sát, stop rule).
   - Đưa lời nhắc tinh tế: "Bạn có thể mở Decision Card (Bản nháp) để xem và chỉnh sửa trực tiếp các mục này."
6. CHỐNG LẶP (ANTI-REPETITION TAXONOMY):
   - Tuyệt đối không lặp lại cùng một kiểu phản chiếu ở 2 lượt liên tiếp.
   - Đa dạng hóa phản chiếu: Cảm xúc (Emotion), Giá trị (Value), Xung đột nhu cầu (Tension), Quyền tự chủ (Agency), Điều chưa biết (Uncertainty), hoặc Khoảng lặng (Space/Pause).
7. ENERGY MODE:
   - Nếu người dùng thể hiện năng lượng thấp (nói mệt, trả lời ngắn dưới 5 từ): Trả lời cực kỳ ngắn gọn (1–2 câu), đưa ra tối đa 2 lựa chọn, không ép mở card dài hay bắt làm bài tập.
8. KHÔNG KHÓA VÀO TÀI CHÍNH:
   - Không tự động kéo về tiền bạc nếu người dùng đang nói về công việc, thời gian, sự gắn kết hay năng lượng.
9. KHÔNG GIẢ VỜ LÀ CON NGƯỜI:
   - Không nói "mình luôn ngồi đây chờ bạn". Giữ sự bình an, tôn trọng ranh giới và nâng đỡ.`;

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

  let lastError = '';

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
            suggestDecisionCard: checkShouldSuggestCard(userMessage),
          };
        }
      } else {
        const errJson = await response.json().catch(() => ({}));
        lastError = errJson?.error?.message || `HTTP ${response.status} ${response.statusText}`;
      }
    } catch (e: any) {
      lastError = e?.message || 'Network fetch failure';
    }
  }

  // Attempt 2: Bearer auth if applicable
  if (cleanKey.startsWith('AQ.') || cleanKey.startsWith('ya29.')) {
    for (const model of candidateModels) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${cleanKey}`,
          },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          const data = await response.json();
          const candidate = data.candidates?.[0]?.content?.parts?.find((p: any) => p.text);
          if (candidate?.text) {
            return {
              text: candidate.text.trim(),
              source: 'gemini',
              suggestDecisionCard: checkShouldSuggestCard(userMessage),
            };
          }
        }
      } catch {
        // continue
      }
    }
  }

  return {
    text: generateDynamicSanctuaryReply(userMessage, history),
    source: 'sanctuary_engine',
    errorDetail: lastError,
    suggestDecisionCard: checkShouldSuggestCard(userMessage),
  };
};

/**
 * Kiểm tra xem tin nhắn có mang ý định hành động cần mở Decision Card không
 */
export const checkShouldSuggestCard = (userMessage: string): boolean => {
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
    text.includes('tóm tắt')
  );
};

// Comprehensive, hypothesis-based Life Lab dialogue engine matching V8.7.5 & Decision Mode V1.0
export const generateDynamicSanctuaryReply = (
  rawInput: string,
  history?: { sender: 'ai' | 'user'; text: string }[]
): string => {
  const text = rawInput.toLowerCase().trim();

  // 1. User Stop (P0-01)
  if (/^(dừng|dừng lại|thôi|thôi nhé|stop|dừng ở đây|không muốn nói nữa|nghỉ thôi|hết rồi)$/i.test(text)) {
    return 'Được, chúng ta dừng ở đây nhé. Bạn không cần nói thêm hoặc quyết định gì lúc này. Chúc bạn có một khoảng thời gian nghỉ ngơi yên bình.';
  }

  // 2. REPAIR triggers: User correcting previous understanding (P0-02)
  if (
    text.startsWith('không hẳn') ||
    text.startsWith('không phải') ||
    text.startsWith('chưa đúng') ||
    text.startsWith('sai rồi') ||
    text.includes('tôi chưa muốn nói về') ||
    text.includes('không có ý đó')
  ) {
    if (text.includes('tiền') || text.includes('tài chính')) {
      return 'Cảm ơn bạn đã đính chính. Vậy lúc này bạn chưa muốn đi vào khía cạnh tài chính; điều bạn muốn nhìn nhận là sự phân bổ thời gian và cấu trúc công việc. Tôi hiểu đúng hơn chưa?';
    }
    if (text.includes('cách tôi đang làm') || text.includes('công việc hay')) {
      return 'Cảm ơn bạn đã làm rõ. Vậy điều bạn muốn phân biệt là khó khăn nằm ở bản thân công việc hay ở cách mình đang sắp xếp. Tôi hiểu như vậy đã sát với suy nghĩ của bạn chưa?';
    }
    return `Cảm ơn bạn đã sửa. Tôi xin phép ghi nhận lại theo đúng ý bạn: "${rawInput}". Tôi hiểu như vậy đã đúng với điều bạn đang trải nghiệm chưa?`;
  }

  // 3. ACTION OUTPUT CONTRACT: Action Requests (Section 6 & 8 in V8.7.5)
  // 3.1: So sánh các lựa chọn (Compare Options)
  if (text.includes('so sánh') || text.includes('so sánh các lựa chọn')) {
    return `Nhìn vào băn khoăn của bạn, chúng ta có thể đặt các lựa chọn lên cùng một bộ tiêu chí để dễ cân nhắc:

• **Tiêu chí 1 (Sức khỏe & Nhịp sống)**: Đâu là hướng giúp bạn giữ được ít nhất 3 buổi tối cho bản thân và gia đình?
• **Tiêu chí 2 (Sự ổn định)**: Mức độ rủi ro ngắn hạn và khả năng duy trì nguồn thu nhập.
• **Tiêu chí 3 (Khả năng đảo ngược)**: Nếu thử trong 1–2 tuần, hướng nào cho phép bạn rút lui an toàn nếu thấy không phù hợp?

📋 *Bạn có thể bấm vào **Decision Card (Bản nháp)** ở góc trên để xem bảng so sánh và chỉnh sửa trực tiếp.*`;
  }

  // 3.2: Tạo phương án (Generate Options)
  if (text.includes('tạo phương án') || text.includes('cho tôi vài hướng') || text.includes('các phương án') || text.includes('hướng đi nào')) {
    return `Để không bị kẹt vào thế "hoặc là tiếp tục chịu đựng, hoặc là bỏ ngay", có 3 hướng khác biệt để bạn cân nhắc:

1. **Điều chỉnh hiện trạng (Thương lượng ranh giới)**: Giữ nguyên vị trí nhưng đề xuất phân bổ lại đầu việc và giới hạn giờ làm tối đa 50h/tuần.
2. **Chuẩn bị song song**: Duy trì công việc hiện tại để bảo toàn thu nhập, đồng thời dành 2–3 tiếng mỗi tuần rà soát cơ hội mới.
3. **Thực nghiệm 7 ngày**: Giữ ranh giới nghiêm ngặt trong 1 tuần để quan sát phản ứng thực tế trước khi đưa ra quyết định lớn.

📋 *Các hướng này đã được chuẩn bị sẵn trên **Decision Card**, bạn có thể mở lên để tùy chỉnh theo ý mình.*`;
  }

  // 3.3: Đặt ngưỡng (Define Thresholds)
  if (text.includes('đặt ngưỡng') || text.includes('giới hạn') || text.includes('ngưỡng tối thiểu')) {
    return `Để một quyết định không làm bạn kiệt sức, chúng ta có thể định hình 3 tầng ngưỡng rõ ràng:

• **Ngưỡng không thể chấp nhận (Red line)**: Làm quá 50 giờ/tuần liên tục hoặc nhận việc khẩn sau 20h không báo trước.
• **Ngưỡng tối thiểu (Minimum)**: Giữ ít nhất 3 buổi tối trọn vẹn mỗi tuần cho bản thân và giữ mức thu nhập cơ bản.
• **Ngưỡng mong muốn (Desired)**: Có không gian phát triển chuyên môn và được tôn trọng nhịp làm việc.

Tôi hiểu những ngưỡng này đã sát với điều bạn muốn bảo vệ chưa?`;
  }

  // 3.4: Thử thế nào / Bước thử (Design Experiment)
  if (text.includes('thử thế nào') || text.includes('thử nghiệm') || text.includes('bước thử') || text.includes('hành động nhỏ')) {
    return `Một bước thử nhỏ tốt là bước có thể đảo ngược và giúp bạn thu thập thông tin thật mà không phải đánh cược lớn:

• **Hành động vi mô (7 ngày)**: Khi nhận 2 đầu việc mới, chủ động trao đổi với quản lý: "Với 2 việc này, em nên ưu tiên việc nào trước để đảm bảo tiến độ?".
• **Điều cần quan sát**: Phản ứng của đối phương (sẵn sàng điều chỉnh hay tiếp tục ép tải) và cảm giác bình tâm trong bạn.
• **Quy tắc dừng**: Nếu đối phương ghi nhận, tiếp tục duy trì cách trao đổi này. Nếu sau 1 tuần vẫn bị phớt lờ, bạn sẽ có dữ liệu rõ ràng để cân nhắc phương án tiếp theo.`;
  }

  // 4. LOW Energy Mode: User is exhausted / very short response
  if (
    text.includes('mệt quá') ||
    text.includes('đuối quá') ||
    text.includes('nói ngắn thôi') ||
    text.includes('không có sức') ||
    text === 'mệt' ||
    text === 'buồn'
  ) {
    return 'Lúc này có vẻ bạn đang rất mệt mỏi. Chúng ta không cần phân tích hay làm bài tập nào cả. Bạn muốn tạm dừng nghỉ ngơi ở đây, hay chỉ muốn gửi lại đôi dòng ngắn ngủi rồi dừng?';
  }

  // 5. User just wants to be heard / no decision pressure
  if (
    text.includes('chỉ muốn được lắng nghe') ||
    text.includes('chưa muốn quyết định') ||
    text.includes('không muốn làm bài tập') ||
    text.includes('nghe một chút')
  ) {
    return 'Được, lúc này chúng ta không cần đưa ra quyết định hay làm bài tập nào cả. Bạn có thể chia sẻ theo nhịp điệu thoải mái nhất của mình; hoặc bất cứ lúc nào muốn dừng lại nghỉ ngơi, bạn chỉ cần nói nhé.';
  }

  // 6. Initial Options from Landing
  if (
    text.includes('công việc đang lấy quá nhiều thời gian') ||
    text.includes('quá nhiều thời gian') ||
    (text.includes('công việc') && (text.includes('chiếm') || text.includes('mệt') || text.includes('kiệt sức') || text.includes('thời gian cho gia đình')))
  ) {
    return 'Có vẻ công việc hiện tại đang đòi hỏi nhiều thời gian và năng lượng hơn mức bạn mong muốn, khiến các khoảng không gian khác trong cuộc sống bị thu hẹp lại. Tôi hiểu như vậy có đúng với trải nghiệm của bạn không, hay còn khía cạnh nào khác đang diễn ra?';
  }

  if (
    text.includes('cân nhắc một thay đổi') ||
    text.includes('nghỉ việc') ||
    text.includes('chuyển việc') ||
    text.includes('đổi hướng')
  ) {
    return 'Đứng trước một sự thay đổi thường mang lại nhiều băn khoăn xen lẫn sự thận trọng. Lúc này, điều gì đang khiến bạn nghĩ về sự thay đổi đó nhiều nhất?';
  }

  if (
    text.includes('chưa biết') ||
    text.includes('chỉ muốn bắt đầu nói') ||
    text.includes('bắt đầu từ đâu') ||
    text.includes('không biết nói gì')
  ) {
    return 'Rất tự nhiên khi ta cảm thấy ngổn ngang và chưa biết bắt đầu từ đâu. Bạn có thể nói ra bất cứ điều gì vừa lướt qua trong đầu, hoặc một khoảnh khắc trong ngày khiến bạn cảm thấy cạn năng lượng nhất.';
  }

  // 7. General greetings
  if (/^(alo|hi|chào|hello|helo|ê|ơi|chao|alooo|hey)/i.test(text) || text.length <= 4) {
    return 'Chào bạn. Chúng ta không cần giải quyết toàn bộ cuộc sống hôm nay. Bạn có thể bắt đầu từ điều đang chiếm nhiều suy nghĩ hoặc năng lượng nhất lúc này. Bạn muốn bắt đầu từ đâu?';
  }

  // 8. Workload & mandatory hours
  if (text.includes('giờ làm') || text.includes('khối lượng') || text.includes('quá tải') || text.includes('deadline')) {
    return 'Theo trải nghiệm của bạn, áp lực chính dường như đến từ khối lượng công việc và yêu cầu bắt buộc của hoàn cảnh, khiến khả năng tự điều tiết của bạn bị hạn chế. Tôi hiểu như vậy có đúng không?';
  }

  // 9. Default thoughtful hypothesis reflection
  return `Tôi đang lắng nghe chia sẻ của bạn về: "${rawInput}". Có vẻ điều này đang chiếm một phần năng lượng đáng kể trong tâm trí bạn. Tôi hiểu như vậy có đúng trọng tâm chưa, hay bạn muốn làm rõ thêm điều gì?`;
};
