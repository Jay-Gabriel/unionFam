import fs from 'fs';

const filePath = '/home/jay/office-graffico-clone/_next/static/chunks/2nb77gdn5hy4t.js';
let content = fs.readFileSync(filePath, 'utf8');

const newRfCode = `function rf({ready:e}){
  let{progress:t}=rh(),
     [forcedReady,setForcedReady]=(0,R.useState)(!1),
     [hidden,setHidden]=(0,R.useState)(!1);

  (0,R.useEffect)(()=>{
    let timer=window.setTimeout(()=>setForcedReady(!0),800);
    return ()=>window.clearTimeout(timer);
  },[]);

  let isReady=Boolean(e||forcedReady);
  let r=(0,rd.useSmoothProgress)(isReady?100:Math.max(40,Math.min(t||50,97)));
  let isDone=isReady&&(r>=85||forcedReady);

  (0,R.useEffect)(()=>{
    if(!isDone)return;
    let timer=window.setTimeout(()=>setHidden(!0),300);
    return ()=>window.clearTimeout(timer);
  },[isDone]);

  if(hidden)return null;

  return (0,S.jsxs)("div",{
    className:["absolute inset-0 z-20 flex flex-col items-center justify-center gap-6 px-6 text-center bg-seppia-black transition-opacity duration-[400ms] ease-out",isDone?"pointer-events-none opacity-0":"opacity-100"].join(" "),
    children:[
      (0,S.jsx)("p",{className:"font-shrikhand text-3xl leading-tight text-almond-cream md:text-4xl",children:"UnionFam Life Lab"}),
      (0,S.jsx)(ru.GfProgress,{value:Math.max(r,isReady?100:40),label:"loading the office"})
    ]
  });
}`;

let sIdx = content.indexOf('function rf({ready:e}){');
let eIdx = content.indexOf('var rp=R;', sIdx);
if (sIdx !== -1 && eIdx !== -1) {
  content = content.substring(0, sIdx) + newRfCode + '\n' + content.substring(eIdx);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Successfully patched rf loading screen in 2nb77gdn5hy4t.js!');
} else {
  console.error('Could not locate function rf in 2nb77gdn5hy4t.js', sIdx, eIdx);
}
