import fs from 'fs';

console.log('=== APPLYING COMPACT 3D GUIDE TOUR & HUD ===');

// ==========================================
// 1. UPDATE 08wq3b45gsv3v.js (Three.js 3D Pins & Hotspots)
// ==========================================
let c08 = fs.readFileSync('/home/jay/office-graffico-clone/_next/static/chunks/08wq3b45gsv3v.js', 'utf8');

// Update hotspot definitions (em)
const newEmCode = `let em=[
  {id:"andrea",num:1,short:"1. Bàn AI",label:"🤖 Trạm 1: Bàn AI Đối Thoại",icon:eo,anchor:[-2.5,1.5,.8],triggerRadius:1.8,camPos:[-2.51,1.18,1.07],camTarget:[-2.51,1.16,.29],views:[{camPos:[-2.51,1.18,1.07],camTarget:[-2.51,1.16,.29]},{camPos:[-2.81,1.18,.85],camTarget:[-2.81,1.17,.33]},{camPos:[-2.21,1.17,.77],camTarget:[-2.21,1.16,.25]}],touchFirstView:1},
  {id:"dev",num:2,short:"2. Thử Nghiệm",label:"🧪 Trạm 2: Thử Nghiệm 7 Ngày",icon:ea.CodeXml,anchor:[-3.3,1.5,-.5],triggerRadius:1.8,camPos:[-3.49,1.17,-.78],camTarget:[-3.49,1.15,0],views:[{camPos:[-3.49,1.17,-.78],camTarget:[-3.49,1.15,0]},{camPos:[-3.19,1.17,-.5],camTarget:[-3.19,1.16,.02]},{camPos:[-3.79,1.17,-.46],camTarget:[-3.79,1.16,.06]}],touchFirstView:1},
  {id:"plan",num:3,short:"3. Bảng Dự Án",label:"🗺️ Trạm 3: Bảng Dự Án Life Map",icon:eu,anchor:[5.3,1.6,-1.85],triggerRadius:2,camPos:[4.72,2,-2.49],camTarget:[5.48,2,-2.49],views:[{camPos:[4.72,2,-2.49],camTarget:[5.48,2,-2.49]},{camPos:[5.48,2,-1.85],camTarget:[5.48,2,-2.49]},{camPos:[4.72,2,-1.21],camTarget:[5.48,2,-2.49]}]},
  {id:"radio",num:4,short:"4. Radio",label:"📻 Trạm 4: Đài Radio Tâm Trí",icon:es.Radio,anchor:[-4.03,1.08,-1.6],triggerRadius:1.9,camPos:[-3.83,.93,-2.2],camTarget:[-4.07,.79,-1.69]},
  {id:"socket",num:5,short:"5. Phích Cắm",label:"🔌 Trạm 5: Nút Phích Cắm An Toàn",icon:es.Radio,anchor:[-5.25,.5,.0],triggerRadius:1.8,camPos:[-5.02,.42,0],camTarget:[-5.47,.32,0]},
  {id:"bacheca",num:6,short:"6. Kệ Bài Học",label:"💡 Trạm 6: Kệ Bài Học & Thành Tựu",icon:ed.Trophy,anchor:[-.58,1.6,-3.55],triggerRadius:2.2,camPos:[-1.35,2.05,-3.16],camTarget:[-1.35,2.05,-3.71],viewCols:3,views:[{camPos:[-1.35,2.05,-3.16],camTarget:[-1.35,2.05,-3.71]},{camPos:[-.65,2.02,-3.16],camTarget:[-.65,2.02,-3.71]},{camPos:[.1,2.05,-3.16],camTarget:[.1,2.05,-3.71]},{camPos:[-1.22,1.5,-3.16],camTarget:[-1.22,1.5,-3.71]},{camPos:[-.52,1.48,-3.16],camTarget:[-.52,1.48,-3.71]},{camPos:[.18,1.5,-3.16],camTarget:[.18,1.5,-3.71]}]}
];`;

let emStart = c08.indexOf("let em=[");
if (emStart !== -1) {
  let emEnd = c08.indexOf("function ek(", emStart);
  c08 = c08.substring(0, emStart) + newEmCode + "\n" + c08.substring(emEnd);
}

// Update function eT
const newETCode = `function eT({hotspot:e,phaseRef:o,lockedRef:l,onEnter:i}){
  let c=(0,n.useThree)(e=>e.camera),
      [s,u]=(0,a.useState)(!1),
      [showPins,setShowPins]=(0,a.useState)(!0),
      d=(0,a.useRef)(!1),
      m=(0,a.useRef)(i);

  (0,a.useEffect)(()=>{
    m.current=i;
    let t=e=>{
      if("KeyH"===e.code||"KeyT"===e.code){
        setShowPins(prev=>!prev);
      }
    };
    let onToggle=(ev)=>{
      if(ev && typeof ev.detail?.show === "boolean") setShowPins(ev.detail.show);
      else setShowPins(prev=>!prev);
    };
    window.addEventListener("keydown",t);
    window.addEventListener("toggleTourPins",onToggle);
    window.__togglePins=(val)=>{
      if(typeof val === "boolean") setShowPins(val);
      else setShowPins(prev=>!prev);
    };
    return ()=>{
      window.removeEventListener("keydown",t);
      window.removeEventListener("toggleTourPins",onToggle);
    };
  },[i]);

  (0,r.useFrame)(()=>{
    c.getWorldDirection(eR.fwd);
    let t="walk"===o.current&&l.current?ek(e,c.position,eR.fwd,eR.anchor):-1,
        r=t>=0;
    if(r){
      for(let n of(eR.projMat.multiplyMatrices(c.projectionMatrix,c.matrixWorldInverse),eR.frustum.setFromProjectionMatrix(eR.projMat),em)){
        if(n===e)continue;
        let o=ek(n,c.position,eR.fwd,eR.anchor2);
        if(o>=0&&o<t&&eR.frustum.containsPoint(eR.anchor2)){r=!1;break}
      }
    }
    r!==d.current&&(d.current=r,u(r)),
    r?eP.promptStore.get()?.id!==e.id&&eP.promptStore.set({id:e.id,label:e.label,icon:e.icon,open:()=>m.current(e)}):eP.promptStore.clear(e.id);
  });

  (0,a.useEffect)(()=>{
    if(!s)return;
    let t=t=>{"KeyE"===t.code&&i(e)},
        r=()=>{
          c.getWorldDirection(eR.fwd);
          eR.anchor.set(...e.anchor).sub(c.position).normalize();
          eR.fwd.dot(eR.anchor)>.966&&i(e);
        };
    return window.addEventListener("keydown",t),
           ex.TOUCH.active||window.addEventListener("pointerdown",r),
           ()=>{
             window.removeEventListener("keydown",t),
             window.removeEventListener("pointerdown",r),
             eP.promptStore.clear(e.id);
           };
  },[s,e,i,c]);

  if("walk"!==o.current) return null;

  if(s){
    return (0,t.jsx)(ew.Html,{position:e.anchor,center:!0,zIndexRange:[5,5],children:(0,t.jsx)(eE.GfPrompt,{icon:e.icon,label:e.label,showKey:!ex.TOUCH.active})});
  }

  if(showPins){
    let stationNum = e.num || (em.indexOf(e)+1);
    let shortName = e.short || e.label.split(":")[0];
    return (0,t.jsx)(ew.Html,{
      position:[e.anchor[0], e.anchor[1]+0.15, e.anchor[2]],
      center:!0,
      distanceFactor:14,
      zIndexRange:[5,5],
      children:(0,t.jsxs)("div",{
        style:{
          display:"flex",
          alignItems:"center",
          gap:"4px",
          background:"rgba(15,23,42,0.85)",
          backdropFilter:"blur(6px)",
          border:"1px solid rgba(225,29,72,0.6)",
          borderRadius:"16px",
          padding:"2px 6px 2px 3px",
          boxShadow:"0 2px 8px rgba(0,0,0,0.5), 0 0 6px rgba(225,29,72,0.25)",
          pointerEvents:"none",
          userSelect:"none",
          fontFamily:"-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        },
        children:[
          (0,t.jsx)("span",{
            style:{
              width:"15px",
              height:"15px",
              borderRadius:"50%",
              background:"#e11d48",
              color:"#ffffff",
              fontSize:"9px",
              fontWeight:"800",
              display:"flex",
              alignItems:"center",
              justifyContent:"center"
            },
            children:stationNum
          }),
          (0,t.jsx)("span",{
            style:{
              fontSize:"9px",
              fontWeight:"700",
              color:"#f8fafc",
              whiteSpace:"nowrap",
              letterSpacing:"0.2px"
            },
            children:shortName
          })
        ]
      })
    });
  }

  return null;
}`;

let eTStart = c08.indexOf("function eT(");
if (eTStart !== -1) {
  let eTEnd = c08.indexOf("function eS(", eTStart);
  c08 = c08.substring(0, eTStart) + newETCode + "\n" + c08.substring(eTEnd);
  fs.writeFileSync('/home/jay/office-graffico-clone/_next/static/chunks/08wq3b45gsv3v.js', c08, 'utf8');
  console.log('✓ 08wq3b45gsv3v.js updated successfully!');
}

// ==========================================
// 2. UPDATE 2nb77gdn5hy4t.js (React Tour & HUD)
// ==========================================
let c2n = fs.readFileSync('/home/jay/office-graffico-clone/_next/static/chunks/2nb77gdn5hy4t.js', 'utf8');

const newTourReactComponent = `function UnionFamReactTour({inspecting:o,inspectId:c}){
  let[stationIdx,setStationIdx]=(0,R.useState)(0),
     [showTour,setShowTour]=(0,R.useState)(!0),
     [modalTab,setModalTab]=(0,R.useState)(null),
     [chatMsgs,setChatMsgs]=(0,R.useState)([{from:"ai",text:"Chào bạn! Tôi là Trợ Lý Đồng Hành Life Lab. Bạn đang băn khoăn điều gì nhất trong cuộc sống lúc này?"}]),
     [chatInput,setChatInput]=(0,R.useState)(""),
     [expDays,setExpDays]=(0,R.useState)([true,true,true,false,false,false,false]),
     [energyLevel,setEnergyLevel]=(0,R.useState)(8),
     [insights,setInsights]=(0,R.useState)(["Tiền bạc là phương tiện phục vụ cuộc đời, không phải mục tiêu tự thân.","Dành 30 phút tự quyết giúp giảm 50% cảm giác kiệt sức vào cuối ngày."]),
     [insightText,setInsightText]=(0,R.useState)("");

  let stations=[
    {num:1,name:"🤖 Trạm 1: Bàn AI Đối Thoại",tab:"chat",pos:[-2.51,1.18,1.07],target:[-2.51,1.16,0.29]},
    {num:2,name:"🧪 Trạm 2: Thử Nghiệm 7 Ngày",tab:"experiments",pos:[-3.49,1.17,-0.78],target:[-3.49,1.15,0]},
    {num:3,name:"🗺️ Trạm 3: Bảng Dự Án Life Map",tab:"board",pos:[4.72,2,-2.49],target:[5.48,2,-2.49]},
    {num:4,name:"📻 Trạm 4: Đài Radio Tâm Trí",tab:"tour",pos:[-3.83,0.93,-2.2],target:[-4.07,0.79,-1.69]},
    {num:5,name:"🔌 Trạm 5: Nút Phích Cắm An Toàn",tab:"tour",pos:[-5.02,0.42,0],target:[-5.47,0.32,0]},
    {num:6,name:"💡 Trạm 6: Kệ Triết Lý & Sổ Bài Học",tab:"insights",pos:[-1.35,2.05,-3.16],target:[-1.35,2.05,-3.71]}
  ];

  let toggleTour=(val)=>{
    setShowTour(prev=>{
      let next = typeof val === "boolean" ? val : !prev;
      window.dispatchEvent(new CustomEvent("toggleTourPins",{detail:{show:next}}));
      if(window.__togglePins) window.__togglePins(next);
      return next;
    });
  };

  (0,R.useEffect)(()=>{
    let t=e=>{
      if("KeyH"===e.code||"KeyT"===e.code){
        toggleTour();
      }
    };
    window.addEventListener("keydown",t);
    return ()=>window.removeEventListener("keydown",t);
  },[]);

  let cur=stations[stationIdx];
  let teleport=e=>{
    let t=stations[e];
    if(window.__walk&&window.__walk.teleport){
      window.__walk.teleport(t.pos[0],t.pos[2]);
      if(window.__walk.lookAt)window.__walk.lookAt(t.target[0],t.target[1],t.target[2]);
    }
  };

  let sendChat=e=>{
    let t=e||chatInput;
    if(!t)return;
    let n=[...chatMsgs,{from:"user",text:t}];
    setChatMsgs(n),setChatInput("");
    setTimeout(()=>{
      let e="";
      if(t.indexOf("tiền")!==-1||t.indexOf("hạnh phúc")!==-1){
        e="Life Lab phản chiếu: Cảm giác trống rỗng xuất hiện khi mục tiêu tài chính không gắn với giá trị cá nhân. Gợi ý: Tìm 1 điều bạn làm chỉ vì niềm vui.";
      }else if(t.indexOf("kỳ vọng")!==-1||t.indexOf("gia đình")!==-1){
        e="Life Lab phản chiếu: Sự hy sinh vì kỳ vọng người khác chỉ bền vững khi bạn không đánh mất chính mình.";
      }else if(t.indexOf("The Gap")!==-1||t.indexOf("khoảng cách")!==-1){
        e="Phân tích The Gap: Thu hẹp khoảng cách bằng 1 hành động vi mô 15 phút mỗi ngày.";
      }else{
        e="AI đã ghi nhận. Hãy bắt đầu từ 1 thử nghiệm nhỏ 7 ngày (Life Experiment) để đo lường cảm xúc.";
      }
      setChatMsgs([...n,{from:"ai",text:e}]);
    },400);
  };

  let countDone=expDays.filter(Boolean).length;
  let pctDone=Math.round((countDone/7)*100);

  return (0,S.jsxs)(S.Fragment,{children:[
    // Top Sleek Header Bar
    (0,S.jsxs)("div",{
      style:{position:"absolute",top:12,left:12,right:12,zIndex:30,display:"flex",justifyContent:"space-between",alignItems:"center",pointerEvents:"none",fontFamily:"-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"},
      children:[
        (0,S.jsxs)("div",{
          style:{background:"rgba(15,23,42,0.92)",backdropFilter:"blur(12px)",border:"1px solid rgba(225,29,72,0.4)",borderRadius:18,padding:"4px 10px",display:"flex",alignItems:"center",gap:8,pointerEvents:"auto",boxShadow:"0 6px 20px rgba(0,0,0,0.5)"},
          children:[
            (0,S.jsx)("div",{style:{width:8,height:8,borderRadius:"50%",background:"#e11d48",boxShadow:"0 0 6px #e11d48"}}),
            (0,S.jsx)("span",{style:{fontWeight:900,fontSize:11,letterSpacing:0.8,color:"#f8fafc"},children:"UNIONFAM · LIFE LAB 3D"}),
            (0,S.jsx)("button",{
              onClick:()=>toggleTour(),
              title:"Bật/Tắt hướng dẫn 3D (Phím tắt: H)",
              style:{background:showTour?"#e11d48":"rgba(30,41,59,0.9)",color:"#fff",border:"1px solid "+(showTour?"#e11d48":"#475569"),padding:"3px 8px",borderRadius:6,fontSize:10,fontWeight:"700",cursor:"pointer",display:"flex",alignItems:"center",gap:4},
              children:showTour?"🗺️ Tour (Phím H: Ẩn)":"🗺️ Tour (Phím H: Hiện)"
            })
          ]
        }),
        (0,S.jsxs)("div",{
          style:{background:"rgba(15,23,42,0.92)",backdropFilter:"blur(12px)",border:"1px solid rgba(51,65,85,0.7)",borderRadius:18,padding:"3px 6px",display:"flex",alignItems:"center",gap:4,pointerEvents:"auto",boxShadow:"0 6px 20px rgba(0,0,0,0.5)"},
          children:[
            (0,S.jsx)("button",{onClick:()=>setModalTab("chat"),style:{background:"rgba(30,41,59,0.8)",border:"1px solid #334155",color:"#e2e8f0",padding:"4px 8px",borderRadius:6,fontSize:11,fontWeight:"600",cursor:"pointer"},children:"🤖 Hỏi AI"}),
            (0,S.jsx)("button",{onClick:()=>setModalTab("experiments"),style:{background:"rgba(30,41,59,0.8)",border:"1px solid #334155",color:"#e2e8f0",padding:"4px 8px",borderRadius:6,fontSize:11,fontWeight:"600",cursor:"pointer"},children:"🧪 Thử Nghiệm"}),
            (0,S.jsx)("button",{onClick:()=>setModalTab("insights"),style:{background:"rgba(30,41,59,0.8)",border:"1px solid #334155",color:"#e2e8f0",padding:"4px 8px",borderRadius:6,fontSize:11,fontWeight:"600",cursor:"pointer"},children:"💡 Sổ Bài Học"}),
            (0,S.jsx)("button",{onClick:()=>setModalTab("board"),style:{background:"rgba(30,41,59,0.8)",border:"1px solid #334155",color:"#e2e8f0",padding:"4px 8px",borderRadius:6,fontSize:11,fontWeight:"600",cursor:"pointer"},children:"📋 Bảng Dự Án"})
          ]
        })
      ]
    }),

    // Bottom Guide Tour Bar (Compact, Sleek, Small)
    showTour&&!o&&(0,S.jsx)("div",{
      style:{position:"absolute",bottom:14,left:"50%",transform:"translateX(-50%)",zIndex:30,pointerEvents:"auto",fontFamily:"-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"},
      children:(0,S.jsxs)("div",{
        style:{background:"rgba(15,23,42,0.94)",backdropFilter:"blur(16px)",border:"1px solid rgba(225,29,72,0.45)",borderRadius:24,padding:"4px 10px",display:"flex",alignItems:"center",gap:8,boxShadow:"0 10px 30px rgba(0,0,0,0.7)",color:"#fff"},
        children:[
          (0,S.jsxs)("div",{
            style:{display:"flex",alignItems:"center",gap:5},
            children:[
              (0,S.jsx)("span",{style:{background:"#e11d48",color:"#fff",padding:"1px 6px",borderRadius:8,fontSize:10,fontWeight:800},children:(stationIdx+1)+"/6"}),
              (0,S.jsx)("span",{style:{fontSize:11,fontWeight:700,whiteSpace:"nowrap"},children:cur.name})
            ]
          }),
          (0,S.jsx)("div",{style:{width:1,height:14,background:"#334155"}}),
          (0,S.jsxs)("div",{
            style:{display:"flex",alignItems:"center",gap:4},
            children:[
              (0,S.jsx)("button",{
                onClick:()=>{let e=(stationIdx-1+stations.length)%stations.length;setStationIdx(e),teleport(e)},
                title:"Trạm trước",
                style:{background:"#1e293b",border:"1px solid #334155",color:"#cbd5e1",padding:"3px 6px",borderRadius:5,fontSize:11,fontWeight:"bold",cursor:"pointer"},
                children:"⬅"
              }),
              (0,S.jsx)("button",{
                onClick:()=>{let e=(stationIdx+1)%stations.length;setStationIdx(e),teleport(e)},
                title:"Trạm tiếp theo",
                style:{background:"#e11d48",border:0,color:"#fff",padding:"3px 8px",borderRadius:5,fontSize:11,fontWeight:"bold",cursor:"pointer"},
                children:"Tiếp ➔"
              }),
              (0,S.jsx)("button",{
                onClick:()=>teleport(stationIdx),
                title:"Di chuyển nhân vật đến trạm này",
                style:{background:"#1e293b",border:"1px solid #334155",color:"#38bdf8",padding:"3px 6px",borderRadius:5,fontSize:11,fontWeight:"bold",cursor:"pointer",whiteSpace:"nowrap"},
                children:"🎯 Đến"
              }),
              (0,S.jsx)("button",{
                onClick:()=>setModalTab(cur.tab),
                title:"Mở nội dung chi tiết",
                style:{background:"#10b981",border:0,color:"#fff",padding:"3px 8px",borderRadius:5,fontSize:11,fontWeight:"bold",cursor:"pointer",whiteSpace:"nowrap"},
                children:"🚀 Mở"
              })
            ]
          }),
          (0,S.jsx)("div",{
            style:{display:"flex",gap:3,alignItems:"center",padding:"0 2px"},
            children:stations.map((e,t)=>(0,S.jsx)("span",{
              key:t,
              title:"Đến trạm "+(t+1),
              onClick:()=>{setStationIdx(t),teleport(t)},
              style:{width:5,height:5,borderRadius:"50%",background:t===stationIdx?"#e11d48":"#475569",cursor:"pointer",transform:t===stationIdx?"scale(1.3)":"scale(1)"}
            }))
          }),
          (0,S.jsx)("button",{
            onClick:()=>toggleTour(!1),
            title:"Ẩn thanh hướng dẫn (Phím tắt: H)",
            style:{background:"#334155",border:0,color:"#94a3b8",width:18,height:18,borderRadius:"50%",fontSize:10,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"},
            children:"✕"
          })
        ]
      })
    }),

    // If Tour is hidden, show sleek floating reopen button at bottom-right
    !showTour&&!o&&(0,S.jsx)("div",{
      style:{position:"absolute",bottom:14,right:14,zIndex:30,pointerEvents:"auto",fontFamily:"-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"},
      children:(0,S.jsx)("button",{
        onClick:()=>toggleTour(!0),
        title:"Bật lại hướng dẫn 3D (Phím tắt: H)",
        style:{background:"rgba(15,23,42,0.9)",backdropFilter:"blur(8px)",border:"1px solid rgba(225,29,72,0.5)",color:"#f8fafc",padding:"5px 10px",borderRadius:14,fontSize:11,fontWeight:"700",cursor:"pointer",boxShadow:"0 4px 12px rgba(0,0,0,0.5)",display:"flex",alignItems:"center",gap:6},
        children:"🗺️ Hiện Guide Tour (H)"
      })
    }),

    // Interactive Modal
    modalTab&&(0,S.jsx)("div",{
      style:{position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",backdropFilter:"blur(10px)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"},
      children:(0,S.jsxs)("div",{
        style:{background:"#0f172a",border:"1px solid #334155",borderRadius:20,width:"90%",maxWidth:800,height:"85vh",display:"flex",flexDirection:"column",boxShadow:"0 25px 60px rgba(0,0,0,0.9)",color:"#f8fafc",overflow:"hidden"},
        children:[
          (0,S.jsxs)("div",{
            style:{padding:"14px 20px",background:"#1e293b",borderBottom:"1px solid #334155",display:"flex",alignItems:"center",justifyContent:"space-between"},
            children:[
              (0,S.jsxs)("div",{
                style:{display:"flex",alignItems:"center",gap:10},
                children:[
                  (0,S.jsx)("div",{style:{background:"#e11d48",color:"#fff",padding:"3px 8px",borderRadius:6,fontSize:10,fontWeight:"bold"},children:"UNIONFAM · LIFE LAB"}),
                  (0,S.jsx)("h3",{style:{margin:0,fontSize:16,fontWeight:800},children:"Trung Tâm Thiết Kế Cuộc Đời & Đồng Hành AI"})
                ]
              }),
              (0,S.jsx)("button",{
                onClick:()=>setModalTab(null),
                style:{background:"#334155",border:0,color:"#cbd5e1",width:28,height:28,borderRadius:"50%",fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"},
                children:"✕"
              })
            ]
          }),
          (0,S.jsxs)("div",{
            style:{padding:"8px 16px",background:"#141d2e",borderBottom:"1px solid #1e293b",display:"flex",gap:8},
            children:[
              (0,S.jsx)("button",{onClick:()=>setModalTab("chat"),style:{padding:"6px 12px",borderRadius:8,fontSize:12,fontWeight:700,border:0,cursor:"pointer",background:"chat"===modalTab?"#e11d48":"transparent",color:"chat"===modalTab?"#fff":"#94a3b8"},children:"🤖 Hỏi AI"}),
              (0,S.jsx)("button",{onClick:()=>setModalTab("experiments"),style:{padding:"6px 12px",borderRadius:8,fontSize:12,fontWeight:700,border:0,cursor:"pointer",background:"experiments"===modalTab?"#e11d48":"transparent",color:"experiments"===modalTab?"#fff":"#94a3b8"},children:"🧪 Thử Nghiệm 7 Ngày"}),
              (0,S.jsx)("button",{onClick:()=>setModalTab("insights"),style:{padding:"6px 12px",borderRadius:8,fontSize:12,fontWeight:700,border:0,cursor:"pointer",background:"insights"===modalTab?"#e11d48":"transparent",color:"insights"===modalTab?"#fff":"#94a3b8"},children:"💡 Sổ Bài Học"}),
              (0,S.jsx)("button",{onClick:()=>setModalTab("board"),style:{padding:"6px 12px",borderRadius:8,fontSize:12,fontWeight:700,border:0,cursor:"pointer",background:"board"===modalTab?"#e11d48":"transparent",color:"board"===modalTab?"#fff":"#94a3b8"},children:"📋 6 Bảng Dự Án"})
            ]
          }),
          (0,S.jsx)("div",{
            style:{flex:1,overflowY:"auto",padding:"20px"},
            children:"chat"===modalTab?(0,S.jsxs)("div",{
              children:[
                (0,S.jsxs)("div",{
                  style:{background:"#161b22",border:"1px solid #30363d",borderRadius:12,padding:12,marginBottom:12},
                  children:[
                    (0,S.jsx)("div",{style:{color:"#58a6ff",fontWeight:"bold",fontSize:13,marginBottom:2},children:"🤖 TRỢ LÝ ĐỒNG HÀNH LIFE LAB (KỊCH BẢN V2 / V7)"}),
                    (0,S.jsx)("p",{style:{margin:0,fontSize:12,color:"#8b949e"},children:"Đặt câu hỏi hoặc chọn tình huống băn khoăn để AI phản chiếu hiện trạng cuộc sống của bạn."})
                  ]
                }),
                (0,S.jsxs)("div",{
                  style:{display:"flex",flexWrap:"wrap",gap:6,marginBottom:12},
                  children:[
                    (0,S.jsx)("button",{onClick:()=>sendChat("Tôi đang kiếm được tiền tốt nhưng không thấy đây là cuộc sống mình muốn."),style:{background:"#1e293b",border:"1px solid #334155",color:"#e2e8f0",padding:"5px 10px",borderRadius:6,fontSize:11,cursor:"pointer"},children:"💰 Kiếm tiền nhưng chưa hạnh phúc"}),
                    (0,S.jsx)("button",{onClick:()=>sendChat("Làm sao để biết tôi đang chọn nghề vì mình hay vì kỳ vọng của gia đình?"),style:{background:"#1e293b",border:"1px solid #334155",color:"#e2e8f0",padding:"5px 10px",borderRadius:6,fontSize:11,cursor:"pointer"},children:"👨‍👩‍👧 Kỳ vọng gia đình vs Mong muốn"}),
                    (0,S.jsx)("button",{onClick:()=>sendChat("Tôi muốn bắt đầu 1 thử nghiệm 7 ngày để tìm lại năng lượng."),style:{background:"#1e293b",border:"1px solid #334155",color:"#e2e8f0",padding:"5px 10px",borderRadius:6,fontSize:11,cursor:"pointer"},children:"🧪 Gợi ý thử nghiệm 7 ngày"})
                  ]
                }),
                (0,S.jsx)("div",{
                  style:{background:"#090d16",border:"1px solid #1e293b",borderRadius:12,padding:14,height:220,overflowY:"auto",marginBottom:12,display:"flex",flexDirection:"column",gap:10},
                  children:chatMsgs.map((e,t)=>(0,S.jsxs)("div",{
                    key:t,
                    style:{background:"ai"===e.from?"#161b22":"#1e293b",border:"1px solid "+("ai"===e.from?"#30363d":"#334155"),borderRadius:10,padding:"10px 14px",alignSelf:"ai"===e.from?"flex-start":"flex-end",maxWidth:"85%"},
                    children:[
                      (0,S.jsx)("div",{style:{fontSize:10,fontWeight:"bold",color:"ai"===e.from?"#e11d48":"#38bdf8",marginBottom:2},children:"ai"===e.from?"LIFE LAB AI":"BẠN"}),
                      (0,S.jsx)("div",{style:{fontSize:13,lineHeight:1.4,color:"#f1f5f9"},children:e.text})
                    ]
                  }))
                }),
                (0,S.jsxs)("div",{
                  style:{display:"flex",gap:8},
                  children:[
                    (0,S.jsx)("input",{
                      value:chatInput,
                      onChange:e=>setChatInput(e.target.value),
                      onKeyDown:e=>{"Enter"===e.key&&sendChat()},
                      placeholder:"Nhập câu hỏi hoặc băn khoăn của bạn...",
                      style:{flex:1,background:"#0f172a",border:"1px solid #334155",borderRadius:8,padding:"8px 12px",color:"#f8fafc",fontSize:13,outline:"none"}
                    }),
                    (0,S.jsx)("button",{
                      onClick:()=>sendChat(),
                      style:{background:"#e11d48",color:"#fff",border:0,padding:"0 16px",borderRadius:8,fontWeight:"bold",cursor:"pointer",fontSize:13},
                      children:"Gửi ➔"
                    })
                  ]
                })
              ]
            }):"experiments"===modalTab?(0,S.jsxs)("div",{
              children:[
                (0,S.jsxs)("div",{
                  style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14},
                  children:[
                    (0,S.jsx)("h4",{style:{margin:0,fontSize:16,color:"#f8fafc"},children:"🧪 Thử Nghiệm Cuộc Sống 7 Ngày (Life Experiment)"}),
                    (0,S.jsx)("span",{style:{background:"#10b981",color:"#fff",padding:"3px 8px",borderRadius:6,fontSize:11,fontWeight:"bold"},children:"Tiến độ: "+countDone+"/7 ngày ("+pctDone+"%)"})
                  ]
                }),
                (0,S.jsxs)("div",{
                  style:{background:"#1e293b",border:"1px solid #10b981",borderRadius:12,padding:14,marginBottom:14},
                  children:[
                    (0,S.jsx)("div",{style:{fontSize:11,fontWeight:"bold",color:"#10b981",marginBottom:2},children:"THỬ NGHIỆM ĐANG CHẠY: 30 PHÚT TỰ QUYẾT MỖI TỐI"}),
                    (0,S.jsx)("p",{style:{fontSize:12,color:"#cbd5e1",margin:"0 0 10px 0"},children:"Dành 30 phút mỗi tối không điện thoại, ghi lại 3 quyết định bạn tự đưa ra mà không bị chi phối bởi ý kiến bên ngoài."}),
                    (0,S.jsx)("div",{
                      style:{display:"flex",gap:6,marginBottom:12},
                      children:expDays.map((e,t)=>(0,S.jsxs)("label",{
                        key:t,
                        style:{flex:1,background:"#0f172a",border:"1px solid "+(e?"#10b981":"#334155"),padding:6,borderRadius:6,textAlign:"center",cursor:"pointer",fontSize:11,color:e?"#10b981":"#94a3b8",display:"flex",flexDirection:"column",alignItems:"center",gap:2},
                        children:[
                          (0,S.jsx)("input",{type:"checkbox",checked:e,onChange:()=>{let r=[...expDays];r[t]=!r[t],setExpDays(r)}}),
                          "Ngày "+(t+1)
                        ]
                      }))
                    }),
                    (0,S.jsxs)("div",{
                      style:{background:"#0f172a",padding:"8px 12px",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"space-between"},
                      children:[
                        (0,S.jsx)("span",{style:{fontSize:12,color:"#94a3b8"},children:"Mức năng lượng & Tự chủ:"}),
                        (0,S.jsx)("input",{type:"range",min:1,max:10,value:energyLevel,onChange:e=>setEnergyLevel(Number(e.target.value)),style:{accentColor:"#10b981",cursor:"pointer",width:140}}),
                        (0,S.jsx)("span",{style:{fontWeight:"bold",color:"#10b981",fontSize:13},children:energyLevel+" / 10"})
                      ]
                    })
                  ]
                })
              ]
            }):"insights"===modalTab?(0,S.jsxs)("div",{
              children:[
                (0,S.jsx)("h4",{style:{margin:"0 0 12px 0",fontSize:16,color:"#f8fafc"},children:"💡 Sổ Đúc Kết Bài Học (Insight Journal)"}),
                (0,S.jsxs)("div",{
                  style:{background:"#1e293b",border:"1px solid #334155",borderRadius:12,padding:14,marginBottom:14},
                  children:[
                    (0,S.jsx)("div",{style:{fontSize:12,fontWeight:"bold",color:"#f59e0b",marginBottom:6},children:"GHI NHẬN BÀI HỌC MỚI:"}),
                    (0,S.jsx)("textarea",{
                      value:insightText,
                      onChange:e=>setInsightText(e.target.value),
                      placeholder:"Ghi lại bài học bạn rút ra sau ngày thử nghiệm...",
                      rows:3,
                      style:{width:"100%",background:"#0f172a",border:"1px solid #334155",borderRadius:8,padding:"8px 12px",color:"#f8fafc",fontSize:12,outline:"none",boxSizing:"border-box"}
                    }),
                    (0,S.jsx)("div",{
                      style:{display:"flex",justifyContent:"flex-end",marginTop:8},
                      children:(0,S.jsx)("button",{
                        onClick:()=>{
                          if(!insightText.trim())return;
                          setInsights([insightText.trim(),...insights]),setInsightText("");
                        },
                        style:{background:"#10b981",color:"#fff",border:0,padding:"6px 14px",borderRadius:6,fontWeight:"bold",cursor:"pointer",fontSize:12},
                        children:"✓ Lưu Vào Living Life Map"
                      })
                    })
                  ]
                }),
                (0,S.jsx)("div",{
                  style:{display:"flex",flexDirection:"column",gap:8},
                  children:insights.map((e,t)=>(0,S.jsxs)("div",{
                    key:t,
                    style:{background:"#1e293b",border:"1px solid #334155",borderRadius:10,padding:12},
                    children:[
                      (0,S.jsx)("div",{style:{fontSize:11,color:"#38bdf8",fontWeight:"bold"},children:"Bài học #"+(t+1)}),
                      (0,S.jsx)("div",{style:{fontSize:13,color:"#f1f5f9",marginTop:4},children:'"'+e+'"'})
                    ]
                  }))
                })
              ]
            }):(0,S.jsxs)("div",{
              children:[
                (0,S.jsx)("h4",{style:{margin:"0 0 12px 0",fontSize:16,color:"#f8fafc"},children:"📋 6 Bảng Treo Tường (Living Life Map Wall)"}),
                (0,S.jsxs)("div",{
                  style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10},
                  children:[
                    (0,S.jsxs)("div",{style:{background:"#1e293b",border:"1px solid #334155",borderRadius:10,padding:12},children:[(0,S.jsx)("div",{style:{color:"#f43f5e",fontWeight:"bold",fontSize:12},children:"1. Triết Lý Tiền & Cuộc Sống"}),(0,S.jsx)("p",{style:{fontSize:11,color:"#cbd5e1",margin:"4px 0 0 0"},children:"Tiền là phương tiện, không phải mục tiêu tối hậu. Xác định mối quan hệ lành mạnh với tài chính."})]}),
                    (0,S.jsxs)("div",{style:{background:"#1e293b",border:"1px solid #334155",borderRadius:10,padding:12},children:[(0,S.jsx)("div",{style:{color:"#38bdf8",fontWeight:"bold",fontSize:12},children:"2. Tiến Trình 3 Bước"}),(0,S.jsx)("p",{style:{fontSize:11,color:"#cbd5e1",margin:"4px 0 0 0"},children:"Understand (Hiểu mình) → Choose (Lựa chọn dũng cảm) → Become (Trở thành bản thể trọn vẹn)."})]}),
                    (0,S.jsxs)("div",{style:{background:"#1e293b",border:"1px solid #334155",borderRadius:10,padding:12},children:[(0,S.jsx)("div",{style:{color:"#f59e0b",fontWeight:"bold",fontSize:12},children:"3. Snapshot Hiện Trạng"}),(0,S.jsx)("p",{style:{fontSize:11,color:"#cbd5e1",margin:"4px 0 0 0"},children:"Bức tranh toàn cảnh về Năng lượng, Ý nghĩa, Tài chính và Sự tự do hiện tại."})]}),
                    (0,S.jsxs)("div",{style:{background:"#1e293b",border:"1px solid #334155",borderRadius:10,padding:12},children:[(0,S.jsx)("div",{style:{color:"#10b981",fontWeight:"bold",fontSize:12},children:"4. The Gap & Focus"}),(0,S.jsx)("p",{style:{fontSize:11,color:"#cbd5e1",margin:"4px 0 0 0"},children:"Khoảng cách giữa hiện thực và mong muốn, cùng trọng tâm hành động vi mô duy nhất."})]}),
                    (0,S.jsxs)("div",{style:{background:"#1e293b",border:"1px solid #334155",borderRadius:10,padding:12},children:[(0,S.jsx)("div",{style:{color:"#a855f7",fontWeight:"bold",fontSize:12},children:"5. Thử Nghiệm Cuộc Sống"}),(0,S.jsx)("p",{style:{fontSize:11,color:"#cbd5e1",margin:"4px 0 0 0"},children:"Hành động vi mô 7 ngày để thử nghiệm trước khi cam kết thay đổi lớn."})]}),
                    (0,S.jsxs)("div",{style:{background:"#1e293b",border:"1px solid #334155",borderRadius:10,padding:12},children:[(0,S.jsx)("div",{style:{color:"#ec4899",fontWeight:"bold",fontSize:12},children:"6. Memory Center"}),(0,S.jsx)("p",{style:{fontSize:11,color:"#cbd5e1",margin:"4px 0 0 0"},children:"Lưu giữ toàn bộ tiến trình, bài học và sự trưởng thành theo thời gian."})]}),
                  ]
                })
              ]
            })
          })
        ]
      })
    })
  ]});
}`;

let tourStart = c2n.indexOf("function UnionFamReactTour(");
if (tourStart !== -1) {
  let tourEnd = c2n.indexOf("function rZ(", tourStart);
  c2n = c2n.substring(0, tourStart) + newTourReactComponent + "\n\n" + c2n.substring(tourEnd);
  fs.writeFileSync('/home/jay/office-graffico-clone/_next/static/chunks/2nb77gdn5hy4t.js', c2n, 'utf8');
  console.log('✓ 2nb77gdn5hy4t.js updated successfully!');
}

console.log('=== ALL GUIDE TOUR COMPACT UPDATES COMPLETED ===');
