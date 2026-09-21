import fs from 'fs';

let orig = fs.readFileSync('/home/jay/office-graffico-clone/index.original.html', 'utf8');

// Replace titles and meta
let html = orig.replace(/<title>.*?<\/title>/, '<title>UnionFam Life Lab | 3D Studio &amp; Life Design</title>');
html = html.replace(/Graffico Office \| a 3D studio you can walk through/g, 'UnionFam Life Lab | Không Gian Thiết Kế Cuộc Đời 3D');
html = html.replace(/The Graffico studio in 3D, explored in first person: walk between the desks, tune the radio, write code on a live screen - in the browser, no install\./g, 'Không gian 3D tương tác Life Lab của UnionFam: Đồng hành, phản chiếu và thiết kế cuộc đời tự chủ (Understand → Choose → Become).');
html = html.replace(/Graffico Office/g, 'UnionFam Life Lab');
html = html.replace(/Graffico/g, 'UnionFam');

// Remove original analytics/beacon script before body closing
html = html.replace(/<script>\(function\(\)\{function c\(\).*?<\/script><\/body>/s, '</body>');

fs.writeFileSync('/home/jay/office-graffico-clone/index.html', html, 'utf8');
console.log('Cleaned index.html successfully - React now purely handles all HUD & Tour UI!');
