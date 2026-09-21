import fs from 'fs';
import path from 'path';

const BASE_URL = 'https://office.graffico.it';
const OUT_DIR = '/home/jay/office-graffico-clone';

async function fetchText(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return await res.text();
}

async function fetchBuffer(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

async function main() {
  console.log('Fetching index.html...');
  const html = await fetchText(BASE_URL + '/');
  fs.writeFileSync(path.join(OUT_DIR, 'index.html'), html);

  // Extract all script and link tags
  const scriptSrcs = [...html.matchAll(/src="([^"]+)"/g)].map(m => m[1]);
  const linkHrefs = [...html.matchAll(/href="([^"]+)"/g)].map(m => m[1]);

  // Extract Next.js chunk references from self.__next_f
  const nextChunks = [...html.matchAll(/"(\/_next\/static\/[^"]+)"/g)].map(m => m[1]);

  const allUrls = new Set([...scriptSrcs, ...linkHrefs, ...nextChunks]);
  console.log('Initial URLs extracted:', [...allUrls]);

  const downloaded = new Set();
  const queue = [...allUrls];

  const foundAssets = new Set();

  while (queue.length > 0) {
    const relUrl = queue.shift();
    if (downloaded.has(relUrl)) continue;
    downloaded.add(relUrl);

    if (!relUrl.startsWith('/') && !relUrl.startsWith('http')) continue;
    const fullUrl = relUrl.startsWith('http') ? relUrl : BASE_URL + relUrl;
    if (!fullUrl.startsWith(BASE_URL)) continue;

    const localPath = path.join(OUT_DIR, relUrl.startsWith('/') ? relUrl.slice(1).split('?')[0] : new URL(relUrl).pathname);
    fs.mkdirSync(path.dirname(localPath), { recursive: true });

    try {
      console.log(`Downloading: ${fullUrl}`);
      const buf = await fetchBuffer(fullUrl);
      fs.writeFileSync(localPath, buf);

      // If it's JS or CSS or JSON or HTML, scan for more assets
      if (localPath.endsWith('.js') || localPath.endsWith('.css') || localPath.endsWith('.html') || localPath.endsWith('.json')) {
        const text = buf.toString('utf-8');

        // Check for sourcemap
        const smMatch = text.match(/\/\/# sourceMappingURL=(.*)$/m);
        if (smMatch) {
          const smUrl = smMatch[1].trim();
          const smFull = smUrl.startsWith('http') ? smUrl : path.posix.join(path.posix.dirname(relUrl), smUrl);
          queue.push(smFull);
        }

        // Look for chunk hashes and asset extensions (.glb, .gltf, .mp3, .ogg, .wav, .png, .jpg, .webp, .svg, .woff2, .json, .hdr, .ktx2, .wasm)
        const assetMatches = text.matchAll(/["'](\/[a-zA-Z0-9_\-\./%]+\.(?:glb|gltf|bin|mp3|ogg|wav|png|jpg|jpeg|webp|svg|woff2|woff|hdr|ktx2|wasm|json|mp4|webm))["']/g);
        for (const m of assetMatches) {
          foundAssets.add(m[1]);
          queue.push(m[1]);
        }

        // Look for other _next/static chunks
        const chunkMatches = text.matchAll(/["'](\/_next\/static\/[a-zA-Z0-9_\-\./]+(?:\.js|\.css))["']/g);
        for (const m of chunkMatches) {
          queue.push(m[1]);
        }

        // Look for static path patterns in Next.js manifest
        const staticMatches = text.matchAll(/static\/chunks\/[a-zA-Z0-9_\-\.]+\.js/g);
        for (const m of staticMatches) {
          queue.push('/_next/' + m[0]);
        }
      }
    } catch (err) {
      console.warn(`Failed ${fullUrl}: ${err.message}`);
    }
  }

  console.log('\n--- Found Specific Assets ---');
  for (const asset of foundAssets) {
    console.log(asset);
  }
}

main().catch(console.error);
