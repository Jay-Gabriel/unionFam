import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const OUT_DIR = '/home/jay/office-graffico-clone';

function escapeXml(unsafe) {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function renderSvgToWebp(svgContent, destPath, width = 1024, height = 768) {
  const tmpSvg = path.join('/tmp', `temp_${Date.now()}_${Math.random().toString(36).substring(7)}.svg`);
  fs.writeFileSync(tmpSvg, svgContent, 'utf-8');
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  execSync(`ffmpeg -y -i "${tmpSvg}" -vf "scale=${width}:${height}" "${destPath}"`);
  try { fs.unlinkSync(tmpSvg); } catch (e) {}
  console.log(`Generated: ${destPath}`);
}

// 1. Board Template
function generateBoardSvg(title, subtitle, bullets, accentColor = '#e11d48', tag = 'UNIONFAM · LIFE LAB') {
  const bulletItems = bullets.map((b, i) => `
    <g transform="translate(60, ${260 + i * 85})">
      <rect x="0" y="6" width="12" height="12" rx="3" fill="${accentColor}" />
      <text x="30" y="18" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="22" font-weight="500" fill="#e2e8f0">${escapeXml(b.title || b)}</text>
      ${b.desc ? `<text x="30" y="44" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" fill="#94a3b8">${escapeXml(b.desc)}</text>` : ''}
    </g>
  `).join('');

  return `
  <svg width="1024" height="768" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0f172a"/>
        <stop offset="100%" stop-color="#1e293b"/>
      </linearGradient>
    </defs>
    <rect width="1024" height="768" fill="url(#bgGrad)"/>
    <rect x="0" y="0" width="1024" height="12" fill="${accentColor}"/>
    <rect x="30" y="30" width="964" height="708" rx="16" fill="none" stroke="#334155" stroke-width="2"/>
    
    <!-- Tag -->
    <rect x="60" y="60" width="260" height="36" rx="8" fill="${accentColor}"/>
    <text x="75" y="84" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="bold" letter-spacing="2" fill="#ffffff">${escapeXml(tag)}</text>
    
    <!-- Title -->
    <text x="60" y="145" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="34" font-weight="800" fill="#f8fafc">${escapeXml(title)}</text>
    <text x="60" y="185" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="400" fill="#94a3b8">${escapeXml(subtitle)}</text>
    
    <line x1="60" y1="215" x2="964" y2="215" stroke="#334155" stroke-width="2"/>
    
    ${bulletItems}
  </svg>`;
}

// Generate Boards 01 - 06
renderSvgToWebp(generateBoardSvg(
  'TRIẾT LÝ & ĐỊNH HƯỚNG CỐT LÕI',
  'Tiền bạc & Cuộc đời bạn thực sự muốn sống',
  [
    { title: 'Hãy kiếm tiền, nhưng trước tiên hãy biết tiền phục vụ cuộc đời nào.', desc: 'Không cổ súy bỏ tất cả mù quáng hay chạy theo kỳ vọng xã hội.' },
    { title: 'Tự xác định đâu là lựa chọn của mình và đâu là áp lực bên ngoài.', desc: 'Nhận diện các khuôn mẫu: chọn nghề vì gia đình, mua nhà, kết hôn theo chuẩn.' },
    { title: 'Cuộc sống tốt đẹp hơn (Better) do chính bạn định nghĩa.', desc: 'Không mặc định là kiếm nhiều tiền hơn hay làm việc kiệt sức.' },
    { title: 'Bắt đầu hành trình Life Design ngay hôm nay.', desc: 'Tạo dựng sự rõ ràng có xác nhận trong từng quyết định.' }
  ],
  '#e11d48'
), path.join(OUT_DIR, 'photos/board/board-01.webp'));

renderSvgToWebp(generateBoardSvg(
  'TIẾN TRÌNH 3 BƯỚC: UNDERSTAND → CHOOSE → BECOME',
  'Phương pháp luận thiết kế cuộc đời của Life Lab',
  [
    { title: '1. UNDERSTAND YOURSELF (Hiểu mình)', desc: 'Hiểu điều mình đang sống, nhu cầu cốt lõi và hoàn cảnh ảnh hưởng đến lựa chọn.' },
    { title: '2. CHOOSE YOUR LIFE (Lựa chọn)', desc: 'Nhìn thấy các hướng đi khả thi, điều kiện cần có và sự đánh đổi của từng hướng.' },
    { title: '3. BECOME YOUR BETTER VERSION (Trở thành)', desc: 'Tự quyết định phiên bản muốn trở thành và từng bước đưa lựa chọn vào thực tế.' },
    { title: 'Đồng hành dài hạn có xác nhận', desc: 'Mọi insight đều là giả thuyết chờ người dùng phản hồi và kiểm chứng.' }
  ],
  '#f59e0b'
), path.join(OUT_DIR, 'photos/board/board-02.webp'));

renderSvgToWebp(generateBoardSvg(
  'CURRENT LIFE SNAPSHOT',
  'Bức tranh hiện trạng đa chiều có kiểm chứng',
  [
    { title: 'Khảo sát 4 Trụ Cột Đời Sống', desc: 'Công việc & Tài chính, Mối quan hệ, Năng lượng sống, Mức độ tự chủ.' },
    { title: 'AI phản chiếu trước khi diễn giải', desc: 'Lắng nghe chân thực, không phán xét, không đưa lời khuyên sáo rỗng.' },
    { title: 'Quyền tự chủ dữ liệu tuyệt đối', desc: 'Người dùng có quyền sửa đổi, loại bỏ hoặc từ chối mọi phản chiếu.' },
    { title: 'Nền tảng cho mọi quyết định tiếp theo', desc: 'Giúp bạn dừng lại trước khi lao quá sâu vào vòng xoáy kiếm tiền.' }
  ],
  '#3b82f6'
), path.join(OUT_DIR, 'photos/board/board-03.webp'));

renderSvgToWebp(generateBoardSvg(
  'THE GAP & CURRENT FOCUS',
  'Nhận diện khoảng cách & Thiết lập 1 trọng tâm duy nhất',
  [
    { title: 'The Gap: Kỳ vọng bên ngoài vs Mong muốn bên trong', desc: 'Làm rõ sự mâu thuẫn giữa kỳ vọng người khác và khao khát thật sự.' },
    { title: 'Current Focus: 1 Trọng tâm duy nhất', desc: 'Tránh quá tải mục tiêu; tập trung giải quyết nút thắt then chốt lúc này.' },
    { title: 'Phân luồng đối tượng phù hợp', desc: 'BEFORE (18-25: Chưa bắt đầu quá sâu) & RESET (25-35: Muốn nhìn nhận lại).' },
    { title: 'Chuyển hóa nhận thức thành hành động', desc: 'Mở đường cho các thử nghiệm thực tế (Life Experiments).' }
  ],
  '#8b5cf6'
), path.join(OUT_DIR, 'photos/board/board-04.webp'));

renderSvgToWebp(generateBoardSvg(
  'LIFE EXPERIMENTS',
  'Những thử nghiệm nhỏ có thể bắt đầu ngay hôm nay',
  [
    { title: 'Thử nghiệm an toàn trong 7 - 14 ngày', desc: 'Hành động nhỏ, rủi ro thấp để kiểm chứng mong muốn cá nhân.' },
    { title: 'Đo lường năng lượng & cảm xúc thực tế', desc: 'Theo dõi sự thay đổi năng lượng sau mỗi thử nghiệm.' },
    { title: 'Review & Điều chỉnh liên tục', desc: 'Không phán xét thất bại; mọi kết quả đều mang lại dữ liệu quý giá.' },
    { title: 'Biến ước mơ thành các bước đi cụ thể', desc: 'Từng bước đưa lựa chọn mới vào nhịp sống thường nhật.' }
  ],
  '#10b981'
), path.join(OUT_DIR, 'photos/board/board-05.webp'));

renderSvgToWebp(generateBoardSvg(
  'LIVING LIFE MAP & MEMORY CENTER',
  'Bản đồ cuộc sống sống động & Quản lý ký ức minh bạch',
  [
    { title: 'Living Life Map có lịch sử phiên bản', desc: 'Cập nhật linh hoạt theo từng giai đoạn trưởng thành của bạn.' },
    { title: 'Không bị quá khứ áp đặt', desc: 'Bắt đầu lại (Reset) bất cứ lúc nào bạn sẵn sàng.' },
    { title: 'Memory Center minh bạch', desc: 'Toàn quyền xem nguồn, chỉnh sửa, lưu trữ hoặc xóa bỏ dữ liệu.' },
    { title: 'UnionFam đồng hành dài hạn', desc: 'Cùng bạn xây dựng cuộc đời tự chủ, hạnh phúc và ý nghĩa.' }
  ],
  '#ec4899'
), path.join(OUT_DIR, 'photos/board/board-06.webp'));

renderSvgToWebp(generateBoardSvg(
  'BẢN ĐỒ TỔNG QUAN LIFE LAB',
  'Khung định vị & Lộ trình thiết kế cuộc sống tự chủ',
  [
    { title: 'Before (18-25): Định hình giá trị & độc lập kinh tế', desc: 'Chuẩn bị bước vào đời sống kinh tế với tâm thế chủ động.' },
    { title: 'Reset (25-35): Tái định hướng & làm mới cuộc sống', desc: 'Dừng lại để xem xét liệu cuộc sống hiện tại có thực sự là của mình.' },
    { title: 'Triết lý: Understand → Choose → Become', desc: 'Hiểu mình → Tự lựa chọn → Từng bước kiến tạo.' },
    { title: 'Bắt đầu tương tác tại Trạm Đồng Hành AI', desc: 'Bấm phím E vào màn hình máy tính để bắt đầu phiên phản chiếu.' }
  ],
  '#f43f5e'
), path.join(OUT_DIR, 'photos/board/heist-board.webp'));

// 2. Hero Frame (Ảnh lớn trên tường)
const heroSvg = `
<svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="hGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#090d16"/>
      <stop offset="100%" stop-color="#1e1b2e"/>
    </linearGradient>
  </defs>
  <rect width="1024" height="1024" fill="url(#hGrad)"/>
  <rect x="0" y="0" width="1024" height="20" fill="#e11d48"/>
  <rect x="50" y="50" width="924" height="924" rx="20" fill="none" stroke="#334155" stroke-width="3"/>
  
  <rect x="100" y="100" width="300" height="40" rx="8" fill="#e11d48"/>
  <text x="120" y="126" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="bold" letter-spacing="3" fill="#ffffff">UNIONFAM · LIFE LAB</text>
  
  <text x="100" y="220" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="44" font-weight="900" fill="#ffffff">TÔI THỰC SỰ MUỐN</text>
  <text x="100" y="280" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="44" font-weight="900" fill="#e11d48">SỐNG CUỘC ĐỜI NÀO?</text>
  
  <line x1="100" y1="330" x2="924" y2="330" stroke="#475569" stroke-width="2"/>
  
  <text x="100" y="400" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="24" font-weight="500" fill="#f1f5f9">Life Lab không tồn tại để quyết định cuộc đời bạn.</text>
  <text x="100" y="450" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="22" font-weight="400" fill="#cbd5e1">Life Lab giúp bạn hiểu lựa chọn của chính mình</text>
  <text x="100" y="500" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="22" font-weight="400" fill="#cbd5e1">và biến lựa chọn đó thành cuộc sống có thể bắt đầu ngay hôm nay.</text>
  
  <g transform="translate(100, 580)">
    <rect width="824" height="180" rx="16" fill="#1e293b" stroke="#334155" stroke-width="2"/>
    <text x="40" y="55" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="bold" fill="#f59e0b">TIẾN TRÌNH THIẾT KẾ CUỘC ĐỜI:</text>
    <text x="40" y="100" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="24" font-weight="bold" fill="#38bdf8">UNDERSTAND  ➔  CHOOSE  ➔  BECOME</text>
    <text x="40" y="145" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" fill="#94a3b8">Hiểu mình  •  Tự chủ lựa chọn  •  Trở thành phiên bản phù hợp</text>
  </g>
  
  <g transform="translate(100, 810)">
    <rect width="320" height="60" rx="12" fill="#e11d48"/>
    <text x="45" y="38" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="bold" fill="#ffffff">KHÁM PHÁ 3D STUDIO ➔</text>
  </g>
</svg>`;
renderSvgToWebp(heroSvg, path.join(OUT_DIR, 'photos/foto-intervista-frame.webp'), 1024, 1024);

// 3. Logo Square Big
const logoSvg = `
<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="#0b0f19"/>
  <rect x="30" y="30" width="452" height="452" rx="24" fill="#111827" stroke="#e11d48" stroke-width="6"/>
  <circle cx="256" cy="180" r="60" fill="#e11d48" opacity="0.15"/>
  <circle cx="256" cy="180" r="40" fill="none" stroke="#e11d48" stroke-width="4"/>
  <circle cx="256" cy="180" r="15" fill="#e11d48"/>
  
  <text x="256" y="300" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="34" font-weight="900" letter-spacing="4" fill="#ffffff">UNIONFAM</text>
  <text x="256" y="350" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="24" font-weight="800" letter-spacing="6" fill="#e11d48">LIFE LAB</text>
  <text x="256" y="395" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="600" letter-spacing="4" fill="#94a3b8">3D STUDIO</text>
</svg>`;
renderSvgToWebp(logoSvg, path.join(OUT_DIR, 'logos/logo-square-big.webp'), 512, 512);

// 4. Computer Screens (AI Companion Terminal & Living Life Map Dashboard)
const screen1Svg = `
<svg width="1024" height="768" xmlns="http://www.w3.org/2000/svg">
  <rect width="1024" height="768" fill="#0d1117"/>
  <rect width="1024" height="48" fill="#161b22"/>
  <circle cx="25" cy="24" r="7" fill="#ff5f56"/>
  <circle cx="50" cy="24" r="7" fill="#ffbd2e"/>
  <circle cx="75" cy="24" r="7" fill="#27c93f"/>
  <text x="110" y="30" font-family="monospace" font-size="16" fill="#8b949e">unionfam-lifelab-ai-companion ~ session-v2.0</text>
  
  <g transform="translate(40, 90)">
    <text x="0" y="0" font-family="monospace" font-size="18" fill="#58a6ff">[LIFE LAB AI]: Xin chào! Chúng ta cùng bắt đầu phiên phản chiếu hiện trạng.</text>
    <text x="0" y="35" font-family="monospace" font-size="16" fill="#8b949e">&gt; Bạn đang ở giai đoạn nào trong cuộc sống?</text>
    
    <g transform="translate(0, 65)">
      <rect width="944" height="50" rx="8" fill="#21262d" stroke="#30363d"/>
      <text x="20" y="32" font-family="monospace" font-size="16" fill="#7ee787">[1] BEFORE (18-25 tuổi): Chuẩn bị bước vào đời sống kinh tế, cần định vị hướng đi.</text>
    </g>
    
    <g transform="translate(0, 130)">
      <rect width="944" height="50" rx="8" fill="#21262d" stroke="#30363d"/>
      <text x="20" y="32" font-family="monospace" font-size="16" fill="#7ee787">[2] RESET (25-35 tuổi): Đang kiếm tiền nhưng chưa thấy hạnh phúc / Sống theo kỳ vọng.</text>
    </g>
    
    <g transform="translate(0, 210)">
      <rect width="944" height="140" rx="8" fill="#161b22" stroke="#388bfd" stroke-width="2"/>
      <text x="20" y="35" font-family="monospace" font-size="16" font-weight="bold" fill="#58a6ff">[AI REFLECTION &amp; HYPOTHESIS]:</text>
      <text x="20" y="70" font-family="monospace" font-size="15" fill="#e6edf3">&quot;Tiền bạc là công cụ hỗ trợ cuộc đời bạn muốn sống, không phải là thước đo duy nhất.&quot;</text>
      <text x="20" y="105" font-family="monospace" font-size="15" fill="#d29922">&gt; Current Focus đề xuất: Phân tách mong muốn thật sự của bản thân khỏi áp lực xã hội.</text>
    </g>
    
    <g transform="translate(0, 380)">
      <text x="0" y="25" font-family="monospace" font-size="16" fill="#79c0ff">Nhấn [E] để tương tác trực tiếp với trạm AI Life Lab...</text>
    </g>
  </g>
</svg>`;
renderSvgToWebp(screen1Svg, path.join(OUT_DIR, 'photos/screens/andrea-monitor-a.webp'));
renderSvgToWebp(screen1Svg, path.join(OUT_DIR, 'photos/screens/editor-screen.webp'));

const screen2Svg = `
<svg width="1024" height="768" xmlns="http://www.w3.org/2000/svg">
  <rect width="1024" height="768" fill="#0f172a"/>
  <rect width="1024" height="56" fill="#1e293b"/>
  <text x="40" y="36" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="bold" fill="#38bdf8">LIVING LIFE MAP DASHBOARD · UNIONFAM</text>
  
  <g transform="translate(40, 90)">
    <!-- Card 1: Snapshot -->
    <rect width="450" height="280" rx="12" fill="#1e293b" stroke="#334155" stroke-width="2"/>
    <rect x="25" y="25" width="160" height="28" rx="6" fill="#e11d48"/>
    <text x="35" y="44" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="bold" fill="#ffffff">CURRENT SNAPSHOT</text>
    <text x="25" y="85" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" fill="#e2e8f0">• Giai đoạn: Reset (25–35 tuổi)</text>
    <text x="25" y="125" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" fill="#e2e8f0">• Nguồn lực: Tự chủ kinh tế bước đầu</text>
    <text x="25" y="165" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" fill="#e2e8f0">• Khoảng cách (The Gap): Thời gian &amp; Hạnh phúc</text>
    <text x="25" y="205" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" fill="#f59e0b">• Mức độ rõ ràng: Đang tiến triển (Clearer)</text>
  </g>
  
  <g transform="translate(534, 90)">
    <!-- Card 2: Life Experiment -->
    <rect width="450" height="280" rx="12" fill="#1e293b" stroke="#334155" stroke-width="2"/>
    <rect x="25" y="25" width="180" height="28" rx="6" fill="#10b981"/>
    <text x="35" y="44" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="bold" fill="#ffffff">LIFE EXPERIMENT (7 NGÀY)</text>
    <text x="25" y="85" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="bold" fill="#f1f5f9">Thử nghiệm: 30 Phút Tự Quyết Mỗi Tối</text>
    <text x="25" y="120" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" fill="#94a3b8">Dành 30 phút mỗi ngày ghi nhận 3 điều bạn hoàn toàn tự quyết định mà không chịu ảnh hưởng từ bên ngoài.</text>
    <text x="25" y="175" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" fill="#38bdf8">Trạng thái: Đang diễn ra (Ngày 3/7)</text>
    <text x="25" y="210" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" fill="#a855f7">Check-in tiếp theo: Ngày 24/09/2026</text>
  </g>
  
  <g transform="translate(40, 400)">
    <!-- Card 3: Memory Center status -->
    <rect width="944" height="150" rx="12" fill="#1e293b" stroke="#334155" stroke-width="2"/>
    <text x="25" y="40" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="bold" fill="#f8fafc">MEMORY CENTER &amp; CONFIRMED INSIGHTS</text>
    <text x="25" y="80" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="15" fill="#cbd5e1">✓ Đã xác nhận 3 Insights cốt lõi  |  ✓ 1 Life Experiment đang theo dõi  |  ✓ 0 Xung đột dữ liệu</text>
    <text x="25" y="115" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" fill="#94a3b8">Bản quyền &amp; Dữ liệu thuộc về bạn. Bạn có quyền xuất file, chỉnh sửa hoặc xóa vĩnh viễn bất kỳ lúc nào.</text>
  </g>
</svg>`;
renderSvgToWebp(screen2Svg, path.join(OUT_DIR, 'photos/screens/andrea-monitor-b.webp'));
renderSvgToWebp(screen2Svg, path.join(OUT_DIR, 'photos/screens/localhost-screen.webp'));

console.log('All UnionFam Life Lab graphic assets generated successfully!');
