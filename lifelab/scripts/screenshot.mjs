import puppeteer from 'puppeteer';
import { mkdirSync } from 'node:fs';

const BASE = process.env.WEB_URL || 'http://localhost:5173';
const OUT = '/home/jay/Desktop/unionFam/lifelab/docs/screenshots';
mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH,
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});

async function shot(page, name) {
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });
  console.log('saved', name);
}

async function clickText(page, text) {
  await page.evaluate((t) => {
    const els = [...document.querySelectorAll('button, [role="button"]')];
    const el = els.find((e) => e.textContent && e.textContent.includes(t));
    if (el) el.click();
  }, text);
}

// -------- Mobile 360 --------
const mp = await browser.newPage();
await mp.setViewport({ width: 360, height: 780, deviceScaleFactor: 2 });
await mp.goto(BASE, { waitUntil: 'networkidle0' });
await shot(mp, 'mobile-01-welcome');
await clickText(mp, 'Bắt đầu');
await shot(mp, 'mobile-02-consent');
await clickText(mp, 'Hỏi tôi sau');
await clickText(mp, 'Tiếp tục');
await new Promise((r) => setTimeout(r, 1800));
await shot(mp, 'mobile-03-conversation');
await clickText(mp, 'Bản đồ');
await shot(mp, 'mobile-04-lifemap');
await clickText(mp, 'Đang thử');
await shot(mp, 'mobile-05-experiments');
await clickText(mp, 'Hành trình');
await shot(mp, 'mobile-06-journey');
await mp.close();

// -------- Desktop 1280 --------
const dp = await browser.newPage();
await dp.setViewport({ width: 1280, height: 900 });
await dp.goto(BASE, { waitUntil: 'networkidle0' });
await shot(dp, 'desktop-01-welcome');
await clickText(dp, 'Ghé nhanh');
await new Promise((r) => setTimeout(r, 400));
await clickText(dp, 'Chỉ dùng trong phiên này');
await clickText(dp, 'Tiếp tục');
await new Promise((r) => setTimeout(r, 1800));
await shot(dp, 'desktop-02-conversation');
await clickText(dp, 'Bản đồ');
await new Promise((r) => setTimeout(r, 500));
await shot(dp, 'desktop-03-lifemap');
await dp.close();

await browser.close();
console.log('DONE');
