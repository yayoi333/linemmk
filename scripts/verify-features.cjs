const { chromium } = require('C:/Users/akiru/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs = require('node:fs');
const path = require('node:path');
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: 'C:/Users/akiru/AppData/Local/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-win64/chrome-headless-shell.exe' });
  const page = await browser.newPage({ viewport: { width: 1280, height: 1100 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if(response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  await require('./access-test-helpers.cjs').openApp(page);
  await page.getByRole('link', { name: '使い方', exact: true }).click();
  await page.getByRole('link', { name: '全機能ガイド', exact: true }).click();
  await page.getByRole('heading', { name: '名前・表示の設定', exact: true }).waitFor();
  const data = await page.evaluate(async () => {
    const { featureSections } = await import('/linemmk/src/featureCatalog.ts');
    const { default: screens } = await import('/linemmk/src/featureScreens.ts');
    return { sections: featureSections, screens };
  });
  let count = 0;
  for (const section of data.sections) {
    const container = page.locator(`#${section.id}`);
    for (const item of section.items) {
      for (const [screenId, key] of [[item.source ?? section.source, item.left], [item.result ?? section.result, item.right]]) {
        const screen = data.screens[screenId], box = screen?.boxes[key];
        if(!screen || !box) throw new Error(`Missing mapping: ${section.id}/${item.id}/${screenId}/${key}`);
        if(!fs.existsSync(path.resolve('public/guide/features', screen.image))) throw new Error(`Missing image ${screen.image}`);
        if(box.x < -.001 || box.y < -.001 || box.x+box.w > 1.001 || box.y+box.h > 1.001) throw new Error(`Out-of-bounds annotation: ${screenId}/${key} ${JSON.stringify(box)}`);
      }
      await container.getByRole('button', { name: new RegExp(item.label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')+'$') }).first().click();
      if(await container.locator('.feature-caption h3').innerText() !== item.outcome) throw new Error(`Wrong caption ${item.id}`);
      await container.locator('.feature-board img').evaluateAll(async images => Promise.all(images.map(image => image.decode())));
      const geometry = await container.locator('.feature-lines').getAttribute('width');
      if(!Number(geometry)) throw new Error(`Missing connector ${item.id}`);
      count++;
    }
  }
  console.log(`PASS: ${count} feature mappings, images and controls`);
  await page.locator('#appearance .feature-options button').first().click();
  await page.locator('#appearance').screenshot({ path: 'output/playwright/features-desktop.png', animations: 'disabled' });
  await page.getByRole('searchbox', { name: '機能を検索' }).fill('既読数');
  if(await page.locator('.feature-section').count() !== 2) throw new Error('Search result count mismatch');
  await page.getByRole('searchbox', { name: '機能を検索' }).fill('見つからない機能');
  if(!await page.getByText('該当する機能がありません。別の言葉で検索してください。').isVisible()) throw new Error('Empty search failed');
  await page.getByRole('searchbox', { name: '機能を検索' }).fill('');
  await page.getByRole('button', { name: '相手の名前の操作場所を拡大', exact: true }).click();
  if(!await page.getByRole('dialog').isVisible()) throw new Error('Zoom failed');
  await page.locator('.feature-zoom img').evaluate(image => image.decode());
  const zoomImage = await page.locator('.feature-zoom img').boundingBox();
  const zoomLines = await page.locator('.feature-zoom svg').boundingBox();
  for(const key of ['x', 'y', 'width', 'height']) if(Math.abs(zoomImage[key] - zoomLines[key]) > 1) throw new Error('Zoom annotations do not align');
  await page.keyboard.press('Tab');
  if(!await page.getByRole('button', { name: '拡大画像を閉じる', exact: true }).evaluate(el => document.activeElement === el)) throw new Error('Focus trap failed');
  await page.keyboard.press('Escape');
  if(await page.getByRole('dialog').count()) throw new Error('Escape failed');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('#appearance').screenshot({ path: 'output/playwright/features-mobile.png', animations: 'disabled' });
  if(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw new Error('Mobile overflow');
  await page.getByRole('link', { name: 'はじめての使い方', exact: true }).click();
  await page.getByRole('heading', { name: '5つの画面で、最初の1本。', exact: true }).waitFor();
  const text = await page.locator('body').innerText();
  if(/赤い線は、このガイドの目印|スクショをタップすると大きく|横型の「のぞき見」はここ|見本のMP4をダウンロード/.test(text)) throw new Error('Removed content remains');
  if(await page.locator('a[download]').count()) throw new Error('Download link remains');
  if(await page.locator('video').count() !== 5) throw new Error('Expected five sample videos');
  if(!(await page.locator('video').evaluateAll(videos => videos.every(v => v.controlsList.contains('nodownload'))))) throw new Error('Native download controls remain');
  await page.screenshot({ path: 'output/playwright/guide-revised.png', fullPage: false });
  await page.getByRole('link', { name: '全機能ガイド', exact: true }).click();
  await page.getByRole('heading', { name: '名前・表示の設定', exact: true }).waitFor();
  if(errors.length) throw new Error(errors.join('\n'));
  console.log('PASS: search, zoom, focus, mobile layout, guide navigation and download UI removal; no browser errors.');
  await browser.close();
})().catch(error => { console.error(error); process.exit(1); });


