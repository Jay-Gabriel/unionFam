import fs from 'fs';

const origHtml = fs.readFileSync('/home/jay/office-graffico-clone/index.original.html', 'utf-8');

// Clean original HTML
let html = origHtml.replace(/<script>\(function\(\)\{function c\(\).*?<\/script><\/body>/s, '</body>');
html = html.replace(/<title>.*?<\/title>/, '<title>UnionFam Life Lab | 3D Studio &amp; Life Design</title>');

// Create Comprehensive UnionFam Life Lab Interactive Hub & 3D Guided Tour
const unionFamHubHtml = `
<style>
  .uf-hud-btn {
    background: rgba(30, 41, 59, 0.85);
    color: #f1f5f9;
    border: 1px solid rgba(51, 65, 85, 0.8);
    padding: 8px 16px;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    display: flex;
    align-items: center;
    gap: 8px;
    backdrop-filter: blur(8px);
  }
  .uf-hud-btn:hover {
    background: #e11d48;
    color: #ffffff;
    border-color: #e11d48;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(225, 29, 72, 0.35);
  }
  .uf-hud-btn.active {
    background: #e11d48;
    color: #ffffff;
    border-color: #e11d48;
  }
  .uf-tab-btn {
    padding: 10px 18px;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 700;
    border: none;
    cursor: pointer;
    transition: all 0.2s;
    background: transparent;
    color: #94a3b8;
  }
  .uf-tab-btn.active {
    background: #e11d48;
    color: #ffffff;
    box-shadow: 0 4px 14px rgba(225, 29, 72, 0.4);
  }
  .uf-card {
    background: #1e293b;
    border: 1px solid #334155;
    border-radius: 14px;
    padding: 18px;
    margin-bottom: 14px;
  }
  .uf-input {
    width: 100%;
    background: #0f172a;
    border: 1px solid #334155;
    color: #f8fafc;
    border-radius: 10px;
    padding: 12px 16px;
    font-size: 14px;
    outline: none;
    box-sizing: border-box;
  }
  .uf-input:focus {
    border-color: #e11d48;
  }
  .uf-tour-step {
    border-left: 3px solid #e11d48;
    padding-left: 16px;
    margin-bottom: 20px;
  }
</style>

<!-- Top Fixed HUD -->
<div id="lifelab-hud" style="position:fixed;top:16px;left:16px;z-index:9999;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;pointer-events:auto;">
  <div style="background:rgba(15,23,42,0.92);backdrop-filter:blur(16px);border:1px solid rgba(225,29,72,0.45);border-radius:18px;padding:8px 14px;display:flex;align-items:center;gap:10px;box-shadow:0 12px 36px rgba(0,0,0,0.6);color:#fff;">
    <div style="display:flex;align-items:center;gap:8px;padding:0 8px;">
      <div style="width:10px;height:10px;border-radius:50%;background:#e11d48;box-shadow:0 0 10px #e11d48;animation:pulse 2s infinite;"></div>
      <span style="font-weight:900;letter-spacing:1px;font-size:13px;color:#f8fafc;">UNIONFAM · LIFE LAB</span>
    </div>
    <div style="height:22px;width:1px;background:#334155;"></div>
    
    <button class="uf-hud-btn" onclick="openLifeLabModal('tour')">
      <span>🚩 Guided Tour 3D</span>
    </button>
    <button class="uf-hud-btn active" onclick="openLifeLabModal('chat')">
      <span>🤖 Hỏi &amp; Đối Thoại AI</span>
    </button>
    <button class="uf-hud-btn" onclick="openLifeLabModal('experiments')">
      <span>🧪 Thử Nghiệm &amp; Tiến Độ</span>
    </button>
    <button class="uf-hud-btn" onclick="openLifeLabModal('insights')">
      <span>💡 Rút Ra Bài Học</span>
    </button>
  </div>
</div>

<!-- Main Modal Interface -->
<div id="lifelab-modal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.8);backdrop-filter:blur(10px);z-index:10000;align-items:center;justify-content:center;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="background:#0f172a;border:1px solid #334155;border-radius:24px;width:92%;max-width:840px;height:88vh;display:flex;flex-direction:column;box-shadow:0 25px 60px rgba(0,0,0,0.85);color:#f8fafc;overflow:hidden;position:relative;">
    
    <!-- Modal Header -->
    <div style="padding:20px 28px;background:#1e293b;border-bottom:1px solid #334155;display:flex;align-items:center;justify-content:space-between;">
      <div style="display:flex;align-items:center;gap:12px;">
        <div style="background:#e11d48;color:#fff;padding:4px 10px;border-radius:6px;font-size:11px;font-weight:bold;letter-spacing:1px;">UNIONFAM · V2.0</div>
        <h3 style="margin:0;font-size:18px;font-weight:800;color:#f8fafc;">Life Lab Interactive Center</h3>
      </div>
      <button onclick="closeLifeLabModal()" style="background:#334155;border:none;color:#94a3b8;width:32px;height:32px;border-radius:50%;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;">&times;</button>
    </div>

    <!-- Navigation Tabs -->
    <div style="padding:10px 24px;background:#141d2e;border-bottom:1px solid #1e293b;display:flex;gap:8px;overflow-x:auto;">
      <button id="tab-tour-btn" class="uf-tab-btn" onclick="switchLifeLabTab('tour')">🚩 Guided Tour 3D</button>
      <button id="tab-chat-btn" class="uf-tab-btn active" onclick="switchLifeLabTab('chat')">🤖 Hỏi &amp; Đối Thoại AI</button>
      <button id="tab-experiments-btn" class="uf-tab-btn" onclick="switchLifeLabTab('experiments')">🧪 Thử Nghiệm &amp; Tiến Độ</button>
      <button id="tab-insights-btn" class="uf-tab-btn" onclick="switchLifeLabTab('insights')">💡 Rút Ra Bài Học</button>
    </div>

    <!-- Modal Content Body -->
    <div style="flex:1;overflow-y:auto;padding:24px 28px;">
      
      <!-- 1. TAB: GUIDED TOUR -->
      <div id="tab-tour" style="display:none;">
        <div style="background:linear-gradient(135deg, rgba(225,29,72,0.15), rgba(59,130,246,0.1));border:1px solid rgba(225,29,72,0.3);border-radius:16px;padding:20px;margin-bottom:24px;">
          <h4 style="margin:0 0 8px 0;font-size:18px;color:#ffffff;">🗺️ Hướng Dẫn Khám Phá Không Gian 3D Life Lab</h4>
          <p style="margin:0;font-size:14px;color:#cbd5e1;line-height:1.6;">
            Chào mừng bạn đến với <strong>UnionFam Life Lab 3D Studio</strong>. Sử dụng chuột để quan sát xung quanh, phím <strong>WASD / Phím mũi tên</strong> để di chuyển, và bấm phím <strong>[E] hoặc Click chuột</strong> vào các vật thể phát sáng để tương tác.
          </p>
        </div>

        <div style="display:flex;flex-direction:column;gap:16px;">
          <div class="uf-tour-step">
            <h5 style="margin:0 0 6px 0;font-size:16px;color:#f43f5e;">📍 Trạm 1: Màn Hình Bàn Làm Việc 1 (AI Companion Terminal)</h5>
            <p style="margin:0;font-size:14px;color:#94a3b8;line-height:1.5;">
              Nơi bạn đối thoại trực tiếp với AI Life Lab. Click vào màn hình để bắt đầu khảo sát hiện trạng, phân tích <strong>The Gap</strong> và xác định <strong>Current Focus</strong>.
            </p>
          </div>

          <div class="uf-tour-step" style="border-color:#38bdf8;">
            <h5 style="margin:0 0 6px 0;font-size:16px;color:#38bdf8;">📍 Trạm 2: Màn Hình Bàn Làm Việc 2 (Living Life Map Dashboard)</h5>
            <p style="margin:0;font-size:14px;color:#94a3b8;line-height:1.5;">
              Bảng điều khiển trực quan theo thời gian thực hiển thị tiến độ thử nghiệm 7 ngày và đo lường chỉ số năng lượng sống.
            </p>
          </div>

          <div class="uf-tour-step" style="border-color:#f59e0b;">
            <h5 style="margin:0 0 6px 0;font-size:16px;color:#f59e0b;">📍 Trạm 3: Bảng Dự Án Cuộc Đời (Project Wall - 6 Bảng)</h5>
            <p style="margin:0;font-size:14px;color:#94a3b8;line-height:1.5;">
              Hệ thống 6 bảng treo tường trình bày trọn vẹn: <em>(1) Triết lý tiền bạc &amp; cuộc sống; (2) Tiến trình 3 bước; (3) Snapshot; (4) The Gap &amp; Focus; (5) Thử nghiệm; (6) Memory Center.</em>
            </p>
          </div>

          <div class="uf-tour-step" style="border-color:#10b981;">
            <h5 style="margin:0 0 6px 0;font-size:16px;color:#10b981;">📍 Trạm 4: Đài Radio Tâm Trí (Mindful Reflection Audio)</h5>
            <p style="margin:0;font-size:14px;color:#94a3b8;line-height:1.5;">
              Đài phát radio thực tế với 5 kênh âm thanh chọn lọc: <em>Life Lab Focus, Mindful Lo-Fi, Quiet Ambient, Jazz Soul, Classical Clarity</em> để hỗ trợ suy ngẫm sâu.
            </p>
          </div>

          <div class="uf-tour-step" style="border-color:#a855f7;">
            <h5 style="margin:0 0 6px 0;font-size:16px;color:#a855f7;">📍 Trạm 5: Nút Phích Cắm Tường (Reset Safety Stop)</h5>
            <p style="margin:0;font-size:14px;color:#94a3b8;line-height:1.5;">
              Biểu tượng cho quyền tự chủ tuyệt đối: Bất kỳ lúc nào bạn cảm thấy quá tải hoặc muốn bắt đầu lại, bạn có thể rút phích cắm để Reset toàn bộ tiến trình.
            </p>
          </div>
        </div>
      </div>

      <!-- 2. TAB: CHAT / AI REFLECTION -->
      <div id="tab-chat">
        <div style="background:#161b22;border:1px solid #30363d;border-radius:14px;padding:16px;margin-bottom:16px;">
          <div style="color:#58a6ff;font-weight:bold;font-size:14px;margin-bottom:4px;">🤖 TRỢ LÝ ĐỒNG HÀNH LIFE LAB (KỊCH BẢN V2 / V7)</div>
          <p style="margin:0;font-size:13px;color:#8b949e;">Đặt câu hỏi hoặc chọn tình huống băn khoăn để AI phản chiếu hiện trạng của bạn.</p>
        </div>

        <div style="margin-bottom:16px;">
          <div style="font-size:13px;font-weight:bold;color:#94a3b8;margin-bottom:8px;">GỢI Ý CÂU HỎI NHANH:</div>
          <div style="display:flex;flex-wrap:wrap;gap:8px;">
            <button onclick="askPreset('Tôi đang kiếm được tiền tốt nhưng không thấy đây là cuộc sống mình muốn.')" style="background:#1e293b;border:1px solid #334155;color:#e2e8f0;padding:6px 12px;border-radius:8px;font-size:12px;cursor:pointer;">
              💰 Kiếm tiền nhưng chưa hạnh phúc
            </button>
            <button onclick="askPreset('Làm sao để biết tôi đang chọn nghề vì mình hay vì kỳ vọng của gia đình?')" style="background:#1e293b;border:1px solid #334155;color:#e2e8f0;padding:6px 12px;border-radius:8px;font-size:12px;cursor:pointer;">
              👨‍👩‍👧 Kỳ vọng gia đình vs Mong muốn
            </button>
            <button onclick="askPreset('Tôi muốn bắt đầu 1 thử nghiệm 7 ngày để tìm lại năng lượng.')" style="background:#1e293b;border:1px solid #334155;color:#e2e8f0;padding:6px 12px;border-radius:8px;font-size:12px;cursor:pointer;">
              🧪 Gợi ý thử nghiệm 7 ngày
            </button>
          </div>
        </div>

        <div id="chat-messages" style="background:#090d16;border:1px solid #1e293b;border-radius:14px;padding:16px;height:240px;overflow-y:auto;margin-bottom:16px;display:flex;flex-direction:column;gap:12px;">
          <div style="background:#1e293b;border-radius:12px;padding:12px 16px;align-self:flex-start;max-width:85%;">
            <div style="font-size:11px;font-weight:bold;color:#e11d48;margin-bottom:4px;">LIFE LAB AI</div>
            <div style="font-size:14px;color:#f1f5f9;line-height:1.5;">
              Chào bạn! Tôi ở đây để cùng bạn soi chiếu lại hiện trạng cuộc sống. Hãy chia sẻ điều đang khiến bạn băn khoăn nhất lúc này.
            </div>
          </div>
        </div>

        <div style="display:flex;gap:10px;">
          <input id="chat-input" class="uf-input" placeholder="Nhập câu hỏi hoặc chia sẻ băn khoăn của bạn..." onkeydown="if(event.key==='Enter')sendChatMessage()"/>
          <button onclick="sendChatMessage()" style="background:#e11d48;color:#fff;border:none;padding:0 20px;border-radius:10px;font-weight:bold;cursor:pointer;">
            Gửi ➔
          </button>
        </div>
      </div>

      <!-- 3. TAB: LIFE EXPERIMENTS -->
      <div id="tab-experiments" style="display:none;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
          <h4 style="margin:0;font-size:18px;color:#f8fafc;">🧪 Danh Sách Thử Nghiệm Cuộc Sống (Life Experiments)</h4>
          <span style="background:#10b981;color:#fff;padding:4px 10px;border-radius:8px;font-size:12px;font-weight:bold;">Đang chạy: 1 thử nghiệm</span>
        </div>

        <!-- Experiment Card -->
        <div class="uf-card" style="border-color:#10b981;">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">
            <div>
              <div style="font-size:11px;font-weight:bold;color:#10b981;letter-spacing:1px;">THỬ NGHIỆM 7 NGÀY · ĐANG TIẾN HÀNH</div>
              <h5 style="margin:4px 0;font-size:16px;color:#ffffff;">30 Phút Tự Quyết Mỗi Tối (No Distraction)</h5>
            </div>
            <span id="exp-progress-badge" style="background:#0f172a;border:1px solid #10b981;color:#10b981;padding:4px 10px;border-radius:8px;font-size:12px;font-weight:bold;">Tiến độ: 3/7 ngày (42%)</span>
          </div>

          <p style="font-size:13px;color:#cbd5e1;line-height:1.5;margin:0 0 14px 0;">
            Mỗi buổi tối dành trọn 30 phút không dùng điện thoại, ghi lại 3 quyết định bạn tự đưa ra trong ngày mà không bị chi phối bởi ý kiến bên ngoài.
          </p>

          <!-- Day tracker checkboxes -->
          <div style="display:flex;gap:8px;margin-bottom:16px;">
            <label style="flex:1;background:#0f172a;border:1px solid #334155;padding:8px;border-radius:8px;text-align:center;cursor:pointer;font-size:12px;color:#fff;">
              <input type="checkbox" checked onchange="updateExpProgress()"> Ngày 1
            </label>
            <label style="flex:1;background:#0f172a;border:1px solid #334155;padding:8px;border-radius:8px;text-align:center;cursor:pointer;font-size:12px;color:#fff;">
              <input type="checkbox" checked onchange="updateExpProgress()"> Ngày 2
            </label>
            <label style="flex:1;background:#0f172a;border:1px solid #334155;padding:8px;border-radius:8px;text-align:center;cursor:pointer;font-size:12px;color:#fff;">
              <input type="checkbox" checked onchange="updateExpProgress()"> Ngày 3
            </label>
            <label style="flex:1;background:#0f172a;border:1px solid #334155;padding:8px;border-radius:8px;text-align:center;cursor:pointer;font-size:12px;color:#94a3b8;">
              <input type="checkbox" onchange="updateExpProgress()"> Ngày 4
            </label>
            <label style="flex:1;background:#0f172a;border:1px solid #334155;padding:8px;border-radius:8px;text-align:center;cursor:pointer;font-size:12px;color:#94a3b8;">
              <input type="checkbox" onchange="updateExpProgress()"> Ngày 5
            </label>
            <label style="flex:1;background:#0f172a;border:1px solid #334155;padding:8px;border-radius:8px;text-align:center;cursor:pointer;font-size:12px;color:#94a3b8;">
              <input type="checkbox" onchange="updateExpProgress()"> Ngày 6
            </label>
            <label style="flex:1;background:#0f172a;border:1px solid #334155;padding:8px;border-radius:8px;text-align:center;cursor:pointer;font-size:12px;color:#94a3b8;">
              <input type="checkbox" onchange="updateExpProgress()"> Ngày 7
            </label>
          </div>

          <div style="background:#0f172a;padding:12px;border-radius:10px;display:flex;align-items:center;justify-content:space-between;">
            <span style="font-size:13px;color:#94a3b8;">Mức độ Năng lượng &amp; Tự chủ:</span>
            <input type="range" min="1" max="10" value="8" style="accent-color:#10b981;cursor:pointer;width:150px;">
            <span style="font-weight:bold;color:#10b981;font-size:14px;">8.5 / 10 (Rất tích cực)</span>
          </div>
        </div>

        <button onclick="alert('Tính năng khởi tạo thử nghiệm mới: Bạn có thể nhập mục tiêu và số ngày mong muốn.')" style="width:100%;background:#1e293b;border:1px dashed #475569;color:#38bdf8;padding:12px;border-radius:12px;font-weight:bold;cursor:pointer;">
          + Thiết Kế Thử Nghiệm Mới
        </button>
      </div>

      <!-- 4. TAB: INSIGHTS JOURNAL -->
      <div id="tab-insights" style="display:none;">
        <h4 style="margin:0 0 16px 0;font-size:18px;color:#f8fafc;">💡 Đúc Kết Bài Học &amp; Cập Nhật Living Life Map</h4>
        
        <div class="uf-card">
          <div style="font-size:13px;font-weight:bold;color:#f59e0b;margin-bottom:8px;">NHẬT KÝ BÀI HỌC HÔM NAY:</div>
          <textarea id="insight-input" class="uf-input" rows="3" placeholder="Ghi lại bài học bạn rút ra sau ngày thử nghiệm (Ví dụ: Tôi nhận ra việc từ chối 1 yêu cầu vô lý giúp tôi tiết kiệm được 2 giờ căng thẳng...)"></textarea>
          <div style="display:flex;justify-content:flex-end;margin-top:10px;">
            <button onclick="saveInsight()" style="background:#10b981;color:#fff;border:none;padding:8px 18px;border-radius:8px;font-weight:bold;cursor:pointer;">
              ✓ Lưu Vào Living Life Map
            </button>
          </div>
        </div>

        <div style="font-size:14px;font-weight:bold;color:#94a3b8;margin:20px 0 10px 0;">CÁC BÀI HỌC ĐÃ XÁC NHẬN (CONFIRMED INSIGHTS):</div>
        <div id="insights-list" style="display:flex;flex-direction:column;gap:10px;">
          <div class="uf-card" style="margin:0;padding:14px;">
            <div style="font-size:12px;color:#38bdf8;font-weight:bold;">Insight #1 · Khảo sát hiện trạng</div>
            <div style="font-size:14px;color:#f1f5f9;margin-top:4px;">"Tiền bạc là phương tiện phục vụ cuộc đời, không phải mục tiêu tự thân."</div>
          </div>
          <div class="uf-card" style="margin:0;padding:14px;">
            <div style="font-size:12px;color:#38bdf8;font-weight:bold;">Insight #2 · Thử nghiệm ngày 2</div>
            <div style="font-size:14px;color:#f1f5f9;margin-top:4px;">"Dành 30 phút tự quyết giúp giảm 50% cảm giác kiệt sức vào cuối ngày."</div>
          </div>
        </div>
      </div>

    </div>
  </div>
</div>

<script>
function openLifeLabModal(tab) {
  var modal = document.getElementById('lifelab-modal');
  modal.style.display = 'flex';
  if (tab) switchLifeLabTab(tab);
}

function closeLifeLabModal() {
  document.getElementById('lifelab-modal').style.display = 'none';
}

function switchLifeLabTab(tab) {
  var tabs = ['tour', 'chat', 'experiments', 'insights'];
  tabs.forEach(function(t) {
    var el = document.getElementById('tab-' + t);
    var btn = document.getElementById('tab-' + t + '-btn');
    if (el) el.style.display = (t === tab) ? 'block' : 'none';
    if (btn) {
      if (t === tab) btn.classList.add('active');
      else btn.classList.remove('active');
    }
  });
}

function askPreset(text) {
  var input = document.getElementById('chat-input');
  input.value = text;
  sendChatMessage();
}

function sendChatMessage() {
  var input = document.getElementById('chat-input');
  var text = input.value.trim();
  if (!text) return;

  var container = document.getElementById('chat-messages');
  
  // User message
  var uDiv = document.createElement('div');
  uDiv.style.cssText = 'background:#1e293b;border:1px solid #334155;border-radius:12px;padding:10px 16px;align-self:flex-end;max-width:85%;color:#f8fafc;font-size:14px;';
  uDiv.textContent = text;
  container.appendChild(uDiv);
  input.value = '';

  // AI Response
  setTimeout(function() {
    var aiDiv = document.createElement('div');
    aiDiv.style.cssText = 'background:#161b22;border:1px solid #30363d;border-radius:12px;padding:12px 16px;align-self:flex-start;max-width:85%;';
    
    var responseText = '';
    if (text.indexOf('tiền') !== -1 || text.indexOf('hạnh phúc') !== -1) {
      responseText = 'Life Lab phản chiếu rằng: Cảm giác trống rỗng xuất hiện khi các mục tiêu tài chính của bạn không gắn liền với giá trị cá nhân. Gợi ý Current Focus: Hãy xác định 1 điều bạn thực sự muốn làm nếu không có áp lực tiền bạc.';
    } else if (text.indexOf('kỳ vọng') !== -1 || text.indexOf('gia đình') !== -1) {
      responseText = 'Phản chiếu của Life Lab: Sự hy sinh vì kỳ vọng người khác chỉ bền vững khi bạn không đánh mất chính mình. Gợi ý Thử nghiệm 7 ngày: Đặt ra 1 ranh giới nhỏ trong công việc hoặc gia đình tuần này.';
    } else {
      responseText = 'AI đã ghi nhận phản hồi. Tiến trình Life Lab khuyến nghị: Bắt đầu từ 1 thử nghiệm nhỏ 7 ngày (Life Experiment) để đo lường cảm xúc trước khi đưa ra quyết định lớn.';
    }

    aiDiv.innerHTML = '<div style="font-size:11px;font-weight:bold;color:#e11d48;margin-bottom:4px;">LIFE LAB AI · PHẢN CHIẾU</div><div style="font-size:14px;color:#f1f5f9;line-height:1.5;">' + responseText + '</div>';
    container.appendChild(aiDiv);
    container.scrollTop = container.scrollHeight;
  }, 400);
}

function updateExpProgress() {
  var checks = document.querySelectorAll('#tab-experiments input[type="checkbox"]:checked');
  var count = checks.length;
  var pct = Math.round((count / 7) * 100);
  var badge = document.getElementById('exp-progress-badge');
  if (badge) badge.textContent = 'Tiến độ: ' + count + '/7 ngày (' + pct + '%)';
}

function saveInsight() {
  var val = document.getElementById('insight-input').value.trim();
  if (!val) return;
  var list = document.getElementById('insights-list');
  var item = document.createElement('div');
  item.className = 'uf-card';
  item.style.cssText = 'margin:0;padding:14px;border-color:#10b981;';
  item.innerHTML = '<div style="font-size:12px;color:#10b981;font-weight:bold;">Insight Mới · Vừa ghi nhận</div><div style="font-size:14px;color:#f1f5f9;margin-top:4px;">"' + val + '"</div>';
  list.prepend(item);
  document.getElementById('insight-input').value = '';
  alert('✓ Đã lưu bài học thành công vào Living Life Map của bạn!');
}
</script>
`;

html = html.replace('</body>', unionFamHubHtml + '</body>');

fs.writeFileSync('/home/jay/office-graffico-clone/index.html', html, 'utf-8');
console.log('Successfully injected UnionFam Life Lab Interactive Hub & 3D Guided Tour into index.html');
