import fs from 'fs';

// 1. Update 19o6hwlycba-z.js
let chunk19 = fs.readFileSync('/home/jay/office-graffico-clone/_next/static/chunks/19o6hwlycba-z.js', 'utf-8');

const oldHtml = `<h1>Graffico<span>.</span></h1>
      <p>We build websites that feel illegal.</p>
      <canvas id="stage"></canvas>
      <button id="magic">Do the magic</button>`;

const newHtml = `<h1>UnionFam<span>.</span></h1>
      <p>Hiểu điều mình muốn • Sống cuộc đời tự chủ</p>
      <canvas id="stage"></canvas>
      <button id="magic">Khám phá Life Lab</button>`;

chunk19 = chunk19.replace(oldHtml, newHtml);
chunk19 = chunk19.replace(/graffico-site/g, 'unionfam-lifelab');
chunk19 = chunk19.replace(/graffico-devstation-files/g, 'unionfam-devstation-files');
chunk19 = chunk19.replace(/#c22f21/g, '#e11d48');
chunk19 = chunk19.replace(/⚡ localhost:3000/g, '⚡ UnionFam Life Lab');

fs.writeFileSync('/home/jay/office-graffico-clone/_next/static/chunks/19o6hwlycba-z.js', chunk19, 'utf-8');
console.log('Updated 19o6hwlycba-z.js');

// 2. Update 2nb77gdn5hy4t.js
let chunk2n = fs.readFileSync('/home/jay/office-graffico-clone/_next/static/chunks/2nb77gdn5hy4t.js', 'utf-8');
chunk2n = chunk2n.replace(/Graffico Office/g, 'UnionFam Life Lab');
chunk2n = chunk2n.replace(/Graffico desk radio/g, 'UnionFam Life Lab Radio');
chunk2n = chunk2n.replace(/Do NOT unplug these\. Seriously\. We mean it\./g, 'Nut Reset: Dung lai va lam moi hanh trinh Life Design.');

fs.writeFileSync('/home/jay/office-graffico-clone/_next/static/chunks/2nb77gdn5hy4t.js', chunk2n, 'utf-8');
console.log('Updated 2nb77gdn5hy4t.js');
