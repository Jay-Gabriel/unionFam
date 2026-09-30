// Google Gemini API Client for Life Lab Blueprint V7.0

const LIFE_LAB_SYSTEM_PROMPT = `
Bạn là Life Lab AI Companion — Chuyên gia đồng hành và phản chiếu cuộc đời theo kịch bản Life Lab V7 (UnionFam Blueprint).

TRIẾT LÝ VÀ TIẾN TRÌNH BẮT BUỘC:
1. Tiến trình: Understand (Thấu hiểu bản thân) → Choose (Lựa chọn hướng đi & chấp nhận đánh đổi) → Become (Từng bước trở thành phiên bản phù hợp nhất do chính người dùng định nghĩa).
2. Tôn chỉ tối cao: "Hãy kiếm tiền, nhưng trước tiên hãy biết tiền đang phục vụ cuộc đời nào."
3. Quy tắc phản chiếu (Reflect before Interpret):
   - Phản chiếu cảm xúc và băn khoăn của người dùng một cách ấm áp, sâu sắc, không phán xét, không dạy đời sáo rỗng.
   - Không bảo người dùng "bỏ tất cả chạy theo đam mê", mà giúp họ nhìn thấy sự đánh đổi (Trade-offs) và ranh giới giữa kỳ vọng bên ngoài vs nhu cầu bên trong.
   - Mọi đúc kết phải được diễn đạt dưới dạng Giả thuyết ngắn gọn (Hypothesis: "Có vẻ...", "Tôi tự hỏi...", "Dường như...").
   - Độ dài phản hồi: Ngắn gọn, súc tích (khoảng 2-4 câu), kết thúc bằng 1 câu hỏi trọng tâm khơi gợi hoặc đề xuất thử nghiệm 7 ngày.
`;

export async function askGeminiLifeLab(
  prompt: string,
  chatHistory: { sender: 'coach' | 'user' | 'system'; text: string }[],
  apiKey?: string
): Promise<string> {
  const activeKey = apiKey || (import.meta.env.VITE_GEMINI_API_KEY as string) || localStorage.getItem('life_lab_gemini_api_key') || '';

  if (!activeKey) {
    throw new Error('MISSING_API_KEY');
  }

  // Format history for Gemini API
  const contents = [
    {
      role: 'user',
      parts: [{ text: LIFE_LAB_SYSTEM_PROMPT }],
    },
    {
      role: 'model',
      parts: [{ text: 'Tôi đã hiểu rõ triết lý Life Lab V7. Tôi sẵn sàng phản chiếu và đồng hành cùng người dùng.' }],
    },
    ...chatHistory.slice(-6).map((msg) => ({
      role: msg.sender === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }],
    })),
    {
      role: 'user',
      parts: [{ text: prompt }],
    },
  ];

  // Call Gemini 2.5 Flash / 1.5 Flash endpoint
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${activeKey}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 600,
          topP: 0.9,
        },
      }),
    });

    if (!response.ok) {
      // Try fallback to gemini-1.5-flash if 2.5-flash model endpoint varies
      const fallbackUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${activeKey}`;
      const fallbackRes = await fetch(fallbackUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents }),
      });

      if (!fallbackRes.ok) {
        const errorData = await fallbackRes.json();
        throw new Error(errorData.error?.message || 'Lỗi kết nối Gemini API');
      }

      const fbData = await fallbackRes.json();
      return fbData.candidates?.[0]?.content?.parts?.[0]?.text || 'Life Lab đang lắng nghe bạn...';
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Life Lab đang lắng nghe bạn...';
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    throw error;
  }
}
