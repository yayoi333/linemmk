/**
 * lucideアイコンをSVG→Imageに変換してCanvasに描くためのヘルパー。
 * 文字グリフ(⌕☎など)は使わない。preloadIcons() を描画開始前に必ずawaitすること。
 */
interface IconDef {
  inner: string;
  filled?: boolean;
}

// lucide-react と同じパスデータ(viewBox 24, stroke-width 2, round)
const ICONS: Record<string, IconDef> = {
  'chevron-left': { inner: '<path d="m15 18-6-6 6-6"/>' },
  search: { inner: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>' },
  phone: { inner: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>' },
  calendar: { inner: '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>' },
  menu: { inner: '<path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/>' },
  smile: { inner: '<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" x2="9.01" y1="9" y2="9"/><line x1="15" x2="15.01" y1="9" y2="9"/>' },
  send: { inner: '<path d="m22 2-7 20-4-9-9-4Z"/>', filled: true },
  settings: { inner: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>' },
  star: { inner: '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14 2 9.27l6.91-1.01z" stroke-width="1.5"/>' },
  image: { inner: '<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>' },
  // StickerPanelの絵文字タブと同じネコ顔(fill)
  'emoji-cat': { inner: '<path d="M4.5,10.6c0-1.8,1.5-3.3,3.3-3.3c0.4,0,0.8,0.1,1.1,0.2c1.1-1.2,2.7-2,4.4-2s3.3,0.8,4.4,2c0.3-0.1,0.7-0.2,1.1-0.2c1.8,0,3.3,1.5,3.3,3.3c0,1.2-0.7,2.3-1.7,2.8c0.1,0.5,0.2,1.1,0.2,1.6c0,4.4-3.6,8-8,8s-8-3.59-8-8c0-0.5,0.1-1.1,0.2-1.6C5.2,12.9,4.5,11.8,4.5,10.6z M12,14c-1.1,0-2,0.9-2,2s0.9,2,2,2s2-0.9,2-2S13.1,14,12,14z M8,12c-0.6,0-1,0.4-1,1s0.4,1,1,1s1-0.4,1-1S8.6,12,8,12z M16,12c-0.6,0-1,0.4-1,1s0.4,1,1,1s1-0.4,1-1S16.6,12,16,12z"/>', filled: true },
};

const cache = new Map<string, HTMLImageElement>();

function buildSvg(def: IconDef, color: string) {
  const paint = def.filled
    ? `fill="${color}" stroke="none"`
    : `fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" ${paint}>${def.inner}</svg>`;
}

async function load(name: string, color: string) {
  const key = `${name}|${color}`;
  if (cache.has(key)) return;
  const def = ICONS[name];
  if (!def) return;
  const image = new Image();
  image.src = `data:image/svg+xml;utf8,${encodeURIComponent(buildSvg(def, color))}`;
  try {
    await image.decode();
    cache.set(key, image);
  } catch (error) {
    console.warn(`アイコン ${name} の生成に失敗しました。`, error);
  }
}

/** 描画で使う全色の組み合わせを事前ロードする(プレビュー/書き出し開始前にawait) */
export async function preloadIcons(): Promise<void> {
  const jobs: Promise<void>[] = [];
  for (const ink of ['black', 'white']) {
    for (const name of ['chevron-left', 'search', 'phone', 'calendar', 'menu']) jobs.push(load(name, ink));
  }
  jobs.push(load('chevron-left', '#9ca3af'));   // 入力バー左(gray-400)
  jobs.push(load('smile', '#6b7280'));          // 入力バー右(gray-500)
  jobs.push(load('send', '#d1d5db'));           // 送信(未入力=gray-300)
  jobs.push(load('settings', '#9ca3af'));       // パネル歯車(gray-400)
  jobs.push(load('smile', 'white'));            // パネル切替ピル
  jobs.push(load('emoji-cat', 'white'));
  jobs.push(load('star', 'white'));             // ☆マーク
  jobs.push(load('image', '#9ca3af'));          // タブ画像なしの代替
  await Promise.all(jobs);
}

export function getIcon(name: string, color: string): HTMLImageElement | null {
  return cache.get(`${name}|${color}`) ?? null;
}
