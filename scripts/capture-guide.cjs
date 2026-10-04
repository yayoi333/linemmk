const { chromium } = require('C:/Users/akiru/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const sharp = require('C:/Users/akiru/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const fs = require('node:fs/promises');
const path = require('node:path');

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: 'C:/Users/akiru/AppData/Local/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-win64/chrome-headless-shell.exe' });
  const page = await browser.newPage({ viewport: { width: 1280, height: 1160 }, deviceScaleFactor: 1 });
  await require('./access-test-helpers.cjs').openApp(page);
  await page.getByRole('button', { name: 'PNGで追加' }).first().waitFor();
  console.log((await page.locator('body').innerText()).slice(0, 4000));
  async function shot(name, crop, targets) {
    await page.evaluate(() => window.scrollTo(0, 0));
    const rings = [];
    for (const target of targets) {
      const b = await target.boundingBox();
      if (!b) throw new Error('Missing annotation target');
      const cx = b.x + b.width / 2 - crop.x, cy = b.y + b.height / 2 - crop.y;
      const rx = b.width / 2 + 16, ry = b.height / 2 + 13;
      rings.push(`<path d="M ${cx+rx} ${cy-3} C ${cx+rx+10} ${cy+ry} ${cx-rx+9} ${cy+ry+12} ${cx-rx} ${cy+4} C ${cx-rx-12} ${cy-ry-9} ${cx+rx-6} ${cy-ry-15} ${cx+rx+3} ${cy+9}" fill="none" stroke="#ed343c" stroke-width="5" stroke-linecap="round" opacity=".92"/>`);
    }
    const image = await page.screenshot({ clip: crop });
    await sharp(image).composite([{ input: Buffer.from(`<svg width="${crop.width}" height="${crop.height}" xmlns="http://www.w3.org/2000/svg">${rings.join('')}</svg>`) }]).toFile(`public/guide/${name}.png`);
  }
  await shot('01-upload', { x: 424, y: 700, width: 740, height: 380 }, [page.getByRole('button', { name: 'PNGで追加' }).first(), page.getByRole('button', { name: 'ZIPで一括追加' }).first()]);
  const pngs = [];
  for (let i = 0; i < 3; i++) {
    const data = await page.evaluate(async index => {
      const { sampleStickers } = await import('/linemmk/src/guideSamples.ts');
      const image = new Image(); image.src = sampleStickers[index].url; await image.decode();
      const c = document.createElement('canvas'); c.width = 300; c.height = 260; c.getContext('2d').drawImage(image, 0, 0);
      return c.toDataURL('image/png').split(',')[1];
    }, i);
    const file = path.resolve(`output/playwright/cat-${i+1}.png`); await fs.writeFile(file, Buffer.from(data, 'base64')); pngs.push(file);
  }
  await page.locator('input[type=file][accept=".png"]').first().setInputFiles(pngs);
  await page.getByRole('button', { name: '受信', exact: true }).click();
  await page.getByPlaceholder('メッセージを入力').fill('今日もおつかれさま！');
  console.log(await page.locator('button').evaluateAll(es=>es.filter(e=>e.querySelector('.lucide-send')).map(e=>e.outerHTML)));
  await page.locator('button').filter({ has: page.locator('.lucide-send') }).click();
  await page.getByRole('button', { name: '送信', exact: true }).click();
  console.log((await page.locator('body').innerText()).slice(0,1800));
  console.log(await page.locator('img').evaluateAll(es=>es.map(e=>({alt:e.alt,parent:e.parentElement.outerHTML.slice(0,350)}))));
  await page.getByPlaceholder('メッセージを入力').fill('ありがとう！');
  await shot('02-talk', { x: 8, y: 80, width: 410, height: 1050 }, [page.getByRole('button', { name: '受信', exact: true }), page.getByRole('button', { name: '送信', exact: true }), page.getByPlaceholder('メッセージを入力'), page.locator('button').filter({ has: page.locator('.lucide-send') })]);
  await page.getByPlaceholder('メッセージを入力').fill('');
  const sticker = page.locator('button').filter({ has: page.locator('img[alt="cat-1.png"]') });
  if (await sticker.count()) await sticker.first().click();
  else await page.locator('img[alt="cat-1.png"]').last().click();
  await shot('03-sticker', { x: 8, y: 80, width: 410, height: 870 }, [page.locator('img[alt="cat-1.png"]').last()]);
  await shot('04-format', { x: 424, y: 80, width: 740, height: 540 }, [page.getByRole('button', { name: '横型 16:9', exact: true })]);
  await page.getByRole('button', { name: '横型 16:9', exact: true }).click();
  await shot('05-peek', { x: 424, y: 80, width: 740, height: 520 }, [page.getByRole('button', { name: 'のぞき見', exact: true })]);
  await shot('06-export', { x: 8, y: 80, width: 410, height: 1050 }, [page.getByRole('button', { name: '▶ プレビュー再生', exact: true }), page.getByRole('button', { name: '🎬 動画を書き出す', exact: true })]);
  for (let index = 0; index < (process.argv.includes('--screens-only') ? 0 : 5); index++) {
    const downloadPromise = page.waitForEvent('download', { timeout: 120000 });
    const result = await page.evaluate(async index => {
      const { sampleSettings, sampleMessages, sampleGroups, sampleModes } = await import('/linemmk/src/guideSamples.ts');
      const { prepareRenderAssets } = await import('/linemmk/src/render/prepare.ts');
      const { buildTimeline } = await import('/linemmk/src/render/timeline.ts');
      const { exportVideo } = await import('/linemmk/src/render/exporter.ts');
      const { drawFrame } = await import('/linemmk/src/render/engine.ts');
      const settings = { ...sampleSettings, ...sampleModes[index] };
      const timeline = buildTimeline(sampleMessages, settings.introGap);
      const state = { settings, messages: sampleMessages, timeline, assets: await prepareRenderAssets(sampleMessages, sampleGroups), stickerGroups: sampleGroups, emojiGroups: [], activeStickerGroupId: sampleGroups[0].id, activeEmojiGroupId: null, wallImage: null, frameImage: null };
      const canvas = document.createElement('canvas');
      drawFrame(canvas, timeline.dur - 0.5, state);
      const poster = canvas.toDataURL('image/png').split(',')[1];
      const result = await exportVideo({ canvas, state, timeline, onProgress: () => {} });
      return { id: sampleModes[index].id, poster, ...result };
    }, index);
    await fs.writeFile(`public/guide/${result.id}.png`, Buffer.from(result.poster, 'base64'));
    await (await downloadPromise).saveAs(`public/guide/${result.id}.${result.format}`);
    console.log('Exported', result.id, result.format, result.size, result.duration);
    if (result.format !== 'mp4') throw new Error('Expected MP4 sample');
  }
  await browser.close();
})().catch(error => { console.error(error); process.exit(1); });


