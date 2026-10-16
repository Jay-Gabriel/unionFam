// Life Lab Sanctuary AI Companion Service (Blueprint V8.7.2)
// Multi-modal intelligent assistant supporting Gemini API & Sanctuary Dynamic Dialogue Engine

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
}

export const callGeminiCompanionAPI = async (
  apiKey: string,
  userMessage: string,
  history: { sender: 'ai' | 'user'; text: string }[]
): Promise<GeminiResponseResult> => {
  const cleanKey = apiKey.trim();

  // If no key provided at all, immediately use smart dynamic dialogue engine
  if (!cleanKey) {
    return {
      text: generateDynamicSanctuaryReply(userMessage),
      source: 'sanctuary_engine',
    };
  }

  const systemInstruction = `Bạn là Life Lab Mirror Companion (Blueprint V8.7.2).
MỤC TIÊU CỐT LÕI: Đồng hành tâm lý tài chính tỉnh thức, phản chiếu sâu sắc câu hỏi: "Tiền đang phục vụ cuộc đời nào?".
PHONG CÁCH GIAO TIẾP:
- Nói chuyện tự nhiên theo văn nói, gần gũi, ấm áp, như một người anh em / Tech Lead / Coach chiêm nghiệm ngồi đối diện bên ly trà.
- TUYỆT ĐỐI KHÔNG lặp lại cấu trúc câu rập khuôn, không chào hỏi sách vở hay văn bản hành chính.
- Lắng nghe thấu cảm, không phán xét bất kỳ sai lầm chi tiêu nào.
- Giữ câu trả lời sâu sắc trong 2-4 câu, khơi mở góc nhìn tỉnh thức.`;

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

  // List of models to try in order of capability & speed
  const candidateModels = [
    'gemini-2.0-flash',
    'gemini-1.5-flash',
    'gemini-flash-latest',
    'gemini-3.8-flash',
  ];

  let lastError = '';

  // Attempt 1: Standard URL query param
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

  // Attempt 2: If key is OAuth / Bearer token (often starting with AQ. or ya29.)
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
            };
          }
        }
      } catch {
        // continue
      }
    }
  }

  // If we reach here, Gemini API authentication failed
  // Provide transparent, helpful guidance to the user while continuing conversation seamlessly
  const isKeyFormatInvalid = !cleanKey.startsWith('AIzaSy');
  const helpfulNotice = isKeyFormatInvalid
    ? `[Lưu ý kết nối: Khóa API hiện tại (${cleanKey.slice(0, 4)}...${cleanKey.slice(-4)}) chưa được Google AI Studio xác thực. Khóa chuẩn thường bắt đầu bằng 'AIzaSy...' tạo miễn phí tại aistudio.google.com/app/apikey. Bạn có thể bấm 'Đổi Key' ở góc trên để cập nhật bất cứ lúc nào.]\n\n`
    : `[Lưu ý kết nối: Google API tạm thời phản hồi: ${lastError.slice(0, 80)}. Hệ thống đang đối thoại qua Sanctuary Engine.]\n\n`;

  const fallbackText = generateDynamicSanctuaryReply(userMessage);

  return {
    text: `${helpfulNotice}${fallbackText}`,
    source: 'sanctuary_engine',
    errorDetail: lastError,
  };
};

// Comprehensive, non-repetitive dialogue engine tailored for Life Lab financial consciousness
export const generateDynamicSanctuaryReply = (rawInput: string): string => {
  const text = rawInput.toLowerCase().trim();

  // 1. Direct request for advice / guidance ("gợi ý cho tôi", "tư vấn", "làm gì", "hướng dẫn")
  if (text.includes('gợi ý') || text.includes('lời khuyên') || text.includes('tư vấn') || text.includes('nên làm gì') || text.includes('bắt đầu từ đâu') || text.includes('chỉ tôi')) {
    const suggestions = [
      `Tại ngưỡng cửa Life Lab, mình gợi ý bạn 3 bước đi thực tế để bắt đầu:\n\n1. Quan sát không phán xét: Mở sao kê 3 ngày gần nhất, nhận diện cảm xúc (vui, sợ hay áp lực) khi tiêu tiền.\n2. Thử nghiệm 7 ngày tĩnh lặng: Dừng mọi khoản mua sắm bốc đồng vượt quá 500k trong 24 giờ suy ngẫm.\n3. Khắc ghi bài học Kintsugi: Chuyển hóa một sai lầm tài chính trong quá khứ thành sự tỉnh thức.\n\nTrong 3 điều này, điều nào đang chạm tới bạn nhiều nhất?`,
      `Nếu bạn đang cần một gợi ý ngay lúc này: Hãy tạm gác việc tính toán con số sang một bên. Tự hỏi mình: 'Khoản chi nào trong tháng qua khiến tâm trí mình nhẹ nhõm nhất, và khoản nào làm mình trăn trở nhất?'. Đó chính là chiếc la bàn đầu tiên giúp bạn định vị lại dòng tiền.`,
      `Một gợi ý chân thành cho bạn: Hãy bắt đầu từ việc tạo 'Vùng Đệm An Tâm' nhỏ nhất — dù chỉ là một khoản tiền đủ cho 2 tuần sinh hoạt nhưng không bao giờ chạm tới vì FOMO. Cảm giác có chỗ dựa tâm lý sẽ thay đổi hoàn toàn cách bạn đưa ra các quyết định tiếp theo.`,
    ];
    return suggestions[Math.floor(Math.random() * suggestions.length)];
  }

  // 2. Greetings & Check-in
  if (/^(alo|hi|chào|hello|helo|ê|ơi|chao|alooo|hey|bạn ơi)/i.test(text) || text.length <= 4) {
    const greetings = [
      'Chào bạn nhé! Mình ở đây bên bạn rồi. Khi đứng trước những con đường ánh sáng này, điều gì đang thôi thúc bạn bước vào tìm câu trả lời?',
      'Rất vui được đối thoại cùng bạn. Hãy cứ thả lỏng và chia sẻ tự nhiên như với một người anh em, ở Life Lab mọi trăn trở đều được tôn trọng.',
      'Chào bạn! Mình sẵn sàng lắng nghe rồi đây. Trong mối quan hệ với tiền bạc, có nút thắt nào bạn đang muốn tháo gỡ hôm nay?',
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  // 3. Identity & What Life Lab is
  if (text.includes('bạn là ai') || text.includes('life lab') || text.includes('là gì') || text.includes('giới thiệu')) {
    return 'Mình là Life Lab Mirror Companion — chiếc gương phản chiếu tâm thức tài chính. Mình không dạy bạn mẹo làm giàu cấp tốc hay phím lệnh đầu tư, mà giúp bạn nhìn thấu vì sao mình chi tiêu, đâu là nỗi sợ vô thức, và giúp tiền bạc thực sự phụng sự cuộc đời tự do của bạn.';
  }

  // 4. Stress, Overwhelm, Exhaustion, Fear
  if (text.includes('áp lực') || text.includes('stress') || text.includes('mệt') || text.includes('lo') || text.includes('sợ') || text.includes('bế tắc') || text.includes('kiệt sức')) {
    const stressReplies = [
      'Mình cảm nhận được áp lực nặng nề bạn đang gánh. Phần lớn nỗi sợ tiền bạc thực ra đến từ việc ta sợ làm thất vọng người khác hoặc sợ một kịch bản tồi tệ do tâm trí tự vẽ ra. Hãy hít một hơi thật sâu: Hiện tại, ngay lúc này, bạn vẫn đang an toàn và có toàn quyền lựa chọn cách phản ứng.',
      'Khi tâm trí kiệt sức, mọi quyết định tài chính đều dễ bị méo mó. Thay vì cố gắng giải quyết tất cả cùng lúc, bạn hãy chọn ra một việc nhỏ nhất có thể kiểm soát hôm nay. Bạn có muốn chia sẻ cụ thể điều gì đang tạo sức ép lớn nhất lên bạn không?',
    ];
    return stressReplies[Math.floor(Math.random() * stressReplies.length)];
  }

  // 5. Debt, Losses, Investments, Trading, Financial wounds
  if (text.includes('nợ') || text.includes('mất tiền') || text.includes('lỗ') || text.includes('crypto') || text.includes('chứng khoán') || text.includes('phá sản') || text.includes('trắng tay')) {
    return 'Khoản lỗ hay nợ nần là một vết nứt rất nhức nhối. Nhưng triết lý Kintsugi của Life Lab coi vết nứt là nơi ánh sáng trí tuệ bắt đầu rọi vào. Sai lầm trong quá khứ là học phí để bạn hiểu rõ giới hạn và bản lĩnh của mình. Bạn đã rút ra bài học cốt lõi nào từ biến cố ấy chưa?';
  }

  // 6. Impulsive shopping, FOMO, Retail therapy
  if (text.includes('mua') || text.includes('chi tiêu') || text.includes('tiêu tiền') || text.includes('shopping') || text.includes('fomo') || text.includes('bốc đồng')) {
    return 'Nhiều khi ta mua sắm không phải vì cần món đồ, mà vì muốn mua một cảm giác tự thưởng nhanh chóng sau chuỗi ngày mệt mỏi. Lần tới trước khi thanh toán, hãy thử cho mình 24 giờ khoảng đệm. Nếu sau 24 giờ cảm xúc đó tan đi, bạn vừa tiết kiệm được cả tiền bạc lẫn sự bình an đấy.';
  }

  // 7. Freedom, Purpose, Core values
  if (text.includes('tự do') || text.includes('ý nghĩa') || text.includes('mục đích') || text.includes('cuộc sống') || text.includes('hạnh phúc')) {
    return 'Tự do tài chính thực sự không phải là sở hữu số tiền vô hạn, mà là khả năng nói "KHÔNG" với những thứ không thuộc về giá trị cốt lõi của bạn. Khi tiền bạc biết phục vụ bình yên và sức khỏe của bạn, bạn đã giàu có hơn 90% những người chỉ chạy theo số dư.';
  }

  // 8. General open reflection with variety
  const dynamicReflections = [
    `Chia sẻ của bạn chạm vào một khía cạnh rất thực tế. Tiền bạc luôn mang năng lượng của người sở hữu nó: khi chi tiêu trong sự thấu tỏ, ta nuôi dưỡng bình yên; khi chi tiêu trong vô thức, ta nhân đôi bất an. Góc nhìn này gợi cho bạn suy nghĩ gì?`,
    `Cảm ơn bạn đã trải lòng. Mọi câu chuyện về tiền thực chất đều là câu chuyện về mối quan hệ giữa ta với chính mình. Nếu được viết lại một quy tắc tài chính cho riêng bạn từ hôm nay, bạn sẽ đặt ra nguyên tắc nào đầu tiên?`,
    `Mình đang ngẫm nghĩ cùng bạn đây. Điều kỳ diệu là chỉ cần bạn dám đối diện thẳng thắn và gọi tên đúng cảm xúc, nửa chặng đường gỡ rối đã hoàn tất rồi. Bước tiếp theo bạn muốn khám phá là gì?`,
  ];
  return dynamicReflections[Math.floor(Math.random() * dynamicReflections.length)];
};
