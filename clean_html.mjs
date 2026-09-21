import fs from 'fs';
import path from 'path';

const indexPath = '/home/jay/office-graffico-clone/index.html';
let html = fs.readFileSync(indexPath, 'utf-8');

// Remove Cloudflare challenge script
html = html.replace(/<script>\(function\(\)\{function c\(\).*?<\/script><\/body>/s, '</body>');

fs.writeFileSync(indexPath, html);
console.log('Cleaned Cloudflare script from index.html');
