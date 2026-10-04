const { chromium } = require('C:/Users/akiru/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: 'C:/Users/akiru/AppData/Local/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-win64/chrome-headless-shell.exe' });
  const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  page.on('response', r => { if(r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
  await require('./access-test-helpers.cjs').openApp(page);
  await page.getByRole('link', { name: '使い方', exact: true }).click();
  await page.getByRole('heading', { name: '5つの画面で、最初の1本。' }).waitFor();
  await page.screenshot({ path: 'output/playwright/guide-desktop.png', fullPage: true });
  if (await page.locator('video').count() !== 5) throw new Error('Expected five videos');
  for (let i = 0; i < 5; i++) {
    const result = await page.locator('video').nth(i).evaluate(async v => {
      v.muted = true; await v.play();
      await new Promise((resolve, reject) => { const timer = setTimeout(() => reject(new Error('Playback timeout')), 10000); const check = () => { if(v.currentTime > 0.15) { clearTimeout(timer); resolve(); } else requestAnimationFrame(check); }; check(); });
      v.pause(); return { width: v.videoWidth, height: v.videoHeight, duration: v.duration, currentTime: v.currentTime };
    });
    console.log('Video', i+1, JSON.stringify(result));
    if(result.duration < 6 || !result.width) throw new Error('Invalid video');
  }
  await page.getByRole('button', { name: 'スタンプを入れるのスクショを拡大', exact: true }).click();
  if (!await page.getByRole('dialog').isVisible()) throw new Error('Zoom failed');
  await page.keyboard.press('Escape');
  if (await page.getByRole('dialog').count()) throw new Error('Close failed');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: 'output/playwright/guide-mobile.png', fullPage: true });
  if(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw new Error('Mobile horizontal overflow');
  await page.getByRole('link', { name: 'アプリへ', exact: true }).click();
  await page.getByRole('link', { name: '使い方', exact: true }).waitFor();
  if(await page.locator('meta[name="robots"]').count()) throw new Error('Unexpected app robots change');
  if(errors.length) throw new Error(errors.join('\n'));
  console.log('PASS: five MP4s play; zoom, mobile layout and app navigation work; no browser errors.');
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });


