import fs from 'fs';
import path from 'path';

const BASE_URL = 'https://office.graffico.it';
const OUT_DIR = '/home/jay/office-graffico-clone';

function getFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFiles(file));
    } else {
      results.push(file);
    }
  });
  return results;
}

const files = getFiles(OUT_DIR).filter(f => f.endsWith('.js') || f.endsWith('.html') || f.endsWith('.css'));

const assetPaths = new Set();
const pathRegex = /["'](\/(?:models|photos|videos|audio|sounds|textures|fonts|logos|assets|public|data|static)\/[^"']+)["']/g;
const exrRegex = /["']([^"']+\.(?:exr|hdr|glb|gltf|bin|wasm|woff2|woff|ttf|mp3|ogg|wav|webm|mp4|webp|png|jpg|svg))["']/g;

for (const f of files) {
  const content = fs.readFileSync(f, 'utf-8');
  let m;
  while ((m = pathRegex.exec(content)) !== null) {
    assetPaths.add(m[1]);
  }
  while ((m = exrRegex.exec(content)) !== null) {
    if (m[1].startsWith('/')) assetPaths.add(m[1]);
  }
}

console.log('Discovered paths:', [...assetPaths]);

async function downloadAll() {
  for (const rel of assetPaths) {
    const cleanRel = rel.split('?')[0];
    const localPath = path.join(OUT_DIR, cleanRel.startsWith('/') ? cleanRel.slice(1) : cleanRel);
    if (fs.existsSync(localPath)) {
      console.log(`Already exists: ${cleanRel}`);
      continue;
    }
    const fullUrl = BASE_URL + cleanRel;
    try {
      console.log(`Downloading: ${fullUrl}`);
      const res = await fetch(fullUrl);
      if (res.ok) {
        fs.mkdirSync(path.dirname(localPath), { recursive: true });
        const buf = Buffer.from(await res.arrayBuffer());
        fs.writeFileSync(localPath, buf);
        console.log(`Saved: ${localPath} (${buf.length} bytes)`);
      } else {
        console.log(`404 / Error: ${fullUrl} -> ${res.status}`);
      }
    } catch (e) {
      console.log(`Fetch error: ${fullUrl} -> ${e.message}`);
    }
  }
}

downloadAll().then(() => console.log('All discovered paths processed.'));
