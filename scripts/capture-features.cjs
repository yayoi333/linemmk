const { chromium } = require('C:/Users/akiru/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs = require('node:fs/promises');
const path = require('node:path');

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: 'C:/Users/akiru/AppData/Local/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-win64/chrome-headless-shell.exe' });
  const page = await browser.newPage({ viewport: { width: 1280, height: 1300 } });
  const root = 'public/guide/features';
  await require('./access-test-helpers.cjs').openApp(page, 'http://localhost:3001/linemmk/');
  await page.evaluate(async () => { const { sampleSettings } = await import('/linemmk/src/guideSamples.ts'); localStorage.setItem('mitemitekun_settings', JSON.stringify({ ...sampleSettings, readCount: 2, showStar: true })); });
  await page.reload();
  const phone = page.locator('main > section').first().locator(':scope > div').first();
  const card = title => page.getByRole('heading', { name: title, exact: true }).locator('..');
  const toggle = label => page.getByText(label, { exact: true }).locator('xpath=ancestor::div[button][1]').locator('button');
  const send = page.locator('button').filter({ has: page.locator('.lucide-send') });
  const input = page.locator('textarea');
  const files = [1, 2, 3].map(i => path.resolve(`output/playwright/cat-${i}.png`));
  await page.locator('input[type=file][accept=".png"]').first().setInputFiles(files);
  await page.locator('input[type=file][accept=".png"]').nth(1).setInputFiles(files);
  await page.getByRole('button', { name: '受信', exact: true }).click();
  await input.fill('今日もおつかれさま！'); await send.click();
  await page.getByRole('button', { name: '送信', exact: true }).click();
  const category = phone.locator('div.cursor-pointer').filter({ has: page.locator('.lucide-smile') }).last();
  await category.click(); // アップロード直後は絵文字。スタンプへ戻す。
  await phone.locator('button').filter({ has: page.locator('img[alt="cat-1.png"]') }).click();
  await phone.getByText('既読 2', { exact: true }).waitFor();
  const out = {};
  const normalized = (b, parent) => ({ x: (b.x-parent.x)/parent.width, y: (b.y-parent.y)/parent.height, w: b.width/parent.width, h: b.height/parent.height });
  async function capture(id, locator, targets = {}) {
    await locator.scrollIntoViewIfNeeded();
    await page.mouse.move(1200, 20);
    await locator.screenshot({ path: `${root}/${id}.png`, animations: 'disabled' });
    const bounds = await locator.boundingBox();
    const png = await fs.readFile(`${root}/${id}.png`);
    // PNGは要素の小数寸法を整数へ丸めるため、拡大時には実ピクセルの比率を使う。
    bounds.width = png.readUInt32BE(16); bounds.height = png.readUInt32BE(20);
    const boxes = {};
    for (const [key, target] of Object.entries(targets)) {
      if (target.x !== undefined) boxes[key] = target;
      else { const b = await target.boundingBox(); if (!b) throw new Error(`No target ${id}/${key}`); boxes[key] = normalized(b, bounds); }
    }
    out[id] = { image: `${id}.png`, width: bounds.width, height: bounds.height, boxes };
    console.log('Captured', id, Object.keys(boxes).join(', '));
  }
  const phoneTargets = {
    name: phone.getByText('ねこ山さん', { exact: true }).first(),
    senderName: phone.getByText('ねこ山さん', { exact: true }).last(),
    notch: phone.locator('div.absolute.top-0').first(),
    read: phone.getByText('既読 2', { exact: true }),
    star: phone.locator('.lucide-star').locator('..'),
    talk: phone.locator('div.overflow-y-auto').first(),
    panel: phone.locator('div.h-56'),
    input: input,
    send,
    gear: phone.locator('button').filter({ has: page.locator('.lucide-settings') }),
    category,
    groups: phone.locator('button').filter({ has: page.locator('img[alt="Tab"]') }).first(),
  };
  // The large image in the talk is the sent sticker (not the tab or panel).
  phoneTargets.sticker = phone.locator('img').locator('xpath=self::img[contains(@class,"155px")]');
  await capture('phone-appearance', phone, phoneTargets);
  const settings = card('2. 名前設定').locator('..');
  await capture('appearance-settings', settings, {
    name: page.getByPlaceholder('映えチェッカーくん'), notch: toggle('スマホのノッチを表示'), read: toggle('既読を表示'), count: page.getByText('既読数', { exact: true }).locator('..').locator('input'),
    star: toggle('お気に入り(☆)を表示'), loop: toggle('動くスタンプを連続再生'), senderName: toggle('トーク内の相手の名前を表示'), fullscreen: toggle('全画面表示モード'),
  });
  await toggle('全画面表示モード').click();
  await capture('phone-fullscreen', phone, { talk: { x: .02, y: .08, w: .96, h: .7 } });
  await page.locator('button.fixed').click();
  await capture('upload-settings', card('1. スタンプをアップロード').locator('..'), {
    stickerZip: page.getByRole('button', { name: 'ZIPで一括追加' }).first(), stickerPng: page.getByRole('button', { name: 'PNGで追加' }).first(),
    emojiZip: page.getByRole('button', { name: 'ZIPで一括追加' }).nth(1), emojiPng: page.getByRole('button', { name: 'PNGで追加' }).nth(1), remove: page.getByRole('button', { name: '素材一覧から削除' }).first(),
  });
  await capture('talk-controls', page.locator('main > section').first(), {
    input, send, received: page.getByRole('button', { name: '受信', exact: true }), sent: page.getByRole('button', { name: '送信', exact: true }),
    category, groups: phoneTargets.groups, sticker: phone.locator('button').filter({ has: page.locator('img[alt="cat-1.png"]') }),
    preview: page.getByRole('button', { name: '▶ プレビュー再生', exact: true }), export: page.getByRole('button', { name: '🎬 動画を書き出す', exact: true }),
  });
  await page.getByRole('button', { name: '白', exact: true }).click();
  await capture('background-settings', card('4. 背景設定').locator('..'), {
    default: page.getByRole('button', { name: '標準背景', exact: true }), color: page.getByRole('button', { name: '白', exact: true }), image: page.getByRole('button', { name: '背景画像をアップロード', exact: true }), clear: page.getByRole('button', { name: 'トーククリア', exact: true }),
  });
  await capture('phone-background', phone, { background: phoneTargets.talk });
  await page.getByRole('button', { name: '標準背景', exact: true }).click();
  await category.click();
  await input.fill('ありがとう');
  await phone.locator('button').filter({ has: page.locator('img[alt="cat-2.png"]') }).click();
  await capture('emoji-input', phone, { category, group: phoneTargets.groups, emoji: phone.locator('button').filter({ has: page.locator('img[alt="cat-2.png"]') }), input, send });
  await send.click();
  await capture('phone-emoji', phone, { bubble: phone.getByText('ありがとう', { exact: true }).locator('..').locator('..') });
  await phone.getByText('今日もおつかれさま！', { exact: true }).click({ button: 'right' });
  const menu = page.getByText('アクション', { exact: true }).locator('../..');
  await capture('message-menu', menu, {
    sender: page.getByRole('button', { name: /送⇔受 切り替え/ }), gap: page.getByRole('spinbutton', { name: '間隔（秒）', exact: true }), reaction: page.getByRole('button', { name: /リアクションを選択/ }), remove: page.getByRole('button', { name: /メッセージを削除/ }),
  });
  await page.getByRole('button', { name: /リアクションを選択/ }).click();
  await phone.locator('button').filter({ has: page.locator('img[alt="cat-3.png"]') }).click();
  await capture('phone-reaction', phone, { reaction: phone.locator('img[alt="reaction"]'), message: phone.getByText('今日もおつかれさま！', { exact: true }) });
  await phoneTargets.gear.click();
  await capture('phone-gear', phone, { gear: phoneTargets.gear, settings: phone.locator('div.h-56'), name: phone.getByText('相手の名前', { exact: true }).locator('..') });
  await phoneTargets.gear.click();
  await capture('video-settings', card('動画の設定'), {
    vertical: page.getByRole('button', { name: '縦型 9:16', exact: true }), horizontal: page.getByRole('button', { name: '横型 16:9', exact: true }),
    frame: page.getByRole('button', { name: 'フレームあり', exact: true }), full: page.getByRole('button', { name: '全画面', exact: true }),
    background: page.getByText('スマホ外側の背景', { exact: true }).locator('..'), panel: page.getByRole('button', { name: '表示する', exact: true }),
    panelTab: page.getByRole('button', { name: '絵文字', exact: true }), sound: page.getByRole('button', { name: '有効', exact: true }), intro: page.getByRole('spinbutton', { name: '冒頭の間隔（秒）' }),
  });
  await page.getByRole('button', { name: '▶ プレビュー再生', exact: true }).click();
  await page.getByRole('button', { name: '▶ 再生', exact: true }).waitFor({ state: 'visible' });
  await page.waitForFunction(() => document.querySelector('canvas')?.width === 1080 && [...document.querySelectorAll('button')].some(b => b.textContent === '▶ 再生' && !b.disabled));
  await capture('video-output', page.locator('canvas'), { frame: { x: .06, y: .015, w: .88, h: .964 }, background: { x: .005, y: .14, w: .035, h: .59 }, panel: { x: .09, y: .658, w: .84, h: .28 }, talk: { x: .09, y: .12, w: .84, h: .49 } });
  await capture('preview-controls', page.getByRole('button', { name: '▶ 再生', exact: true }).locator('..'), { play: page.getByRole('button', { name: '▶ 再生', exact: true }), export: page.getByRole('button', { name: '🎬 書き出す', exact: true }), close: page.getByRole('button', { name: '✕ 閉じる', exact: true }) });
  await page.getByRole('button', { name: '✕ 閉じる', exact: true }).click();
  await page.getByRole('button', { name: '横型 16:9', exact: true }).click();
  await capture('horizontal-settings', card('動画の設定'), { peek: page.getByRole('button', { name: 'のぞき見', exact: true }), frame: page.getByRole('button', { name: 'フレームあり', exact: true }), full: page.getByRole('button', { name: '全画面', exact: true }) });
  for (const id of ['horizontal-peek', 'horizontal-frame', 'horizontal-full', 'vertical-full']) {
    out[`sample-${id}`] = { image: `../${id}.png`, width: id.startsWith('horizontal') ? 1920 : 1080, height: id.startsWith('horizontal') ? 1080 : 1920, boxes: { talk: id === 'horizontal-peek' ? { x: .273, y: .12, w: .45, h: .72 } : { x: .1, y: .1, w: .8, h: .8 }, frame: { x: .35, y: .04, w: .3, h: .92 } } };
  }
  await fs.writeFile('src/featureScreens.ts', `// 実画面の撮影時に取得した、注釈対象の相対座標。\nexport default ${JSON.stringify(out, null, 2)};\n`);
  await browser.close();
})().catch(error => { console.error(error); process.exit(1); });




