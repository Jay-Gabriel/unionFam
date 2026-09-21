import fs from 'fs';
import path from 'path';

const BASE_URL = 'https://office.graffico.it';
const OUT_DIR = '/home/jay/office-graffico-clone';

const ah = ["STA_arch_shell","STA_arch_details","STA_ws_andrea","STA_ws_lorenzo","STA_storage","STA_lounge","INT_boards_static","STA_shelf_contents"];
const au = ["STA_ext_city","STA_ext_green","STA_ext_ground","STA_ext_sky"];

const dirs = ["", "2048/", "1024/", "512/"];

const allPaths = [];

for (const d of dirs) {
  for (const name of ah) {
    allPaths.push(`/models/baked/${d}BK_${name}.webp`);
  }
  for (const name of au) {
    const clean = name.replace("STA_", "");
    allPaths.push(`/models/baked/${d}BK_${clean}.webp`);
    allPaths.push(`/models/baked/${d}BK_${name}.webp`);
  }
}

async function main() {
  console.log(`Checking and downloading ${allPaths.length} baked textures...`);
  for (const rel of allPaths) {
    const localPath = path.join(OUT_DIR, rel.startsWith('/') ? rel.slice(1) : rel);
    if (fs.existsSync(localPath)) {
      console.log(`Already exists: ${rel}`);
      continue;
    }
    const fullUrl = BASE_URL + rel;
    try {
      const res = await fetch(fullUrl);
      if (res.ok) {
        fs.mkdirSync(path.dirname(localPath), { recursive: true });
        const buf = Buffer.from(await res.arrayBuffer());
        fs.writeFileSync(localPath, buf);
        console.log(`Downloaded [200]: ${rel} (${buf.length} bytes)`);
      } else {
        console.log(`[${res.status}] Not found: ${rel}`);
      }
    } catch (e) {
      console.error(`Error ${fullUrl}:`, e.message);
    }
  }
  console.log('Finished downloading baked textures.');
}

main();
