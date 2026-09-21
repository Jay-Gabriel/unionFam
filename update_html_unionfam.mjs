import fs from 'fs';

const indexPath = '/home/jay/office-graffico-clone/index.html';
let html = fs.readFileSync(indexPath, 'utf-8');

// 1. Replace titles and metadata
html = html.replace(/<title>.*?<\/title>/g, '<title>UnionFam Life Lab | 3D Studio &amp; Life Design</title>');
html = html.replace(/Graffico Office \| a 3D studio you can walk through/g, 'UnionFam Life Lab | Không Gian Thiết Kế Cuộc Đời 3D');
html = html.replace(/The Graffico studio in 3D, explored in first person: walk between the desks, tune the radio, write code on a live screen - in the browser, no install\./g, 'Không gian 3D tương tác Life Lab của UnionFam: Đồng hành, phản chiếu và thiết kế cuộc đời tự chủ (Understand → Choose → Become).');
html = html.replace(/Graffico Office/g, 'UnionFam Life Lab');
html = html.replace(/loading the office/g, 'đang tải life lab 3d studio');
html = html.replace(/Graffico/g, 'UnionFam');

// 2. Add an interactive Life Lab AI Companion drawer/modal
const lifeLabOverlayHtml = `
<!-- UnionFam Life Lab Interactive Companion Overlay -->
<div id="lifelab-hud" style="position:fixed;top:20px;left:20px;z-index:9999;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;pointer-events:auto;">
  <div style="background:rgba(15,23,42,0.85);backdrop-filter:blur(12px);border:1px solid rgba(225,29,72,0.4);border-radius:16px;padding:12px 20px;display:flex;align-items:center;gap:16px;box-shadow:0 8px 32px rgba(0,0,0,0.5);color:#fff;">
    <div style="display:flex;align-items:center;gap:10px;">
      <div style="width:12px;height:12px;border-radius:50%;background:#e11d48;box-shadow:0 0 10px #e11d48;"></div>
      <span style="font-weight:800;letter-spacing:1px;font-size:14px;color:#f8fafc;">UNIONFAM · LIFE LAB</span>
    </div>
    <div style="height:20px;width:1px;background:#334155;"></div>
    <button id="btn-open-session" style="background:#e11d48;color:#fff;border:none;padding:6px 14px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;transition:all 0.2s;display:flex;align-items:center;gap:6px;">
      <span>✨ Trạm Đồng Hành AI</span>
    </button>
    <button id="btn-open-lifemap" style="background:#1e293b;color:#38bdf8;border:1px solid #334155;padding:6px 14px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;transition:all 0.2s;">
      <span>📋 Living Life Map</span>
    </button>
  </div>
</div>

<!-- Modal: Life Lab AI Session -->
<div id="lifelab-modal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.75);backdrop-filter:blur(8px);z-index:10000;align-items:center;justify-content:center;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="background:#0f172a;border:1px solid #334155;border-radius:20px;width:90%;max-width:680px;max-height:85vh;overflow-y:auto;box-shadow:0 25px 50px -12px rgba(0,0,0,0.7);color:#f8fafc;padding:32px;position:relative;">
    <button id="btn-close-modal" style="position:absolute;top:20px;right:20px;background:#1e293b;border:none;color:#94a3b8;width:32px;height:32px;border-radius:50%;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;">&times;</button>
    
    <div style="display:inline-block;background:#e11d48;color:#fff;padding:4px 12px;border-radius:6px;font-size:12px;font-weight:bold;letter-spacing:1px;margin-bottom:12px;">FIRST SESSION · V2.0</div>
    <h2 style="font-size:24px;font-weight:800;margin:0 0 8px 0;color:#ffffff;">Khảo Sát Hiện Trạng &amp; Phản Chiếu Cuộc Sống</h2>
    <p style="font-size:14px;color:#94a3b8;margin:0 0 24px 0;line-height:1.6;">Life Lab không quyết định cuộc đời bạn. Chúng tôi giúp bạn hiểu lựa chọn của chính mình.</p>
    
    <!-- Step 1 -->
    <div id="session-step-1">
      <p style="font-size:16px;font-weight:600;color:#38bdf8;margin-bottom:12px;">Bước 1: Hiện tại bạn thuộc nhóm nào?</p>
      <div style="display:flex;flex-direction:column;gap:12px;">
        <label style="background:#1e293b;border:1px solid #334155;padding:16px;border-radius:12px;cursor:pointer;display:flex;align-items:flex-start;gap:12px;">
          <input type="radio" name="life-stage" value="before" style="margin-top:4px;" checked>
          <div>
            <div style="font-weight:bold;color:#f1f5f9;">BEFORE (18–25 tuổi) — Chưa bước vào quá sâu</div>
            <div style="font-size:13px;color:#94a3b8;margin-top:4px;">Chuẩn bị bước vào đời sống kinh tế, muốn hiểu mình trước khi lao vào vòng xoáy kiếm tiền.</div>
          </div>
        </label>
        <label style="background:#1e293b;border:1px solid #334155;padding:16px;border-radius:12px;cursor:pointer;display:flex;align-items:flex-start;gap:12px;">
          <input type="radio" name="life-stage" value="reset" style="margin-top:4px;">
          <div>
            <div style="font-weight:bold;color:#f1f5f9;">RESET (25–35 tuổi) — Đã bắt đầu chạy nhưng muốn nhìn lại</div>
            <div style="font-size:13px;color:#94a3b8;margin-top:4px;">Đang kiếm được tiền nhưng nhận ra mình đang sống theo kỳ vọng người khác hoặc chưa thấy hạnh phúc.</div>
          </div>
        </label>
      </div>

      <p style="font-size:16px;font-weight:600;color:#38bdf8;margin:24px 0 12px 0;">Bước 2: Nỗi băn khoăn lớn nhất lúc này của bạn là gì?</p>
      <div style="display:flex;flex-direction:column;gap:12px;">
        <label style="background:#1e293b;border:1px solid #334155;padding:14px;border-radius:12px;cursor:pointer;display:flex;align-items:center;gap:12px;">
          <input type="radio" name="life-pain" value="pain_a" style="margin:0;" checked>
          <span style="font-size:14px;color:#e2e8f0;">"Tôi đang kiếm được tiền nhưng không thấy đây là cuộc sống mình muốn."</span>
        </label>
        <label style="background:#1e293b;border:1px solid #334155;padding:14px;border-radius:12px;cursor:pointer;display:flex;align-items:center;gap:12px;">
          <input type="radio" name="life-pain" value="pain_b" style="margin:0;">
          <span style="font-size:14px;color:#e2e8f0;">"Tôi nhận ra phần lớn lựa chọn đến từ kỳ vọng của gia đình &amp; xã hội."</span>
        </label>
        <label style="background:#1e293b;border:1px solid #334155;padding:14px;border-radius:12px;cursor:pointer;display:flex;align-items:center;gap:12px;">
          <input type="radio" name="life-pain" value="pain_c" style="margin:0;">
          <span style="font-size:14px;color:#e2e8f0;">"Tôi muốn bắt đầu một hướng đi mới nhưng chưa rõ điều kiện đánh đổi."</span>
        </label>
      </div>
      
      <button id="btn-submit-step1" style="margin-top:24px;width:100%;background:#e11d48;color:#fff;border:none;padding:14px;border-radius:12px;font-size:15px;font-weight:bold;cursor:pointer;">
        Nhận Phản Chiếu AI Snapshot ➔
      </button>
    </div>

    <!-- Step 2: Result Snapshot -->
    <div id="session-step-2" style="display:none;">
      <div style="background:#161b22;border:1px solid #30363d;border-radius:12px;padding:20px;margin-bottom:20px;">
        <div style="color:#58a6ff;font-weight:bold;font-size:15px;margin-bottom:8px;">🎯 AI REFLECTION &amp; HYPOTHESIS:</div>
        <p id="snapshot-reflection-text" style="font-size:14px;color:#e6edf3;line-height:1.6;margin:0 0 12px 0;"></p>
        
        <div style="border-top:1px solid #30363d;padding-top:12px;margin-top:12px;">
          <div style="color:#d29922;font-weight:bold;font-size:14px;margin-bottom:4px;">📍 CURRENT FOCUS ĐỀ XUẤT:</div>
          <p id="snapshot-focus-text" style="font-size:14px;color:#f0f6fc;margin:0;"></p>
        </div>

        <div style="border-top:1px solid #30363d;padding-top:12px;margin-top:12px;">
          <div style="color:#3fb950;font-weight:bold;font-size:14px;margin-bottom:4px;">🧪 LIFE EXPERIMENT (THỬ NGHIỆM 7 NGÀY):</div>
          <p id="snapshot-experiment-text" style="font-size:14px;color:#f0f6fc;margin:0;"></p>
        </div>
      </div>

      <div style="display:flex;gap:12px;">
        <button id="btn-confirm-snapshot" style="flex:1;background:#10b981;color:#fff;border:none;padding:12px;border-radius:10px;font-weight:bold;cursor:pointer;">
          ✓ Xác Nhận &amp; Lưu Vào Life Map
        </button>
        <button id="btn-restart-session" style="background:#334155;color:#f1f5f9;border:none;padding:12px 20px;border-radius:10px;font-weight:600;cursor:pointer;">
          Làm lại
        </button>
      </div>
    </div>
  </div>
</div>

<script>
(function(){
  var btnOpenSession = document.getElementById('btn-open-session');
  var btnOpenLifeMap = document.getElementById('btn-open-lifemap');
  var btnCloseModal = document.getElementById('btn-close-modal');
  var modal = document.getElementById('lifelab-modal');
  var step1 = document.getElementById('session-step-1');
  var step2 = document.getElementById('session-step-2');
  var btnSubmit = document.getElementById('btn-submit-step1');
  var btnConfirm = document.getElementById('btn-confirm-snapshot');
  var btnRestart = document.getElementById('btn-restart-session');
  
  if (btnOpenSession) {
    btnOpenSession.onclick = function() {
      modal.style.display = 'flex';
      step1.style.display = 'block';
      step2.style.display = 'none';
    };
  }

  if (btnOpenLifeMap) {
    btnOpenLifeMap.onclick = function() {
      modal.style.display = 'flex';
      step1.style.display = 'none';
      step2.style.display = 'block';
      showSnapshot({
        stage: 'reset',
        pain: 'pain_a'
      });
    };
  }
  
  if (btnCloseModal) {
    btnCloseModal.onclick = function() {
      modal.style.display = 'none';
    };
  }

  function showSnapshot(data) {
    var refText = data.stage === 'before' 
      ? 'Bạn đang ở giai đoạn kiến tạo nền tảng. Life Lab phản chiếu rằng: Việc kiếm tiền là rất quan trọng, nhưng việc xác định giá trị cốt lõi trước sẽ giúp bạn không bị lạc lối sau 5-10 năm tới.'
      : 'Bạn đã đạt được những thành quả kinh tế nhất định nhưng nhận thấy sự không đồng nhất giữa nỗ lực mỗi ngày và niềm vui sống thật sự. Bạn đang cần một khoảng lặng có chủ đích để tái định hình.';
    
    var focusText = data.pain === 'pain_b'
      ? 'Phân tách rạch ròi giữa kỳ vọng của gia đình/xã hội và mong muốn nội tại của chính bạn.'
      : 'Làm rõ định nghĩa "Cuộc sống tốt hơn" theo tiêu chuẩn của riêng bạn, thay vì quy đổi hoàn toàn ra tiền bạc.';
      
    var expText = 'Dành 20 phút mỗi buổi tối trong 7 ngày tới: Không dùng điện thoại, ghi lại 3 quyết định bạn tự đưa ra trong ngày và cảm nhận năng lượng đi kèm.';

    document.getElementById('snapshot-reflection-text').textContent = refText;
    document.getElementById('snapshot-focus-text').textContent = focusText;
    document.getElementById('snapshot-experiment-text').textContent = expText;
  }

  if (btnSubmit) {
    btnSubmit.onclick = function() {
      var stage = document.querySelector('input[name="life-stage"]:checked').value;
      var pain = document.querySelector('input[name="life-pain"]:checked').value;
      showSnapshot({ stage: stage, pain: pain });
      step1.style.display = 'none';
      step2.style.display = 'block';
    };
  }

  if (btnConfirm) {
    btnConfirm.onclick = function() {
      alert('✓ Đã xác nhận và cập nhật vào Living Life Map của bạn thành công!');
      modal.style.display = 'none';
    };
  }

  if (btnRestart) {
    btnRestart.onclick = function() {
      step1.style.display = 'block';
      step2.style.display = 'none';
    };
  }
})();
</script>
`;

// Insert overlay before </body>
html = html.replace('</body>', lifeLabOverlayHtml + '</body>');

fs.writeFileSync(indexPath, html, 'utf-8');
console.log('Successfully updated index.html with UnionFam Life Lab branding, content, and interactive companion!');
