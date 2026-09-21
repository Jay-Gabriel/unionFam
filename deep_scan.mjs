import fs from 'fs';
import path from 'path';

const BASE_URL = 'https://office.graffico.it';
const OUT_DIR = '/home/jay/office-graffico-clone';

// Find all JS files in OUT_DIR
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

const files = getFiles(OUT_DIR).filter(f => f.endsWith('.js') || f.endsWith('.json') || f.endsWith('.html'));

const urls = new Set();
const mediaUrls = new Set();
const audioStreams = new Set();

const regex = /["'](\/[a-zA-Z0-9_\-\./%]+\.[a-zA-Z0-9]+)["']/g;
const httpRegex = /https?:\/\/[a-zA-Z0-9_\-\./%#\?=&+:@]+/g;

for (const f of files) {
  const content = fs.readFileSync(f, 'utf-8');
  let m;
  while ((m = regex.exec(content)) !== null) {
    const u = m[1];
    if (u.match(/\.(glb|gltf|bin|mp3|ogg|wav|m4a|aac|flac|png|jpg|jpeg|webp|svg|woff2|woff|ttf|eot|hdr|ktx2|wasm|json|mp4|webm|ico|webmanifest|txt|xml)$/i)) {
      mediaUrls.add(u);
    }
  }
  let hm;
  while ((hm = httpRegex.exec(content)) !== null) {
    const hu = hm[0];
    if (hu.includes('radio') || hu.includes('stream') || hu.includes('audio') || hu.includes('icecast') || hu.includes('.mp3') || hu.includes('.m3u8')) {
      audioStreams.add(hu);
    }
  }
}

console.log('--- Media URLs found ---');
console.log([...mediaUrls].sort());

console.log('\n--- Radio / Audio Streams found ---');
console.log([...audioStreams].sort());

async function downloadAll() {
  for (const rel of mediaUrls) {
    const localPath = path.join(OUT_DIR, rel.startsWith('/') ? rel.slice(1) : rel);
    if (fs.existsSync(localPath)) continue;
    const fullUrl = BASE_URL + rel;
    try {
      console.log(`Downloading: ${fullUrl}`);
      const res = await fetch(fullUrl);
      if (res.ok) {
        fs.mkdirSync(path.dirname(localPath), { recursive: true });
        const buf = Buffer.from(await res.arrayBuffer());
        fs.writeFileSync(localPath, buf);
      } else {
        console.log(`404 / Failed: ${fullUrl} (${res.status})`);
      }
    } catch (e) {
      console.log(`Error: ${fullUrl} -> ${e.message}`);
    }
  }
}

downloadAll().then(() => console.log('Done downloading media!'));
