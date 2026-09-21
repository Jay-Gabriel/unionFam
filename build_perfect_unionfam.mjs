import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('=== INTEGRATING OFFICIAL UNIONFAM BLUEPRINT 7.0 CONSULTING ENGINE ===');

const CHUNKS_DIR = path.join(__dirname, '_next/static/chunks');

// 1. Restore pristine chunks
fs.copyFileSync(`${CHUNKS_DIR}/0ro772wcmsc4w.js.orig`, `${CHUNKS_DIR}/0ro772wcmsc4w.js`);
fs.copyFileSync(`${CHUNKS_DIR}/00mo9wt7jabwh.js.orig`, `${CHUNKS_DIR}/00mo9wt7jabwh.js`);
fs.copyFileSync(`${CHUNKS_DIR}/3jh1u-s3k0bkk.js.orig`, `${CHUNKS_DIR}/3jh1u-s3k0bkk.js`);
fs.copyFileSync(`${CHUNKS_DIR}/turbopack-39g5269p98htr.js.orig`, `${CHUNKS_DIR}/turbopack-39g5269p98htr.js`);
fs.copyFileSync(`${CHUNKS_DIR}/3qk2c_a6-pvxm.js.orig`, `${CHUNKS_DIR}/3qk2c_a6-pvxm.js`);

// 2. Customize 2nb77gdn5hy4t.js with official UnionFam Life Lab Blueprint V7.0
let c2n = fs.readFileSync(`${CHUNKS_DIR}/2nb77gdn5hy4t.js.orig`, 'utf8');
c2n = c2n.replace(/Graffico Office/g, 'UnionFam Life Lab');
c2n = c2n.replace(/Graffico desk radio/g, 'UnionFam Life Lab Radio');
c2n = c2n.replace(/Graffico/g, 'UnionFam');

// Official Blueprint 7.0 Consulting Component
const officialUnionFamDeskComponent = `
function UnionFamInteractiveDesk({ onClose }) {
  const [messages, setMessages] = R.useState([
    {
      sender: 'ai',
      text: 'Chào bạn! Tôi là Life Lab AI — người bạn đồng hành phản chiếu cuộc đời (Blueprint 7.0). Hãy tưởng tượng bạn đang sống một cuộc đời do chính mình lựa chọn: Trong một ngày bình thường, bạn muốn dành thời gian và năng lượng của mình cho những điều gì?'
    }
  ]);
  const [inputVal, setInputVal] = R.useState('');
  const [activeConstellation, setActiveConstellation] = R.useState('03. CURRENT FOCUS');
  const [currentExp, setCurrentExp] = R.useState({
    title: '30 Phút Tự Quyết Mỗi Tối (No Distraction)',
    desc: 'Mỗi buổi tối dành 30 phút không điện thoại, ghi lại 3 quyết định bạn tự đưa ra trong ngày mà không bị chi phối bởi ý kiến bên ngoài.',
    days: [true, true, true, false, false, false, false],
    energy: 8.5,
    insight: '"Tiền bạc là phương tiện phục vụ cuộc đời, không phải mục tiêu tự thân."',
    gap: 'Kỳ vọng ngoài: Bận rộn liên tục ➔ Nhu cầu trong: Bình an, có thời gian cho bản thân.'
  });
  const chatScrollRef = R.useRef(null);

  R.useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (customText) => {
    const text = (customText || inputVal).trim();
    if (!text) return;

    const lower = text.toLowerCase();
    const newMsgs = [...messages, { sender: 'user', text }];
    setMessages(newMsgs);
    if (!customText) setInputVal('');

    setTimeout(() => {
      let aiReply = '';
      let newExpData = null;

      // 1. CHÀO HỎI / MỞ ĐẦU
      if (/^(chào|chao|hi|hello|alo|hey|ơi|oi|bạn là ai|giúp gì)/i.test(lower) && !lower.includes('tiền') && !lower.includes('việc') && !lower.includes('áp lực')) {
        aiReply = 'Chào bạn! Rất vui được đồng hành cùng bạn tại UnionFam Life Lab. Tôi ở đây để giúp bạn lắng nghe chính mình và chuyển hóa một định hướng thành nhịp sống cụ thể. Bạn có thể bắt đầu bằng câu hỏi: Trong một ngày lý tưởng, điều gì bạn muốn dành nhiều năng lượng nhất?';
      }
      // 2. TÀI CHÍNH & TỰ DO (Q2 / Blueprint: Tiền bạc vs Mục đích sống)
      else if (lower.includes('tiền') || lower.includes('tài chính') || lower.includes('thu nhập') || lower.includes('giàu') || lower.includes('hạnh phúc')) {
        aiReply = 'Life Lab phản chiếu (Chòm sao 04. What Matters): Có vẻ điều bạn thực sự tìm kiếm không phải là con số tiền bạc, mà là sự tự do và cảm giác bình an khi không còn nỗi sợ thiếu thốn. Nếu áp lực tài chính được gỡ bỏ, bạn muốn dành thời gian đó cho điều gì?';
        setActiveConstellation('04. WHAT MATTERS');
        newExpData = {
          title: '7 Ngày Tách Tiền Khỏi Giá Trị Bản Thân',
          desc: 'Mỗi ngày ghi nhận 1 niềm vui thuần túy không tốn tiền và viết 1 quyết định chi tiêu phục vụ sự bình an dài hạn.',
          days: [true, false, false, false, false, false, false],
          energy: 7.5,
          insight: '"Tài chính lành mạnh là khi bạn kiếm tiền để sống tự do, chứ không sống để làm nô lệ của đồng tiền."',
          gap: 'Khoảng cách: Kỳ vọng kiếm tiền nhanh ➔ Mong muốn: Bình an và tự chủ thời gian.'
        };
      }
      // 3. KỲ VỌNG GIA ĐÌNH & XÃ HỘI (Blueprint: Escape vs Desire)
      else if (lower.includes('kỳ vọng') || lower.includes('gia đình') || lower.includes('bố mẹ') || lower.includes('áp lực') || lower.includes('trách nhiệm')) {
        aiReply = 'Life Lab phản chiếu (Chòm sao 06. My Trade-offs): Tôi tự hỏi có phải bạn đang gánh vác kỳ vọng của người khác quá lâu và quên mất ranh giới cho chính mình? Sự hy sinh chỉ bền vững khi bạn không đánh mất bản thể trọn vẹn. Bạn sẵn sàng thử buông điều gì nhỏ trong tuần này?';
        setActiveConstellation('06. MY TRADE-OFFS');
        newExpData = {
          title: '7 Ngày Thiết Lập Ranh Giới Lành Mạnh',
          desc: 'Nói "Tôi cần suy nghĩ thêm" trước các đề nghị ngoài giờ hoặc việc không phục vụ mục tiêu trọng tâm.',
          days: [true, true, false, false, false, false, false],
          energy: 8.0,
          insight: '"Bảo vệ ranh giới cá nhân là bước đầu tiên để trở thành phiên bản do chính mình lựa chọn."',
          gap: 'Khoảng cách: Sợ làm người khác thất vọng ➔ Mong muốn: Được sống thật với giá trị riêng.'
        };
      }
      // 4. KIỆT SỨC & QUẢN TRỊ NĂNG LƯỢNG (Q6 / Blueprint: 30p Tự Quyết)
      else if (lower.includes('mệt') || lower.includes('kiệt sức') || lower.includes('bận') || lower.includes('năng lượng') || lower.includes('tự quyết') || lower.includes('thời gian')) {
        aiReply = 'Life Lab phản chiếu (Chòm sao 03. Current Focus): Dường như bạn đang bị cuốn trôi trong việc bận liên tục mà thiếu các khoảng dừng (Point of Pause). Gợi ý bước nhỏ: Hãy thử nghiệm dành 30 phút tự quyết mỗi tối không màn hình để hồi phục năng lượng nhé.';
        setActiveConstellation('03. CURRENT FOCUS');
        newExpData = {
          title: '30 Phút Tự Quyết Mỗi Tối (No Distraction)',
          desc: 'Mỗi buổi tối dành 30 phút không điện thoại, ghi lại 3 quyết định bạn tự đưa ra trong ngày mà không bị chi phối bởi ý kiến bên ngoài.',
          days: [true, true, true, false, false, false, false],
          energy: 8.5,
          insight: '"Dành 30 phút tự quyết mỗi ngày giúp phục hồi 50% cảm giác kiệt sức vào cuối tuần."',
          gap: 'Khoảng cách: Bận rộn việc người khác ➔ Trọng tâm: 30 phút hồi sinh năng lượng tự thân.'
        };
      }
      // 5. ĐỊNH HƯỚNG & NGHỀ NGHIỆP (Q3 / Q4 / Blueprint: Understand -> Choose -> Become)
      else if (lower.includes('định hướng') || lower.includes('nghề') || lower.includes('công việc') || lower.includes('tương lai') || lower.includes('mục tiêu')) {
        aiReply = 'Life Lab phản chiếu (Chòm sao 01. Desired Difference): Định hướng cuộc đời không bắt đầu từ việc chạy theo thị trường, mà bắt đầu từ nhịp điệu một ngày bạn muốn sống (Mô hình 4 ngày/tuần, Remote hay Kinh doanh tự do). Bạn hình dung nhịp làm việc lý tưởng của mình ra sao?';
        setActiveConstellation('01. DESIRED DIFFERENCE');
        newExpData = {
          title: '7 Ngày Quan Sát Bản Thân & Điểm Tựa Nghề Nghiệp',
          desc: 'Ghi lại 1 khoảnh khắc trong ngày bạn làm việc hiệu quả và cảm thấy có ý nghĩa sâu sắc nhất.',
          days: [true, false, false, false, false, false, false],
          energy: 8.0,
          insight: '"Nghề nghiệp lý tưởng là giao điểm giữa điều bạn làm giỏi, điều bạn yêu thích và điều cuộc đời cần."',
          gap: 'Khoảng cách: Làm vì quán tính ➔ Mong muốn: Thiết kế công việc phục vụ phong cách sống.'
        };
      }
      // 6. TÂM SỰ MỞ KHÁC
      else {
        aiReply = 'Life Lab đang lắng nghe bạn. Có vẻ bạn đang ấp ủ một điều muốn thay đổi. Hãy chia sẻ thêm: Để tiến gần hơn tới nhịp sống mong muốn đó, điều gì đang là rào cản lớn nhất với bạn lúc này?';
      }

      setMessages(prev => [...prev, { sender: 'ai', text: aiReply }]);
      if (newExpData) setCurrentExp(newExpData);
    }, 380);
  };

  const toggleDay = (idx) => {
    setCurrentExp(prev => {
      const newDays = [...prev.days];
      newDays[idx] = !newDays[idx];
      return { ...prev, days: newDays };
    });
  };

  const checkedCount = currentExp.days.filter(Boolean).length;
  const progressPct = Math.round((checkedCount / 7) * 100);

  return (0, S.jsx)("div", {
    style: {
      position: 'fixed',
      top: '5%',
      left: '50%',
      transform: 'translateX(-50%)',
      width: '92%',
      maxWidth: '1280px',
      height: '75vh',
      maxHeight: '680px',
      zIndex: 9999,
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '16px',
      pointerEvents: 'auto',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    },
    children: [
      /* LEFT SCREEN: AI COMPANION TERMINAL (BLUEPRINT 7.0) */
      (0, S.jsxs)("div", {
        style: {
          background: 'rgba(10, 15, 29, 0.95)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(225, 29, 72, 0.55)',
          borderRadius: '16px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.85)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          color: '#f8fafc'
        },
        children: [
          /* Header */
          (0, S.jsxs)("div", {
            style: { padding: '10px 16px', background: 'rgba(30, 41, 59, 0.85)', borderBottom: '1px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
            children: [
              (0, S.jsxs)("div", {
                style: { display: 'flex', alignItems: 'center', gap: '8px' },
                children: [
                  (0, S.jsx)("span", { style: { width: '8px', height: '8px', borderRadius: '50%', background: '#e11d48', display: 'inline-block', boxShadow: '0 0 8px #e11d48' } }),
                  (0, S.jsx)("span", { style: { fontWeight: '800', fontSize: '11.5px', letterSpacing: '0.8px', color: '#fff' }, children: 'UNIONFAM · BLUEPRINT 7.0 AI COMPANION' })
                ]
              }),
              (0, S.jsx)("span", { style: { fontSize: '10px', background: 'rgba(225,29,72,0.2)', color: '#f43f5e', border: '1px solid rgba(225,29,72,0.4)', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' }, children: 'ADAPTIVE REFLECTION' })
            ]
          }),

          /* Quick Consultation Questions (UnionFam 10-Question Catalog) */
          (0, S.jsxs)("div", {
            style: { padding: '8px 12px', background: '#0f172a', borderBottom: '1px solid #1e293b', display: 'flex', gap: '5px', flexWrap: 'wrap' },
            children: [
              (0, S.jsx)("button", {
                onClick: () => handleSend('Tôi muốn một ngày bình thường được dành năng lượng cho điều mình thực sự yêu thích.'),
                style: { background: '#1e293b', border: '1px solid #334155', color: '#e2e8f0', padding: '4px 8px', borderRadius: '6px', fontSize: '10.5px', cursor: 'pointer', fontWeight: '600' },
                children: '🌅 Q1: Một ngày lý tưởng'
              }),
              (0, S.jsx)("button", {
                onClick: () => handleSend('Tôi đang kiếm được tiền tốt nhưng muốn tiền phục vụ sự tự do thay vì áp lực.'),
                style: { background: '#1e293b', border: '1px solid #334155', color: '#e2e8f0', padding: '4px 8px', borderRadius: '6px', fontSize: '10.5px', cursor: 'pointer', fontWeight: '600' },
                children: '💰 Q2: Tiền bạc & Tự do'
              }),
              (0, S.jsx)("button", {
                onClick: () => handleSend('Làm sao để biết tôi đang chọn nghề vì mình hay vì kỳ vọng của gia đình?'),
                style: { background: '#1e293b', border: '1px solid #334155', color: '#e2e8f0', padding: '4px 8px', borderRadius: '6px', fontSize: '10.5px', cursor: 'pointer', fontWeight: '600' },
                children: '👨‍👩‍👧 Q5: Kỳ vọng gia đình'
              }),
              (0, S.jsx)("button", {
                onClick: () => handleSend('Tôi muốn bắt đầu 1 thử nghiệm 7 ngày nhỏ và an toàn.'),
                style: { background: '#1e293b', border: '1px solid #334155', color: '#e2e8f0', padding: '4px 8px', borderRadius: '6px', fontSize: '10.5px', cursor: 'pointer', fontWeight: '600' },
                children: '🧪 Q10: Thử nghiệm 7 ngày'
              })
            ]
          }),

          /* Chat History Area */
          (0, S.jsx)("div", {
            ref: chatScrollRef,
            style: { flex: 1, overflowY: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' },
            children: messages.map((m, i) => (
              (0, S.jsxs)("div", {
                key: i,
                style: {
                  background: m.sender === 'user' ? '#1e293b' : 'rgba(15, 23, 42, 0.92)',
                  border: m.sender === 'user' ? '1px solid #334155' : '1px solid rgba(225, 29, 72, 0.4)',
                  borderRadius: '10px',
                  padding: '9px 12px',
                  maxWidth: '88%',
                  alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start'
                },
                children: [
                  (0, S.jsx)("div", {
                    style: { fontSize: '9.5px', fontWeight: 'bold', color: m.sender === 'user' ? '#38bdf8' : '#e11d48', marginBottom: '3px' },
                    children: m.sender === 'user' ? 'BẠN' : 'LIFE LAB AI · PHẢN CHIẾU V7.0'
                  }),
                  (0, S.jsx)("div", { style: { fontSize: '12px', color: '#f1f5f9', lineHeight: '1.45' }, children: m.text })
                ]
              })
            ))
          }),

          /* Input Form */
          (0, S.jsxs)("div", {
            style: { padding: '10px 14px', background: '#0f172a', borderTop: '1px solid #1e293b', display: 'flex', gap: '8px' },
            children: [
              (0, S.jsx)("input", {
                value: inputVal,
                onChange: e => setInputVal(e.target.value),
                onKeyDown: e => { if (e.key === 'Enter') handleSend(); },
                placeholder: "Chia sẻ tâm sự, mong muốn hoặc câu hỏi của bạn...",
                style: { flex: 1, background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '8px 12px', color: '#fff', fontSize: '12px', outline: 'none' }
              }),
              (0, S.jsx)("button", {
                onClick: () => handleSend(),
                style: { background: '#e11d48', color: '#fff', border: 'none', padding: '0 16px', borderRadius: '8px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' },
                children: 'Gửi ➔'
              })
            ]
          })
        ]
      }),

      /* RIGHT SCREEN: LIVING LIFE MAP REALTIME DASHBOARD (8 CONSTELLATIONS) */
      (0, S.jsxs)("div", {
        style: {
          background: 'rgba(10, 15, 29, 0.95)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(16, 185, 129, 0.55)',
          borderRadius: '16px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.85)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          color: '#f8fafc'
        },
        children: [
          /* Header */
          (0, S.jsxs)("div", {
            style: { padding: '10px 16px', background: 'rgba(30, 41, 59, 0.85)', borderBottom: '1px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
            children: [
              (0, S.jsxs)("div", {
                style: { display: 'flex', alignItems: 'center', gap: '8px' },
                children: [
                  (0, S.jsx)("span", { style: { width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 8px #10b981' } }),
                  (0, S.jsx)("span", { style: { fontWeight: '800', fontSize: '11.5px', letterSpacing: '0.8px', color: '#fff' }, children: 'LIVING LIFE MAP · 8 CHÒM SAO ĐỒNG BỘ' })
                ]
              }),
              (0, S.jsx)("span", { style: { fontSize: '10px', background: 'rgba(16,185,129,0.2)', color: '#10b981', border: '1px solid rgba(16,185,129,0.4)', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' }, children: activeConstellation })
            ]
          }),

          /* Dashboard Content Body */
          (0, S.jsxs)("div", {
            style: { flex: 1, overflowY: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' },
            children: [
              /* Experiment Card */
              (0, S.jsxs)("div", {
                style: { background: '#0f172a', border: '1px solid rgba(16, 185, 129, 0.4)', borderRadius: '12px', padding: '12px' },
                children: [
                  (0, S.jsxs)("div", {
                    style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' },
                    children: [
                      (0, S.jsx)("span", { style: { fontSize: '9.5px', fontWeight: '800', color: '#10b981', letterSpacing: '0.8px' }, children: 'THỬ NGHIỆM 7 NGÀY (LIFE EXPERIMENTS)' }),
                      (0, S.jsx)("span", { style: { background: '#10b981', color: '#fff', fontSize: '9.5px', fontWeight: 'bold', padding: '2px 6px', borderRadius: '4px' }, children: 'Tiến độ: ' + checkedCount + '/7 (' + progressPct + '%)' })
                    ]
                  }),
                  (0, S.jsx)("h4", { style: { margin: '2px 0 6px 0', fontSize: '13px', color: '#ffffff' }, children: currentExp.title }),
                  (0, S.jsx)("p", { style: { margin: '0 0 10px 0', fontSize: '11px', color: '#94a3b8', lineHeight: '1.4' }, children: currentExp.desc }),

                  /* 7 Checkboxes */
                  (0, S.jsx)("div", {
                    style: { display: 'flex', gap: '4px', marginBottom: '8px' },
                    children: currentExp.days.map((checked, idx) => (
                      (0, S.jsxs)("button", {
                        key: idx,
                        onClick: () => toggleDay(idx),
                        style: {
                          flex: 1,
                          background: checked ? '#10b981' : '#1e293b',
                          color: checked ? '#ffffff' : '#94a3b8',
                          border: checked ? '1px solid #10b981' : '1px solid #334155',
                          borderRadius: '6px',
                          padding: '6px 2px',
                          fontSize: '10px',
                          fontWeight: '700',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        },
                        children: [checked ? '✓ ' : '', 'Ngày ' + (idx + 1)]
                      })
                    ))
                  }),

                  /* Energy Slider (Q6) */
                  (0, S.jsxs)("div", {
                    style: { background: '#1e293b', padding: '6px 10px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
                    children: [
                      (0, S.jsx)("span", { style: { fontSize: '11px', color: '#94a3b8' }, children: 'Năng lượng tự chủ (Q6):' }),
                      (0, S.jsx)("input", {
                        type: "range",
                        min: "1",
                        max: "10",
                        step: "0.5",
                        value: currentExp.energy,
                        onChange: e => setCurrentExp(p => ({ ...p, energy: Number(e.target.value) })),
                        style: { accentColor: '#10b981', cursor: 'pointer', width: '110px' }
                      }),
                      (0, S.jsx)("span", { style: { fontWeight: 'bold', color: '#10b981', fontSize: '11.5px' }, children: currentExp.energy + ' / 10' })
                    ]
                  })
                ]
              }),

              /* Insights & The Gap Grid (8 Constellations) */
              (0, S.jsxs)("div", {
                style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' },
                children: [
                  (0, S.jsxs)("div", {
                    style: { background: '#0f172a', border: '1px solid #334155', borderRadius: '10px', padding: '10px' },
                    children: [
                      (0, S.jsx)("div", { style: { fontSize: '10px', fontWeight: 'bold', color: '#f59e0b', marginBottom: '2px' }, children: '💡 ĐÚC KẾT BÀI HỌC (INSIGHTS)' }),
                      (0, S.jsx)("div", { style: { fontSize: '11px', color: '#cbd5e1', lineHeight: '1.4' }, children: currentExp.insight })
                    ]
                  }),
                  (0, S.jsxs)("div", {
                    style: { background: '#0f172a', border: '1px solid #334155', borderRadius: '10px', padding: '10px' },
                    children: [
                      (0, S.jsx)("div", { style: { fontSize: '10px', fontWeight: 'bold', color: '#38bdf8', marginBottom: '2px' }, children: '🎯 KHOẢNG CÁCH (02. THE GAP)' }),
                      (0, S.jsx)("div", { style: { fontSize: '11px', color: '#cbd5e1', lineHeight: '1.4' }, children: currentExp.gap })
                    ]
                  })
                ]
              })
            ]
          })
        ]
      })
    ]
  });
}
`;

// Insert the component before rZ and wire it up inside rZ
c2n = c2n.replace(
  'function rZ({mode:e,walkTest:t,touch:r,sceneReady:n,walkLocked:a,hasEntered:i,inspecting:o,relocking:s,inspectViews:l,inspectId:c,radio:h,pulled:u,onEnter:d,onInspectExit:f,onInspectNav:p,onPullPlug:m}){',
  officialUnionFamDeskComponent + '\nfunction rZ({mode:e,walkTest:t,touch:r,sceneReady:n,walkLocked:a,hasEntered:i,inspecting:o,relocking:s,inspectViews:l,inspectId:c,radio:h,pulled:u,onEnter:d,onInspectExit:f,onInspectNav:p,onPullPlug:m}){'
);

// Inject into rZ's JSX return
c2n = c2n.replace(
  'g&&o&&"radio"===c&&(0,S.jsx)(rU,{player:h,touch:r}),',
  'g&&o&&"radio"===c&&(0,S.jsx)(rU,{player:h,touch:r}),g&&o&&"andrea"===c&&(0,S.jsx)(UnionFamInteractiveDesk,{onClose:f}),'
);

fs.writeFileSync(`${CHUNKS_DIR}/2nb77gdn5hy4t.js`, c2n, 'utf8');
console.log('✓ Successfully injected UnionFam Blueprint 7.0 into 2nb77gdn5hy4t.js!');

// 3. Customize 08wq3b45gsv3v.js (Hotspots)
let c08 = fs.readFileSync(`${CHUNKS_DIR}/08wq3b45gsv3v.js.orig`, 'utf8');
c08 = c08.replace(/label:"Radio"/g, 'label:"📻 Đài Radio"');
c08 = c08.replace(/label:"Dev desk"/g, 'label:"🧪 Thử Nghiệm"');
c08 = c08.replace(/label:"Andrea'\''s desk"/g, 'label:"🤖 Bàn AI"');
c08 = c08.replace(/label:"Notice board"/g, 'label:"💡 Kệ Bài Học"');
c08 = c08.replace(/label:"Plan board"/g, 'label:"🗺️ Bảng Dự Án"');
fs.writeFileSync(`${CHUNKS_DIR}/08wq3b45gsv3v.js`, c08, 'utf8');
console.log('✓ Updated 08wq3b45gsv3v.js hotspot labels.');

// 4. Generate clean index.html
const origHtmlPath = path.join(__dirname, 'index.original.html');
const indexHtmlPath = path.join(__dirname, 'index.html');
let origHtml = fs.readFileSync(origHtmlPath, 'utf8');
let html = origHtml.replace(/<script>\(function\(\)\{function c\(\).*?<\/script><\/body>/s, '</body>');
html = html.replace(/<title>.*?<\/title>/, '<title>UnionFam Life Lab | 3D Studio &amp; Life Design</title>');
fs.writeFileSync(indexHtmlPath, html, 'utf8');
console.log('✓ Generated clean index.html.');

// 5. Ensure api/radio_stations.json exists for Vercel serverless / static serving
const apiDir = path.join(__dirname, 'api');
if (!fs.existsSync(apiDir)) {
  fs.mkdirSync(apiDir, { recursive: true });
}
const radioStationsData = {
  presets: [
    {
      channel: 1,
      stationUuid: "unionfam-focus-1",
      name: "Life Lab Focus - Deep Thinking",
      genre: "Electronic / Deep Ambient",
      homepage: "https://unionfam.vn/",
      fallbackStreamUrl: "https://nr9.newradio.it/proxy/ebaruffa?mp=/stream",
      embeddingPermission: "granted",
      streamUrl: "https://nr9.newradio.it/proxy/ebaruffa?mp=/stream",
      source: "unionfam-radio"
    },
    {
      channel: 2,
      stationUuid: "unionfam-reflection-2",
      name: "Mindful Reflection - Calm Lo-Fi",
      genre: "Lo-Fi / Soul Reflection",
      homepage: "https://unionfam.vn/",
      fallbackStreamUrl: "https://funkyradio.streamingmedia.it/play.mp3",
      embeddingPermission: "granted",
      streamUrl: "https://funkyradio.streamingmedia.it/play.mp3",
      source: "unionfam-radio"
    },
    {
      channel: 3,
      stationUuid: "unionfam-ambient-3",
      name: "Quiet Ambient - Life Design",
      genre: "Classic Soul & Ambient",
      homepage: "https://unionfam.vn/",
      fallbackStreamUrl: "https://rblive.it:8040/radio.mp3",
      embeddingPermission: "granted",
      streamUrl: "https://rblive.it:8040/radio.mp3",
      source: "unionfam-radio"
    },
    {
      channel: 4,
      stationUuid: "unionfam-jazz-4",
      name: "Easy Jazz Soul - Evening Pause",
      genre: "Smooth Jazz & Chillout",
      homepage: "https://unionfam.vn/",
      fallbackStreamUrl: "https://sphera.fluidstream.eu/easy_jazz.mp3",
      embeddingPermission: "granted",
      streamUrl: "https://sphera.fluidstream.eu/easy_jazz.mp3",
      source: "unionfam-radio"
    },
    {
      channel: 5,
      stationUuid: "unionfam-clarity-5",
      name: "Classical Clarity - Decision Making",
      genre: "Italian Acoustic & Pop",
      homepage: "https://unionfam.vn/",
      fallbackStreamUrl: "https://stream.lolliradio.net/lolli_italia.mp3",
      embeddingPermission: "granted",
      streamUrl: "https://stream.lolliradio.net/lolli_italia.mp3",
      source: "unionfam-radio"
    }
  ],
  resolvedAt: new Date().toISOString()
};
fs.writeFileSync(path.join(apiDir, 'radio_stations.json'), JSON.stringify(radioStationsData, null, 2), 'utf8');
console.log('✓ Ensured api/radio_stations.json is up to date.');

console.log('=== BUILD COMPLETED SUCCESSFULLY! ===');
