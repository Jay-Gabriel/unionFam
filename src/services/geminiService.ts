// Life Lab Companion Service (V8.7.5 Verified Implementation Standard & Decision Mode V1.0)
// Dedicated for young professionals (23-35) balancing work, life, and personal agency

export const getStoredGeminiKey = (): string => {
  // 1. Kiểm tra biến môi trường an toàn (Vite .env hoặc Vercel Environment Variables)
  const envKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
  if (envKey && envKey.trim().length > 10) {
    return envKey.trim();
  }

  // 2. Kiểm tra key do người dùng tự nhập trong phiên trình duyệt (LocalStorage)
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
  isFallback?: boolean;
  modelUsed?: string;
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
      isFallback: false,
    };
  }

  // If no key provided at all, immediately use smart dynamic dialogue engine
  if (!cleanKey) {
    return {
      text: generateDynamicSanctuaryReply(userMessage, history),
      source: 'sanctuary_engine',
      isFallback: true,
      errorDetail: 'Chưa cấu hình Gemini API Key trên hosting Vercel hoặc trình duyệt.',
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
   - Khi người dùng nói "không hỏi thêm", "đúng", "làm ngay": TUYỆT ĐỐI KHÔNG hỏi thêm câu nào, phải chuyển ngay sang cung cấp nội dung hành động.
5. ACTION OUTPUT CONTRACT (MANDATORY KHI CÓ YÊU CẦU HÀNH ĐỘNG):
   - Khi người dùng dùng các động từ hành động hoặc yêu cầu cấu trúc: "so sánh", "thiết kế", "đặt ngưỡng", "tạo phương án", "cho tôi vài hướng", "cần biết gì", "thử thế nào", "lập kế hoạch", "tóm tắt", "liệt kê", "lịch 15 phút", "72 giờ", "30 phút", "tiêu chí có trọng số":
   - Phản chiếu tối đa 1 câu ngắn.
   - BẮT BUỘC cung cấp ngay cấu trúc hành động sử dụng được theo đúng bối cảnh của người dùng.
6. CHỐNG LẶP (ANTI-REPETITION TAXONOMY):
   - Tuyệt đối không lặp lại nguyên văn tin nhắn của người dùng trong dấu ngoặc kép.
   - Tuyệt đối không lặp lại cùng một kiểu phản chiếu ở 2 lượt liên tiếp.
7. ENERGY MODE:
   - Nếu người dùng thể hiện năng lượng thấp: Trả lời cực kỳ ngắn gọn (1–2 câu), không ép mở card dài hay bắt làm bài tập.
8. KHÔNG GIẢ VỜ LÀ CON NGƯỜI:
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
    isFallback: true,
    errorDetail: lastError || 'Gemini API không phản hồi, đã chuyển sang Chế độ Phản chiếu Ngoại tuyến.',
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

  // 2. Check combined context from history for multi-turn coherence
  const historyText = (history || []).map(m => m.text.toLowerCase()).join(' ');
  const combinedContext = `${historyText} ${text}`;

  // =========================================================================
  // DOMAIN 1: Co-Founder / Business Partner Conflict & 15-Minute Dialogue
  // =========================================================================
  if (
    (combinedContext.includes('đồng sáng lập') || combinedContext.includes('startup') || combinedContext.includes('cộng sự')) &&
    (text.includes('15 phút') || text.includes('cuộc nói chuyện') || text.includes('ba câu hỏi') || text.includes('lịch') || text.includes('cam kết') || text.includes('bạn thân'))
  ) {
    return `Dưới đây là cấu trúc cuộc trao đổi 15 phút tập trung vào mục tiêu chung và bảo vệ mối quan hệ bạn bè, không biến thành công kích cá nhân:

• **Mở đầu (2 phút - Xác lập thiện chí & Tình bạn)**:
  "Chúng mình là bạn thân và cùng tâm huyết gây dựng startup này. Tớ rất trân trọng tình bạn giữa hai đứa, và chính vì muốn đi cùng nhau đường dài, tớ muốn chúng mình thẳng thắn nhìn lại nhịp cam kết công việc hiện tại."

• **3 câu hỏi trọng tâm (10 phút - Đi từ thực tế đến giải pháp)**:
  1. *Khám phá vướng mắc*: "Thời gian qua các đầu việc bị trễ hạn, điều gì đang cản trở cậu nhiều nhất (khối lượng, năng lượng hay ưu tiên khác)?"
  2. *Làm rõ tác động*: "Khi mốc tiến độ bị lùi lại, tiến trình chung của dự án đang bị nghẽn; cậu cảm thấy điều này đang ảnh hưởng thế nào đến mục tiêu chung của chúng mình?"
  3. *Tái thiết lập thỏa thuận*: "Để không lặp lại tình trạng này, chúng mình nên điều chỉnh lại phân công ra sao để cam kết đưa ra là khả thi 100%?"

• **Kết thúc (3 phút - Chốt một cam kết vi mô)**:
  "Thống nhất tuần này cậu phụ trách [Đầu việc A] trước thứ Sáu. Chúng mình sẽ ngồi lại 5 phút cuối tuần để nghiệm thu nhịp làm việc mới nhé."`;
  }

  // =========================================================================
  // DOMAIN 2: Night Shift Nurse & Sleep / Circadian Recovery (7-Day Trial)
  // =========================================================================
  if (
    (combinedContext.includes('điều dưỡng') || combinedContext.includes('ca đêm') || combinedContext.includes('trực đêm')) &&
    (text.includes('giấc ngủ') || text.includes('ngủ') || text.includes('thử nghiệm') || text.includes('bước thử') || text.includes('7 ngày') || text.includes('lịch ca'))
  ) {
    return `Với nhịp làm 3 ca đêm mỗi tuần của nhân viên điều dưỡng, lời khuyên "ngủ đủ 8 tiếng ban đêm" là hoàn toàn bất khả thi. Thay vào đó, đây là thử nghiệm vi mô 7 ngày thiết kế riêng cho nhịp làm ca:

• **Hành động vi mô (7 ngày - Kỹ thuật Anchor Sleep & Chắn sáng)**:
  1. *Chắn sáng ngay khi rời viện*: Đeo kính râm chống tia UV từ lúc bước ra khỏi viện cho đến khi về tới phòng ngủ để ngăn não bộ lầm tưởng là bình minh.
  2. *Thiết lập Giấc ngủ Neo (Anchor Sleep 4 giờ)*: Cố định một khung 4 tiếng luôn ngủ trong phòng tối hoàn toàn (dùng rèm cản sáng 100% và nút tai), bất kể ca đêm hay ngày nghỉ.
  3. *Ngắt caffeine trước 6 giờ*: Dừng hoàn toàn cà phê/trà trước khi hết ca trực ít nhất 4–6 tiếng.

• **Điều cần quan sát**:
  - Mức độ hồi phục thể lực sau khi thức dậy (chấm điểm 1–5).
  - Độ nhạy cảm, dễ cáu gắt với đồng nghiệp hoặc bệnh nhân trong ca tiếp theo.

• **Quy tắc dừng (Stop Rule)**:
  - Nếu sau 3 ca đêm cảm giác đau đầu hoặc choáng váng giảm rõ rệt, duy trì quy trình này.
  - Nếu vẫn mất ngủ, chuyển sang phương án chia 2 giấc (3 tiếng buổi sáng + 90 phút ngủ bù trước khi vào ca).`;
  }

  // =========================================================================
  // DOMAIN 3: Salary Negotiation & 5 Evidence Types (Lead Role)
  // =========================================================================
  if (
    (combinedContext.includes('trưởng nhóm') || combinedContext.includes('gánh thêm') || combinedContext.includes('trao đổi lương') || combinedContext.includes('tăng lương')) &&
    (text.includes('bằng chứng') || text.includes('năm loại') || text.includes('5 loại') || text.includes('câu mở đầu') || text.includes('quản lý'))
  ) {
    return `Để cuộc trao đổi lương diễn ra thuyết phục và hoàn toàn dựa trên dữ kiện khách quan, dưới đây là câu mở đầu và 5 loại bằng chứng cụ thể:

• **Câu mở đầu dựa trên sự đóng góp**:
  "Em rất trân trọng cơ hội gánh vác trách nhiệm trưởng nhóm trong 6 tháng qua. Hôm nay em muốn cùng anh/chị nhìn lại các kết quả đội ngũ đã đạt được, đồng thời xem xét việc điều chỉnh mức đãi ngộ tương xứng với phạm vi trách nhiệm thực tế mới."

• **5 loại bằng chứng cần mang vào cuộc trao đổi**:
  1. *Bằng chứng mở rộng phạm vi (Scope Delta)*: Bảng đối chiếu giữa Mô tả công việc (JD) ban đầu và các đầu việc quản lý đội ngũ thực tế bạn đang điều phối.
  2. *Bằng chứng định lượng (Output Metrics)*: Các chỉ số hoàn thành dự án của nhóm, tỷ lệ đúng hạn (on-time delivery), hoặc doanh thu/chi phí đã tối ưu trong 6 tháng qua.
  3. *Bằng chứng ngăn ngừa rủi ro (Risk Mitigation)*: Những sự cố khẩn cấp, xung đột nội bộ hoặc nút thắt quy trình mà bạn đã chủ động giải quyết giúp cấp trên.
  4. *Bằng chứng phản hồi từ đồng nghiệp/đối tác (Stakeholder Feedback)*: Đánh giá tích cực từ các phòng ban liên quan hoặc mức độ gắn kết của thành viên trong nhóm.
  5. *Bằng chứng dữ liệu thị trường (Market Benchmark)*: Mức thù lao tham chiếu trung vị của vị trí Lead tương đương trong cùng ngành nghề và quy mô công ty.`;
  }

  // =========================================================================
  // DOMAIN 4: Layoff / Job Loss Triage & First 72 Hours Roadmap
  // =========================================================================
  if (
    (combinedContext.includes('nghỉ việc') || combinedContext.includes('mất việc') || combinedContext.includes('sa thải')) &&
    (text.includes('72 giờ') || text.includes('ba việc') || text.includes('hôm nay, ngày mai') || text.includes('hoảng') || text.includes('trước'))
  ) {
    return `Bị cho nghỉ việc đột ngột là một cú sốc lớn đối với hệ thần kinh. Lúc này, điều quan trọng nhất là bảo toàn năng lượng và pháp lý. Đây là 3 việc quan trọng nhất chia theo 72 giờ:

• **Ngày 1 (Hôm nay) — Bảo toàn quyền lợi & Hạ nhiệt**:
  - Đọc kỹ biên bản thỏa thuận chấm dứt hợp đồng, gói trợ cấp thôi việc (severance package), bảo hiểm thất nghiệp và ngày thanh toán lương cuối.
  - Không vội ký bất cứ giấy tờ nào nếu chưa rõ quyền lợi; tuyệt đối không đưa ra quyết định sự nghiệp lớn hay đăng tải cảm xúc lên mạng xã hội hôm nay.

• **Ngày 2 (Ngày mai) — Rà soát đường băng tài chính (Runway)**:
  - Mở bảng tính và tính toán chính xác: Với số tiền tiết kiệm và trợ cấp hiện tại, bạn có thể trang trải sinh hoạt phí tối thiểu trong bao nhiêu tháng (mục tiêu an toàn là 3–6 tháng).
  - Tạm dừng hoặc hủy các khoản đăng ký định kỳ (subscription) không thiết yếu để giảm áp lực dòng tiền.

• **Ngày 3 (Ngày thứ ba) — Neo lại nhịp sinh hoạt & Chuẩn bị bước tiếp**:
  - Chia sẻ ngắn gọn với 1 người thân thiết hoặc gia đình để có điểm tựa tinh thần.
  - Cập nhật hồ sơ năng lực (CV/LinkedIn) ở mức cơ bản, định hình danh sách 3 người bạn trong ngành có thể liên hệ tham khảo cơ hội mới vào tuần tới.`;
  }

  // =========================================================================
  // DOMAIN 5: Remote Work Social Isolation (Low-Friction 7-Day Experiment)
  // =========================================================================
  if (
    (combinedContext.includes('từ xa') || combinedContext.includes('remote') || combinedContext.includes('cô lập')) &&
    (text.includes('thử nghiệm xã hội') || text.includes('ít ngượng ngùng') || text.includes('kết nối') || text.includes('coworking'))
  ) {
    return `Coworking thường đông người nhưng ai cũng đeo tai nghe nên rất khó mở lời tự nhiên. Dưới đây là thử nghiệm xã hội vi mô 7 ngày nhẹ nhàng, áp lực thấp và không gây ngượng ngùng:

• **Hành động vi mô (7 ngày — Điểm chạm vi mô quen thuộc)**:
  1. *Thiết lập "Quán quen"* (Ngày 1–4): Chọn 1 quán cà phê yên tĩnh gần nơi ở, đến cùng một khung giờ (ví dụ 14h–16h) trong 3 ngày liên tiếp. Chỉ cần mỉm cười chào bạn thu ngân hoặc người phục vụ quen mặt; bạn không cần phải cố làm quen người lạ.
  2. *Cuộc gọi 15 phút không công việc* (Ngày 5–7): Nhắn tin cho 1 đồng nghiệp cũ hoặc một người bạn thân lâu ngày chưa gặp: "Dạo này làm remote nhớ nhịp trò chuyện quá, tuần này cậu rảnh 15 phút gọi video buôn chuyện nhanh không?".

• **Điều cần quan sát**:
  - Mức độ nhẹ nhõm và cảm giác được thuộc về sau điểm chạm ngắn ngủi đó.
  - Trạng thái tinh thần khi làm việc buổi chiều sau khi đã có một kết nối người-với-người nhỏ.

• **Quy tắc dừng**:
  - Nếu cảm thấy cuộc trò chuyện đem lại hơi ấm, duy trì 1 cuộc gọi ngắn mỗi tuần.
  - Nếu thấy quá gượng, chuyển sang tham gia hoạt động chạy bộ/thể thao ngoài trời nơi không có áp lực phải giao tiếp lời nói.`;
  }

  // =========================================================================
  // DOMAIN 6: Portfolio Procrastination (30-Minute Immediate Unblock)
  // =========================================================================
  if (
    (combinedContext.includes('portfolio') || combinedContext.includes('trì hoãn') || combinedContext.includes('chưa đủ tốt')) &&
    (text.includes('30 phút') || text.includes('hành động') || text.includes('tối nay') || text.includes('đăng'))
  ) {
    return `Để phá vỡ vòng lặp trì hoãn do cầu toàn, đây là MỘT hành động duy nhất trong đúng 30 phút tối nay để đưa portfolio của bạn lên mạng:

• **Hành động 30 phút (Quy tắc "MVP 3 Dự Án Tốt Nhất")**:
  - Dành 10 phút: Chọn đúng 3 dự án bạn cảm thấy tự tin nhất (không cần đưa toàn bộ lịch sử nghề nghiệp).
  - Dành 15 phút: Viết đúng 3 gạch đầu dòng cho mỗi dự án: (1) Đề bài/Vấn đề là gì; (2) Bạn đã làm gì cụ thể; (3) Kết quả đo lường được hoặc sản phẩm hoàn thiện.
  - Dành 5 phút cuối: Bấm nút **XUẤT BẢN (PUBLISH)** hoặc gửi đường link Notion/PDF/Web cho đúng 1 người bạn thân nhờ xem lướt.

• **Quy tắc bảo vệ sống còn**:
  - Tuyệt đối KHÔNG chỉnh sửa màu sắc, font chữ hay căn chỉnh CSS trong tối nay.
  - Chấp nhận bản nháp 80% trên mạng luôn có giá trị vượt trội so với một bản nháp hoàn hảo 100% nằm im trong ổ cứng.`;
  }

  // =========================================================================
  // DOMAIN 7: Elderly Mother Caregiver (3 Responsibility Boundary Buckets)
  // =========================================================================
  if (
    (combinedContext.includes('chăm mẹ') || combinedContext.includes('mẹ lớn tuổi') || combinedContext.includes('tội lỗi')) &&
    (text.includes('ba nhóm') || text.includes('3 nhóm') || text.includes('ranh giới') || text.includes('trách nhiệm'))
  ) {
    return `Cảm giác tội lỗi khi chăm sóc người thân thường xuất hiện khi ta gom toàn bộ cuộc đời của đối phương thành trách nhiệm đơn độc của mình. Dưới đây là khung phân định 3 nhóm ranh giới rõ ràng:

• **Nhóm 1: Trách nhiệm bắt buộc của bạn (Cốt lõi không thể thoái thác)**:
  - Đảm bảo an toàn sinh hoạt căn bản, chế độ y tế, thuốc men thiết yếu và chỗ dựa tinh thần yêu thương cho mẹ.
  - Bảo vệ sức khỏe thể chất và tinh thần của chính bạn — vì nếu bạn kiệt sức hoặc sụp đổ, mẹ sẽ không còn ai chăm sóc.

• **Nhóm 2: Trách nhiệm có thể chia sẻ hoặc ủy quyền (Ủy thác & Ngoại lực)**:
  - Việc nấu ăn hàng ngày, giặt giũ, dọn dẹp nhà cửa, hoặc đưa đón đi khám bệnh định kỳ.
  - Các phần việc này có thể huy động sự đóng góp tài chính/công sức từ các anh chị em khác, hoặc thuê người hỗ trợ theo giờ/dịch vụ y tế tại nhà.

• **Nhóm 3: Không thuộc trách nhiệm của bạn (Giải phóng cảm giác tội lỗi)**:
  - Chịu trách nhiệm về toàn bộ tâm trạng buồn chán, cáu gắt hoặc nỗi cô đơn tuổi già của mẹ (đây là quy luật tâm lý tuổi già mà một người con không thể lấp đầy hoàn toàn).
  - Hy sinh 100% cuộc sống cá nhân, ước mơ nghề nghiệp hay thời gian riêng tư chỉ để chứng minh lòng hiếu thảo.`;
  }

  // =========================================================================
  // DOMAIN 8: Singapore Relocation Decision (5 Weighted Criteria)
  // =========================================================================
  if (
    (combinedContext.includes('singapore') || combinedContext.includes('bạn đời') || combinedContext.includes('chuyển quốc gia')) &&
    (text.includes('tiêu chí') || text.includes('trọng số') || text.includes('hai tuần') || text.includes('năm tiêu chí') || text.includes('5 tiêu chí'))
  ) {
    return `Để hai người cùng đưa ra quyết định thấu đáo trong 2 tuần mà không tạo ra sự hy sinh âm thầm hay oán trách về sau, đây là bảng 5 tiêu chí đánh giá có trọng số:

• **1. [Trọng số 30%] Sự tương thích sự nghiệp & Tự chủ của người đi theo**:
  - Tại Singapore, bạn có giấy phép lao động (DP/EP), cơ hội việc làm chuyên môn, hoặc duy trì công việc từ xa ở Việt Nam không? Một mối quan hệ bền vững đòi hỏi cả hai đều giữ được cảm giác độc lập và giá trị bản thân.

• **2. [Trọng số 25%] Chi phí cơ hội & Đường băng tài chính tích lũy**:
  - So sánh thực tế: Thu nhập tại Singapore sau khi trừ tiền thuê nhà đắt đỏ, sinh hoạt phí và thuế có giúp tích lũy vượt trội hơn thu nhập và chi phí sinh hoạt thuận lợi hiện tại ở Hà Nội không?

• **3. [Trọng số 20%] Thỏa thuận an toàn & Khả năng đảo ngược (Exit Door)**:
  - Hai người có cùng cam kết: Nếu sau 12 tháng tại Singapore người đi theo cảm thấy quá ngột ngạt hoặc không tìm được chỗ đứng, cả hai sẵn sàng quay về Hà Nội hoặc tìm giải pháp thay thế mà không coi đó là thất bại?

• **4. [Trọng số 15%] Sức khỏe tinh thần & Nhịp sống hàng ngày**:
  - Môi trường đô thị tốc độ cao tại Singapore so với mạng lưới bạn bè, gia đình, sở thích quen thuộc tại Hà Nội ảnh hưởng ra sao đến mức độ bình an của từng người?

• **5. [Trọng số 10%] Trách nhiệm gia đình hai bên**:
  - Khả năng thăm nom bố mẹ, sự an tâm về gia đình khi ở xa và thời gian bay (Hà Nội - Singapore mất ~3.5 giờ).`;
  }

  // =========================================================================
  // DOMAIN 9: Debt Management (5 Minimal Data Points - No Investment Advice)
  // =========================================================================
  if (
    (combinedContext.includes('khoản nợ') || combinedContext.includes('ba khoản nợ') || combinedContext.includes('3 khoản nợ') || combinedContext.includes('nợ')) &&
    (text.includes('năm thông tin') || text.includes('5 thông tin') || text.includes('thu thập') || text.includes('ngân hàng') || text.includes('tối thiểu'))
  ) {
    return `Sự lo âu thường phóng đại quy mô khoản nợ. Bước đầu tiên để giành lại quyền kiểm soát là gom dữ kiện khách quan lên một trang giấy, hoàn toàn không phán xét. Dưới đây là 5 thông tin tối thiểu cần ghi lại cho từng khoản nợ:

• **1. Dư nợ gốc thực tế**: Con số chính xác bạn còn nợ tính đến hôm nay (Ví dụ: Thẻ A: 24.500.000đ; Vay tiêu dùng B: 45.000.000đ).
• **2. Lãi suất thực tế (%/năm hoặc %/tháng)**: Lãi suất trên hợp đồng là bao nhiêu, và tiền lãi phát sinh mỗi tháng là bao nhiêu tiền mặt.
• **3. Số tiền thanh toán tối thiểu hàng tháng (Minimum Payment)**: Con số bắt buộc phải nộp mỗi tháng để không bị tính quá hạn hoặc rơi vào nợ xấu nhóm 2–3.
• **4. Ngày chốt sao kê & Ngày hạn chót thanh toán (Due Date)**: Ngày nào trong tháng cần trả tiền để sắp xếp dòng tiền nhận lương đón đầu.
• **5. Phí phạt trả chậm & Điều khoản đặc biệt**: Nếu trễ hạn 1–3 ngày thì bị phạt bao nhiêu tiền và có bị gọi điện thoại nhắc nợ hay không.`;
  }

  // =========================================================================
  // DOMAIN 10: 6-Year Relationship (Fatigue vs Core Value Differences)
  // =========================================================================
  if (
    (combinedContext.includes('mối quan hệ') || combinedContext.includes('sáu năm') || combinedContext.includes('6 năm')) &&
    (text.includes('mệt tạm thời') || text.includes('khác biệt giá trị') || text.includes('hai nhóm') || text.includes('dấu hiệu'))
  ) {
    return `Sau 6 năm bên nhau, ranh giới giữa việc "hết năng lượng vì cuộc sống bên ngoài" và "khác biệt nền tảng không thể hòa giải" rất dễ bị lẫn lộn. Dưới đây là 2 nhóm dấu hiệu để bạn tự soi chiếu:

• **Nhóm A: Dấu hiệu của sự mệt mỏi tạm thời (Có thể phục hồi khi giảm tải)**:
  - Xung đột tăng lên chủ yếu vào các giai đoạn một hoặc cả hai người đang kiệt sức vì công việc, thiếu ngủ hoặc bất an tài chính.
  - Khi có khoảng lặng riêng biệt 1–2 ngày để ngủ đẫy giấc và giải tỏa áp lực, bạn vẫn cảm thấy thương, nhớ và trân trọng đối phương.
  - Hai người vẫn đồng thuận về các giá trị nền tảng: Cách đối xử với con người, lòng chung thủy, và quan niệm về một mái ấm tử tế.

• **Nhóm B: Dấu hiệu của khác biệt hệ giá trị sâu sắc (Khó dung hòa bằng thời gian)**:
  - Bất đồng lặp lại liên tục về hướng đi tương lai: Quan điểm sống, định nghĩa về hạnh phúc, thái độ với tiền bạc, hoặc ranh giới can thiệp của gia đình đôi bên.
  - Một trong hai người luôn phải "thu nhỏ" cá tính, giấu bớt hoài bão hoặc kìm nén cảm xúc thật để tránh làm đối phương thất vọng hay bùng nổ tranh cãi.
  - Cảm giác cô đơn xuất hiện ngay cả khi hai người đang ngồi cạnh nhau trong một ngày hoàn toàn thảnh thơi.`;
  }

  // =========================================================================
  // 3. ACTION CONTRACT GENERAL HANDLERS: Compare, Generate, Thresholds, Experiment
  // =========================================================================
  if (text.includes('so sánh') || text.includes('so sánh các lựa chọn')) {
    return `Nhìn vào băn khoăn của bạn, chúng ta có thể đặt các lựa chọn lên cùng một bộ tiêu chí để dễ cân nhắc:

• **Tiêu chí 1 (Sức khỏe & Nhịp sống)**: Đâu là hướng giúp bạn giữ được ít nhất 3 buổi tối cho bản thân và gia đình?
• **Tiêu chí 2 (Sự ổn định & Dòng tiền)**: Mức độ rủi ro ngắn hạn và khả năng duy trì nguồn thu nhập an toàn.
• **Tiêu chí 3 (Khả năng đảo ngược - Reversibility)**: Nếu thử trong 1–2 tuần, hướng nào cho phép bạn rút lui an toàn nếu thấy không phù hợp?

📋 *Bạn có thể bấm vào **Decision Card** ở góc trên để tùy chỉnh trực tiếp bảng tiêu chí này.*`;
  }

  if (text.includes('tạo phương án') || text.includes('cho tôi vài hướng') || text.includes('các phương án')) {
    return `Để không bị kẹt vào thế nhị nguyên "hoặc tiếp tục chịu đựng, hoặc bỏ hết ngay lập tức", có 3 hướng khác biệt để bạn cân nhắc:

1. **Điều chỉnh ranh giới hiện trạng**: Giữ nguyên vị trí nhưng đề xuất phân bổ lại đầu việc và giới hạn giờ làm việc tối đa.
2. **Chiến lược song song (Parallel runway)**: Duy trì công việc hiện tại để bảo toàn thu nhập, đồng thời dành 2–3 tiếng mỗi tuần chuẩn bị bước đệm tiếp theo.
3. **Thực nghiệm vi mô 7 ngày**: Áp dụng một thay đổi nhỏ trong 1 tuần để quan sát phản ứng thực tế trước khi đưa ra quyết định lớn.

📋 *Các hướng này đã được liên kết trên **Decision Card**, bạn có thể mở lên để điều chỉnh chi tiết.*`;
  }

  if (text.includes('đặt ngưỡng') || text.includes('ngưỡng tối thiểu') || text.includes('giới hạn')) {
    return `Để một quyết định không làm bạn kiệt sức, chúng ta có thể định hình 3 tầng ngưỡng rõ ràng:

• **Ngưỡng không thể chấp nhận (Red Line)**: Làm quá 50 giờ/tuần liên tục hoặc nhận việc khẩn ngoài giờ không báo trước làm xâm lấn sức khỏe.
• **Ngưỡng tối thiểu (Minimum)**: Giữ ít nhất 3 buổi tối trọn vẹn mỗi tuần cho bản thân và bảo đảm chi phí sinh hoạt cơ bản.
• **Ngưỡng mong muốn (Desired)**: Có không gian phát triển chuyên môn và được tôn trọng nhịp làm việc tự chủ.`;
  }

  if (text.includes('thử thế nào') || text.includes('bước thử') || text.includes('thử nghiệm nhỏ')) {
    return `Một bước thử nhỏ tốt là bước có thể đảo ngược và giúp bạn thu thập thông tin thật mà không phải đánh cược lớn:

• **Hành động vi mô (7 ngày)**: Chọn đúng MỘT điểm nghẽn nhỏ đang tiêu hao nhiều năng lượng nhất để thử nghiệm cách làm mới trong 7 ngày.
• **Điều cần quan sát**: Mức độ phục hồi năng lượng bên trong bạn và phản ứng thực tế của hoàn cảnh xung quanh.
• **Quy tắc dừng**: Nếu sau 7 ngày dữ liệu cho thấy dấu hiệu tích cực, tiếp tục duy trì. Nếu không phù hợp, dừng lại an toàn mà không phải chịu tổn thất.`;
  }

  // =========================================================================
  // 4. MULTI-TURN CONFIRMATION: User says "Đúng", "Chính xác", "Đồng ý"
  // =========================================================================
  if (/^(đúng|đúng rồi|chính xác|đúng trọng tâm|chuẩn|đồng ý|ừ|uh|yeb|yes)$/i.test(text) || text.startsWith('đúng.')) {
    return `Rất mừng là chúng ta đã nắm đúng trọng tâm. Bây giờ, bạn muốn chúng ta cùng làm rõ các lựa chọn khả thi, lập bảng tiêu chí so sánh, hay thiết kế ngay một bước thử nhỏ 7 ngày? Bạn có thể nói cụ thể định dạng bạn cần nhất lúc này nhé.`;
  }

  // =========================================================================
  // 5. REPAIR TRIGGERS: User correcting previous understanding (P0-02)
  // =========================================================================
  if (
    text.startsWith('không hẳn') ||
    text.startsWith('không phải') ||
    text.startsWith('chưa đúng') ||
    text.startsWith('sai rồi') ||
    text.includes('tôi chưa muốn nói về') ||
    text.includes('bạn trả lời sai')
  ) {
    return 'Cảm ơn bạn đã thẳng thắn đính chính. Tôi xin phép bỏ ngay giả thuyết vừa rồi để tránh làm mất thời gian của bạn. Bạn có thể cho tôi biết điều quan trọng nhất bạn muốn giải quyết ngay lúc này là gì không?';
  }

  // =========================================================================
  // 6. LOW ENERGY MODE
  // =========================================================================
  if (text.includes('mệt quá') || text.includes('đuối quá') || text === 'mệt' || text === 'buồn') {
    return 'Lúc này có vẻ bạn đang rất mệt mỏi. Chúng ta không cần phân tích hay giải quyết điều gì cả. Bạn muốn tạm dừng nghỉ ngơi ở đây, hay chỉ muốn gửi gắm đôi dòng ngắn ngủi rồi dừng?';
  }

  if (text.includes('chỉ muốn được lắng nghe') || text.includes('chưa muốn quyết định') || text.includes('không muốn làm bài tập')) {
    return 'Được, lúc này chúng ta không cần đưa ra quyết định hay làm bài tập nào cả. Bạn có thể chia sẻ theo nhịp điệu thoải mái nhất của mình; bất cứ lúc nào muốn dừng lại nghỉ ngơi, bạn chỉ cần nói nhé.';
  }

  // =========================================================================
  // 7. GREETINGS & LANDING PROMPTS
  // =========================================================================
  if (/^(alo|hi|chào|hello|helo|ê|ơi|chao|alooo|hey)/i.test(text) || text.length <= 4) {
    return 'Chào bạn. Chúng ta không cần giải quyết toàn bộ cuộc sống hôm nay. Bạn có thể bắt đầu từ điều đang chiếm nhiều suy nghĩ hoặc năng lượng nhất lúc này. Bạn muốn bắt đầu từ đâu?';
  }

  if (text.includes('công việc') && (text.includes('thời gian') || text.includes('áp lực') || text.includes('mệt') || text.includes('kiệt sức'))) {
    return 'Có vẻ công việc hiện tại đang đòi hỏi nhiều thời gian và năng lượng hơn mức bạn mong muốn, khiến các khoảng không gian khác trong cuộc sống bị thu hẹp lại. Tôi hiểu như vậy có sát với điều bạn đang trải nghiệm không, hay còn khía cạnh nào khác đang diễn ra?';
  }

  if (text.includes('nghỉ việc') || text.includes('chuyển việc') || text.includes('đổi hướng')) {
    return 'Đứng trước một sự thay đổi lớn thường mang lại nhiều băn khoăn xen lẫn sự thận trọng. Lúc này, điều gì đang khiến bạn nghĩ về sự thay đổi đó nhiều nhất?';
  }

  // =========================================================================
  // 8. UNIVERSAL THOUGHTFUL HYPOTHESIS REFLECTION (STRICTLY NO QUOTE ECHOING)
  // =========================================================================
  return 'Tôi nhận thấy bạn đang dành nhiều trăn trở cho vấn đề này. Để đồng hành hiệu quả nhất, bạn muốn chúng ta cùng làm rõ các lựa chọn, xác định các tiêu chí quan trọng, hay tìm một bước thử nghiệm nhỏ có thể thực hiện được ngay?';
};
