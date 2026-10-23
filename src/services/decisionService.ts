import { DecisionCardData, GranularMemoryPermissions, DecisionOption } from '../types/decisionCard';
import { saveMemoryToCloud } from './supabaseService';
import { createExperimentFromSession } from './experimentService';
import { getStoredGeminiKey } from './geminiService';

const LOCAL_DECISION_CARD_KEY = 'unionfam_active_decision_card';

// 3 Core Problem Scenarios as specified by Product Owner
export interface ProblemScenario {
  id: 'work_life' | 'purpose' | 'major_decision';
  badge: string;
  title: string;
  subtitle: string;
  painPoint: string;
  solutionHelp: string;
  starterPrompt: string;
  defaultCardData: Omit<DecisionCardData, 'id' | 'version' | 'status' | 'createdAt' | 'updatedAt'>;
}

export const CORE_PROBLEM_SCENARIOS: ProblemScenario[] = [
  {
    id: 'work_life',
    badge: 'TÌNH HUỐNG 1',
    title: 'Công việc đang lấy mất cuộc sống của bạn',
    subtitle: 'Quá giờ • Cạn kiệt năng lượng • Thiếu thời gian cho bản thân & gia đình',
    painPoint: 'Bạn thường xuyên làm quá giờ, cạn năng lượng và không còn đủ thời gian cho bản thân hoặc gia đình.',
    solutionHelp: 'Life Lab giúp bạn: tìm ra điều gì trong công việc cần thay đổi và thử một bước nhỏ trước khi nghĩ đến quyết định nghỉ việc.',
    starterPrompt: 'Công việc dạo này đang chiếm hết thời gian và năng lượng của mình. Mình cảm thấy kiệt sức và không còn thời gian cho bản thân hay gia đình nữa.',
    defaultCardData: {
      title: 'Quyết Định: Thiết Lập Lại Ranh Giới Công Việc & Cuộc Sống',
      decisionQuestion: 'Công việc hiện tại có thể điều chỉnh để tôi lấy lại năng lượng sống hay tôi cần chuẩn bị chuyển hướng?',
      scenarioCategory: 'work_life',
      source: 'scenario_template',
      sourceSnippet: 'Khởi tạo từ tình huống: Công việc lấy mất cuộc sống',
      criteria: [
        'Bảo toàn sức khỏe và năng lượng tinh thần mỗi ngày',
        'Có ít nhất 3 buổi tối trọn vẹn mỗi tuần cho gia đình và bản thân',
        'Đảm bảo mức thu nhập ổn định để trang trải cuộc sống',
        'Môi trường làm việc tôn trọng ranh giới ngoài giờ',
      ],
      hardConstraints: [
        'Không làm việc quá 50 giờ/tuần kéo dài liên tục',
        'Không xử lý tin nhắn hoặc việc phát sinh sau 20h nếu không báo trước',
      ],
      options: [
        {
          id: 'opt_1',
          name: 'Tái đàm phán khối lượng công việc & ranh giới',
          description: 'Chủ động trao đổi với quản lý về thứ tự ưu tiên đầu việc và giới hạn giờ làm việc.',
        },
        {
          id: 'opt_2',
          name: 'Chuẩn bị kế hoạch chuyển việc song song',
          description: 'Duy trì công việc hiện tại để bảo toàn thu nhập, đồng thời rà soát cơ hội mới trong 2-3 tháng.',
        },
        {
          id: 'opt_3',
          name: 'Thử nghiệm giới hạn nghiêm ngặt 7 ngày',
          description: 'Đúng giờ tan làm ngắt kết nối công việc trong 1 tuần để quan sát phản ứng thực tế trước khi quyết định lớn.',
        },
      ],
      uncertainties: [
        {
          id: 'unc_1',
          question: 'Liệu quản lý có thực sự chấp nhận khi tôi phản ánh về khối lượng công việc quá tải?',
          verificationMethod: 'Hỏi trực tiếp về thứ tự ưu tiên khi nhận 2 đầu việc mới giao.',
          stopRule: 'Nếu sau 2 tuần vẫn bị dồn việc ép tiến độ vô lý, chuyển sang chuẩn bị tìm việc mới.',
        },
      ],
      experiment: {
        learningQuestion: 'Khi tôi chủ động hỏi thứ tự ưu tiên và đặt ranh giới lúc 18h30, phản ứng của nhóm và cảm giác của mình ra sao?',
        action: 'Với các việc mới giao sau 18h, nhẹ nhàng báo sẽ xử lý vào sáng hôm sau và quan sát kết quả.',
        durationDays: 7,
        observations: 'Ghi lại cảm giác lo âu trong bản thân và thái độ thực tế của đồng nghiệp trong 3 ngày đầu.',
      },
      reviewDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('vi-VN'),
    },
  },
  {
    id: 'purpose',
    badge: 'TÌNH HUỐNG 2',
    title: 'Bạn không còn biết mình thực sự muốn gì',
    subtitle: 'Mất phương hướng • Làm điều "nên làm" • Thiếu cảm giác ý nghĩa',
    painPoint: 'Cuộc sống vẫn tiếp diễn, nhưng bạn cảm thấy mất phương hướng. Bạn đang làm những điều “nên làm” mà không chắc chúng còn phù hợp với mình.',
    solutionHelp: 'Life Lab giúp bạn: nhìn lại cuộc sống hiện tại, nhận ra điều thực sự quan trọng và xác định hướng đi bạn muốn theo đuổi.',
    starterPrompt: 'Mình đang cảm thấy mất phương hướng. Hàng ngày vẫn đi làm và hoàn thành mọi thứ "nên làm", nhưng không còn thấy có ý nghĩa hay niềm vui nữa.',
    defaultCardData: {
      title: 'Quyết Định: Định Hình Giá Trị Cốt Lõi & Hướng Đi Thật Sự',
      decisionQuestion: 'Tôi nên tiếp tục theo đuổi kỳ vọng an toàn hiện tại hay bắt đầu không gian khám phá điều thực sự có ý nghĩa?',
      scenarioCategory: 'purpose',
      source: 'scenario_template',
      sourceSnippet: 'Khởi tạo từ tình huống: Mất phương hướng & tìm lại điều muốn làm',
      criteria: [
        'Công việc mang lại cảm giác có ý nghĩa và đóng góp thật sự',
        'Có không gian phát triển năng lực mà bản thân trân trọng',
        'Giữ vững an toàn tài chính trong giai đoạn chuyển giao',
        'Được sống thật với nhịp điệu và giá trị nội tại',
      ],
      hardConstraints: [
        'Không nghỉ việc đột ngột khi chưa có quỹ dự phòng tài chính ít nhất 6 tháng',
        'Không tiếp tục làm những công việc trái ngược hoàn toàn với đạo đức cá nhân',
      ],
      options: [
        {
          id: 'opt_1',
          name: 'Khởi tạo dự án cá nhân song song (Side-project)',
          description: 'Dành 4-6 tiếng mỗi tuần cho một lĩnh vực yêu thích để kiểm chứng cảm xúc và năng lực thực tế.',
        },
        {
          id: 'opt_2',
          name: 'Tham vấn và kết nối với người đi trước',
          description: 'Trò chuyện sâu với 2-3 người đang làm trong ngành bạn quan tâm để có góc nhìn thực tế.',
        },
        {
          id: 'opt_3',
          name: 'Khoảng lặng 7 ngày ghi nhận năng lượng sống',
          description: 'Mỗi tối dành 15 phút ghi nhật ký các hoạt động làm bạn thấy có sinh khí nhất trong ngày.',
        },
      ],
      uncertainties: [
        {
          id: 'unc_1',
          question: 'Điều tôi nghĩ mình thích có thực sự là một nghề nghiệp khả thi để nuôi sống bản thân?',
          verificationMethod: 'Nói chuyện với 2 người đang kiếm sống thành công từ lĩnh vực đó.',
          stopRule: 'Nếu thực tế quá khác xa mong đợi, giữ lĩnh vực đó làm sở thích cá nhân thay vì chuyển nghề.',
        },
      ],
      experiment: {
        learningQuestion: 'Khi tôi dành 20 phút mỗi tối để làm điều mình thực sự thích, năng lượng sống có hồi phục không?',
        action: 'Dành đúng 20 phút mỗi tối đọc, viết hoặc học kỹ năng mới mà không bị áp lực phải tạo ra tiền ngay.',
        durationDays: 7,
        observations: 'Ghi nhận khoảnh khắc bản thân cảm thấy nhẹ nhõm và hào hứng nhất trong tuần.',
      },
      reviewDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('vi-VN'),
    },
  },
  {
    id: 'major_decision',
    badge: 'TÌNH HUỐNG 3',
    title: 'Bạn đang mắc kẹt trước một quyết định quan trọng',
    subtitle: 'Nhiều ngã rẽ • Suy nghĩ rối bời • Sợ đánh đổi sai lầm',
    painPoint: 'Bạn có nhiều lựa chọn nhưng càng suy nghĩ càng rối. Mỗi phương án đều có lợi ích, rủi ro và những điều phải đánh đổi.',
    solutionHelp: 'Life Lab giúp bạn: xác định tiêu chí, so sánh các lựa chọn, làm rõ điều chưa biết và tìm bước tiếp theo mà không quyết định thay bạn.',
    starterPrompt: 'Mình đang đứng trước một quyết định rất khó khăn và phân vân giữa nhiều lựa chọn. Càng nghĩ nhiều càng thấy rối và sợ chọn sai.',
    defaultCardData: {
      title: 'Quyết Định: Bóc Tách Nan Đề & So Sánh Đánh Đổi',
      decisionQuestion: 'Trước các lựa chọn này, tiêu chí không thể thỏa hiệp nào sẽ dẫn đường cho tôi?',
      scenarioCategory: 'major_decision',
      source: 'scenario_template',
      sourceSnippet: 'Khởi tạo từ tình huống: Mắc kẹt trước quyết định quan trọng',
      criteria: [
        'Khả năng đảo ngược phương án nếu có rủi ro phát sinh (Reversibility)',
        'Mức độ tương thích với mục tiêu cuộc sống trong 3 năm tới',
        'Chi phí vô hình về năng lượng, áp lực tinh thần và các mối quan hệ',
        'Sự bình an nội tâm khi nhìn lại quyết định này trong tương lai',
      ],
      hardConstraints: [
        'Không chọn phương án dẫn đến nguy cơ khủng hoảng tài chính cá nhân',
        'Không đánh đổi sự gắn kết và niềm tin của những người thân yêu nhất',
      ],
      options: [
        {
          id: 'opt_1',
          name: 'Phương án Thử nghiệm từng bước (An toàn & Đảo ngược)',
          description: 'Triển khai một phiên bản thu nhỏ trong 1 tháng trước khi cam kết nguồn lực toàn diện.',
        },
        {
          id: 'opt_2',
          name: 'Phương án Dấn thân quyết đoán kèm ngưỡng dừng lỗ',
          description: 'Chọn phương án bứt phá nhưng đặt ra quy tắc dừng (Stop-loss rule) rõ ràng nếu không đạt kỳ vọng.',
        },
        {
          id: 'opt_3',
          name: 'Giữ nguyên hiện trạng có chủ đích trong 7 ngày',
          description: 'Tạm gác việc ra quyết định để thu thập thêm 1 dữ kiện quan trọng nhất còn thiếu.',
        },
      ],
      uncertainties: [
        {
          id: 'unc_1',
          question: 'Kịch bản tồi tệ nhất nếu phương án này thất bại là gì và tôi có khả năng xử lý nó không?',
          verificationMethod: 'Viết ra phương án dự phòng chi tiết cho trường hợp xấu nhất.',
          stopRule: 'Nếu rủi ro tồi tệ nhất vượt quá ngưỡng chịu đựng đỏ, loại bỏ phương án đó ngay.',
        },
      ],
      experiment: {
        learningQuestion: 'Nếu thử giả định mình đã chọn Phương án 1 trong 3 ngày tới, cảm giác thực sự trong tôi là gì?',
        action: 'Sống và hành xử như thể đã chọn Phương án 1 trong 3 ngày để cảm nhận phản ứng trực giác.',
        durationDays: 7,
        observations: 'Ghi lại cảm giác nhẹ nhõm hay tiếc nuối khi tưởng tượng tương lai với lựa chọn này.',
      },
      reviewDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('vi-VN'),
    },
  },
];

export const DEFAULT_DECISION_CARD: DecisionCardData = {
  id: 'dec_default_01',
  version: 1,
  status: 'DRAFT',
  ...CORE_PROBLEM_SCENARIOS[0].defaultCardData,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

/**
 * Lấy Decision Card đang hoạt động
 */
export function getActiveDecisionCard(): DecisionCardData {
  try {
    const raw = localStorage.getItem(LOCAL_DECISION_CARD_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.decisionQuestion) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Error reading active decision card:', e);
  }
  return DEFAULT_DECISION_CARD;
}

/**
 * Lưu Decision Card vào LocalStorage
 */
export function saveActiveDecisionCard(card: DecisionCardData): void {
  try {
    const payload: DecisionCardData = {
      ...card,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(LOCAL_DECISION_CARD_KEY, JSON.stringify(payload));
  } catch (e) {
    console.warn('Error saving decision card:', e);
  }
}

/**
 * Cập nhật một trường cụ thể của Decision Card
 */
export function updateDecisionCardField<K extends keyof DecisionCardData>(
  field: K,
  value: DecisionCardData[K]
): DecisionCardData {
  const current = getActiveDecisionCard();
  const updated: DecisionCardData = {
    ...current,
    [field]: value,
    status: 'USER_REVIEW',
    version: current.version + 1,
    updatedAt: new Date().toISOString(),
  };
  saveActiveDecisionCard(updated);
  return updated;
}

/**
 * Trích xuất Thẻ Quyết Định THỰC TẾ trực tiếp từ cuộc hội thoại (KHÔNG DÙNG MẶC ĐỊNH)
 */
export async function extractDecisionCardFromConversation(
  messages: { sender: 'ai' | 'user'; text: string }[],
  preferredScenarioId?: 'work_life' | 'purpose' | 'major_decision' | 'custom'
): Promise<DecisionCardData> {
  const userMessages = messages.filter(m => m.sender === 'user').map(m => m.text);
  const conversationText = userMessages.join('\n');
  const lowerText = conversationText.toLowerCase();

  // 1. Xác định scenario phù hợp nhất từ hội thoại
  let matchedScenario = CORE_PROBLEM_SCENARIOS[0]; // default work_life
  if (preferredScenarioId) {
    const found = CORE_PROBLEM_SCENARIOS.find(s => s.id === preferredScenarioId);
    if (found) matchedScenario = found;
  } else if (
    lowerText.includes('mất phương hướng') ||
    lowerText.includes('không biết muốn gì') ||
    lowerText.includes('ý nghĩa') ||
    lowerText.includes('đam mê') ||
    lowerText.includes('nên làm')
  ) {
    matchedScenario = CORE_PROBLEM_SCENARIOS[1]; // purpose
  } else if (
    lowerText.includes('phân vân') ||
    lowerText.includes('ngã rẽ') ||
    lowerText.includes('chọn cái nào') ||
    lowerText.includes('giữa hai') ||
    lowerText.includes('đánh đổi')
  ) {
    matchedScenario = CORE_PROBLEM_SCENARIOS[2]; // major_decision
  }

  // 2. Thử gọi Gemini AI nếu có key để trích xuất ngữ cảnh chính xác của người dùng
  const apiKey = getStoredGeminiKey();
  if (apiKey && userMessages.length > 0) {
    try {
      const extractedAi = await callGeminiToExtractCard(apiKey, messages, matchedScenario);
      if (extractedAi) {
        saveActiveDecisionCard(extractedAi);
        return extractedAi;
      }
    } catch (e) {
      console.warn('Gemini extraction failed, using contextual heuristic builder:', e);
    }
  }

  // 3. Contextual Heuristic Extractor: Kết nối trực tiếp các câu nói của người dùng vào thẻ
  const lastUserMsg = userMessages[userMessages.length - 1] || matchedScenario.starterPrompt;
  const firstUserMsg = userMessages[0] || matchedScenario.painPoint;

  // Trích xuất vấn đề nan đề từ câu người dùng
  let extractedQuestion = matchedScenario.defaultCardData.decisionQuestion;
  if (userMessages.length > 0) {
    extractedQuestion = `Dựa trên trăn trở của bạn: "${lastUserMsg.length > 80 ? lastUserMsg.slice(0, 80) + '...' : lastUserMsg}", đâu là hướng đi phù hợp nhất?`;
  }

  // Trích xuất criteria từ các khía cạnh người dùng quan tâm
  const dynamicCriteria = [...matchedScenario.defaultCardData.criteria];
  if (lowerText.includes('tiền') || lowerText.includes('lương') || lowerText.includes('tài chính')) {
    dynamicCriteria[0] = 'Bảo toàn mức thu nhập và an toàn tài chính';
  }
  if (lowerText.includes('sếp') || lowerText.includes('quản lý') || lowerText.includes('đồng nghiệp')) {
    dynamicCriteria.push('Mối quan hệ và sự rõ ràng với người quản lý/đồng nghiệp');
  }
  if (lowerText.includes('gia đình') || lowerText.includes('con') || lowerText.includes('bố mẹ')) {
    dynamicCriteria[1] = 'Bảo vệ thời gian và sự gắn kết với gia đình';
  }

  // Trích xuất hard constraints
  const dynamicConstraints = [...matchedScenario.defaultCardData.hardConstraints];
  if (lowerText.includes('mệt') || lowerText.includes('kiệt sức') || lowerText.includes('stress')) {
    dynamicConstraints[0] = 'Không tiếp tục đẩy bản thân đến trạng thái kiệt sức (burnout)';
  }

  // Tạo các phương án linh hoạt dựa trên chia sẻ
  const dynamicOptions: DecisionOption[] = [
    {
      id: 'opt_1',
      name: 'Phương án 1: Thử điều chỉnh & trao đổi lại',
      description: `Đặt ranh giới rõ ràng về: "${firstUserMsg.slice(0, 60)}..." để bảo vệ không gian cá nhân.`,
    },
    {
      id: 'opt_2',
      name: 'Phương án 2: Chuẩn bị phương án thay thế song song',
      description: 'Duy trì công việc hiện tại đồng thời rà soát các cơ hội mới trong 2–3 tháng.',
    },
    {
      id: 'opt_3',
      name: 'Phương án 3: Thử nghiệm vi mô 7 ngày an toàn',
      description: 'Giữ giới hạn nghiêm ngặt trong 1 tuần để quan sát phản ứng thực tế trước khi chốt quyết định lớn.',
    },
  ];

  const extractedCard: DecisionCardData = {
    id: `dec_${Date.now()}`,
    version: 1,
    status: 'USER_REVIEW',
    title: `Quyết Định: ${matchedScenario.title}`,
    scenarioCategory: matchedScenario.id,
    source: 'conversation_extracted',
    sourceSnippet: `Đã kết nối và đúc kết trực tiếp từ ${userMessages.length} câu chia sẻ trong cuộc trò chuyện`,
    decisionQuestion: extractedQuestion,
    criteria: dynamicCriteria.slice(0, 4),
    hardConstraints: dynamicConstraints,
    options: dynamicOptions,
    uncertainties: matchedScenario.defaultCardData.uncertainties,
    experiment: {
      learningQuestion: `Khi tôi chủ động điều chỉnh hành vi theo chia sẻ vừa rồi, phản ứng xung quanh và cảm giác của bản thân ra sao?`,
      action: `Thực hiện một hành động cụ thể để giải tỏa áp lực: "${lastUserMsg.slice(0, 50)}..." trong 7 ngày tới.`,
      durationDays: 7,
      observations: 'Ghi lại cảm giác lo âu trong bản thân và phản ứng thực tế của những người liên quan.',
    },
    reviewDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('vi-VN'),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  saveActiveDecisionCard(extractedCard);
  return extractedCard;
}

/**
 * Gọi Gemini để trích xuất JSON cấu trúc chuẩn từ hội thoại
 */
async function callGeminiToExtractCard(
  apiKey: string,
  messages: { sender: 'ai' | 'user'; text: string }[],
  scenario: ProblemScenario
): Promise<DecisionCardData | null> {
  const conversationSnippet = messages
    .map(m => `${m.sender === 'user' ? 'Người dùng' : 'Life Lab'}: ${m.text}`)
    .join('\n');

  const prompt = `Bạn là hệ thống trích xuất Decision Card của Life Lab (Chuẩn V8.7.5 & V1.0).
Dựa trên cuộc hội thoại thực tế của người dùng dưới đây, hãy trích xuất thành một JSON Thẻ Quyết Định.
YÊU CẦU QUAN TRỌNG:
- TUYỆT ĐỐI KHÔNG DÙNG DỮ LIỆU MẪU MẶC ĐỊNH.
- Phải dùng đúng ngôn từ, tình huống thực tế, con người, công việc mà người dùng vừa chia sẻ.
- Trả về DUY NHẤT một chuỗi JSON hợp lệ không bọc trong markdown codeblock.

Cấu trúc JSON:
{
  "title": "Tên ngắn gọn của quyết định",
  "decisionQuestion": "Câu hỏi nan đề then chốt mà người dùng đang trăn trở",
  "criteria": ["Tiêu chí 1", "Tiêu chí 2", "Tiêu chí 3"],
  "hardConstraints": ["Ranh giới đỏ 1 (ví dụ không làm quá 50h)", "Ranh giới đỏ 2"],
  "options": [
    { "id": "opt_1", "name": "Tên phương án A", "description": "Mô tả cụ thể" },
    { "id": "opt_2", "name": "Tên phương án B", "description": "Mô tả cụ thể" },
    { "id": "opt_3", "name": "Tên phương án C", "description": "Mô tả cụ thể" }
  ],
  "uncertainties": [
    { "id": "unc_1", "question": "Điều còn chưa biết quan trọng nhất?", "verificationMethod": "Cách kiểm chứng nhỏ", "stopRule": "Quy tắc dừng lại" }
  ],
  "experiment": {
    "learningQuestion": "Câu hỏi học tập?",
    "action": "Hành động vi mô trong 7 ngày?",
    "durationDays": 7,
    "observations": "Điều cần quan sát?"
  },
  "reviewDate": "Ngày nhìn lại (dd/mm/yyyy)"
}

CUỘC HỘI THOẠI CỦA NGƯỜI DÙNG:
${conversationSnippet}`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.2 },
      }),
    }
  );

  if (!response.ok) return null;
  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) return null;

  const parsed = JSON.parse(text);
  return {
    id: `dec_${Date.now()}`,
    version: 1,
    status: 'USER_REVIEW',
    scenarioCategory: scenario.id,
    source: 'conversation_extracted',
    sourceSnippet: `Được AI trích xuất tự động từ nội dung đối thoại thực tế`,
    title: parsed.title || `Quyết Định: ${scenario.title}`,
    decisionQuestion: parsed.decisionQuestion || scenario.defaultCardData.decisionQuestion,
    criteria: parsed.criteria || scenario.defaultCardData.criteria,
    hardConstraints: parsed.hardConstraints || scenario.defaultCardData.hardConstraints,
    options: parsed.options || scenario.defaultCardData.options,
    uncertainties: parsed.uncertainties || scenario.defaultCardData.uncertainties,
    experiment: parsed.experiment || scenario.defaultCardData.experiment,
    reviewDate: parsed.reviewDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('vi-VN'),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Xử lý lưu Granular Memory theo quyền người dùng cấp
 */
export async function saveDecisionCardWithPermissions(
  card: DecisionCardData,
  perms: GranularMemoryPermissions
): Promise<{
  savedFields: string[];
  omittedFields: string[];
}> {
  const savedFields: string[] = [];
  const omittedFields: string[] = [];

  if (perms.noMemory) {
    omittedFields.push('Toàn bộ thông tin (Người dùng chọn Không lưu gì)');
    return { savedFields, omittedFields };
  }

  // 1. Quyết định đang mở
  if (perms.openDecision) {
    savedFields.push('Quyết định đang mở');
    await saveMemoryToCloud({
      id: `dec_q_${Date.now()}`,
      category: 'core_value',
      title: 'Quyết Định Đang Mở',
      reflection: card.decisionQuestion,
      date: new Date().toLocaleDateString('vi-VN'),
    });
  } else {
    omittedFields.push('Quyết định đang mở');
  }

  // 2. Tiêu chí và giới hạn
  if (perms.criteriaAndLimits) {
    savedFields.push('Tiêu chí & Giới hạn');
    const criteriaText = card.criteria.map(c => `• ${c}`).join('\n');
    const limitsText = card.hardConstraints.map(l => `• ${l}`).join('\n');
    await saveMemoryToCloud({
      id: `dec_crit_${Date.now()}`,
      category: 'boundary',
      title: 'Tiêu Chí & Giới Hạn Quyết Định',
      reflection: `Tiêu chí:\n${criteriaText}\n\nGiới hạn:\n${limitsText}`,
      date: new Date().toLocaleDateString('vi-VN'),
    });
  } else {
    omittedFields.push('Tiêu chí & Giới hạn');
  }

  // 3. Điều còn chưa biết
  if (perms.uncertainties) {
    savedFields.push('Điều còn chưa biết');
    const uncText = card.uncertainties.map(u => `• ${u.question} (Kiểm chứng: ${u.verificationMethod || 'Chưa định nghĩa'})`).join('\n');
    await saveMemoryToCloud({
      id: `dec_unc_${Date.now()}`,
      category: 'insight',
      title: 'Điều Còn Chưa Biết',
      reflection: uncText,
      date: new Date().toLocaleDateString('vi-VN'),
    });
  } else {
    omittedFields.push('Điều còn chưa biết');
  }

  // 4. Bước thử (đồng bộ sang Cổng 2)
  if (perms.experimentStep && card.experiment) {
    savedFields.push('Bước thử (Đã đồng bộ sang Cổng 2)');
    createExperimentFromSession(
      `Thử nghiệm: ${card.experiment.action}`,
      card.experiment.learningQuestion,
      {
        external: card.hardConstraints[0] || 'Kỳ vọng bên ngoài',
        internal: card.criteria[0] || 'Nhu cầu cá nhân',
      }
    );
    await saveMemoryToCloud({
      id: `dec_exp_${Date.now()}`,
      category: 'insight',
      title: 'Bước Thử Kiểm Chứng',
      reflection: `Câu hỏi học tập: ${card.experiment.learningQuestion}\nHành động: ${card.experiment.action}\nThời lượng: ${card.experiment.durationDays} ngày`,
      date: new Date().toLocaleDateString('vi-VN'),
    });
  } else {
    omittedFields.push('Bước thử');
  }

  // 5. Ngày nhìn lại
  if (perms.reviewDate && card.reviewDate) {
    savedFields.push(`Ngày nhìn lại (${card.reviewDate})`);
  } else {
    omittedFields.push('Ngày nhìn lại');
  }

  // Đánh dấu Card là CONFIRMED
  const confirmedCard: DecisionCardData = {
    ...card,
    status: 'CONFIRMED',
    version: card.version + 1,
  };
  saveActiveDecisionCard(confirmedCard);

  return { savedFields, omittedFields };
}
