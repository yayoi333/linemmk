import type { AppSettings, Message, Sticker, StickerGroup } from './types';

// ガイド撮影と動画見本に同じ、架空の会話・オリジナルの素材を使用。
export const sampleSettings: AppSettings = {
  backgroundColor: 'default', backgroundImage: null, senderType: 'me', showNotch: true,
  opponentName: 'ねこ山さん', showReadStatus: true, readCount: 1, showStar: false,
  showOpponentNameInTalk: true, loopAnimations: false, format: 'v', vFullscreen: false,
  hMode: 'peek', frameBg: { mode: 'default', color: '#2b3648', imgUrl: null },
  videoPanel: true, videoPanelTab: 'sticker', sound: true, introGap: 0.4,
};
export const sampleModes = [
  { id: 'vertical-frame', title: '縦型・フレームあり', description: 'スマホをまるごと見せる。下にはスタンプ一覧も。', format: 'v', vFullscreen: false, hMode: 'peek' },
  { id: 'vertical-full', title: '縦型・全画面', description: 'トーク画面を縦いっぱいに大きく見せる。', format: 'v', vFullscreen: true, hMode: 'peek' },
  { id: 'horizontal-peek', title: '横型・のぞき見', description: 'スマホのトークを横長の窓からのぞく見せ方。上下を切り取り、会話を大きく見せます。', format: 'h', vFullscreen: false, hMode: 'peek' },
  { id: 'horizontal-frame', title: '横型・フレームあり', description: '横長の背景の中央に、スマホ全体を置く。', format: 'h', vFullscreen: false, hMode: 'frame' },
  { id: 'horizontal-full', title: '横型・全画面', description: '横いっぱいに会話を表示。相手名や入力欄は表示しません。', format: 'h', vFullscreen: false, hMode: 'full' },
] as const;
export function makeSampleSticker(index: number): Sticker {
  const words = ['おつかれさま', 'ありがとう', 'いいね！'];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="260" viewBox="0 0 300 260"><path d="M65 90 L70 30 L115 65 Q150 45 185 65 L230 30 L235 90 Q265 200 150 210 Q35 200 65 90" fill="${['#fff3cf','#ffe2e8','#ddf4e9'][index]}" stroke="#54493f" stroke-width="6" stroke-linejoin="round"/><path d="M102 120 Q112 108 122 120 M178 120 Q188 108 198 120 M140 147 Q150 163 160 147" fill="none" stroke="#54493f" stroke-width="7" stroke-linecap="round"/><circle cx="95" cy="145" r="13" fill="#ffb1a4"/><circle cx="205" cy="145" r="13" fill="#ffb1a4"/><text x="150" y="248" text-anchor="middle" font-family="sans-serif" font-size="28" font-weight="bold" fill="#54493f">${words[index]}</text></svg>`;
  return { id: `guide-cat-${index}`, name: `ねこ${index + 1}.png`, url: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`, width: 300, height: 260 };
}
export const sampleStickers = [0, 1, 2].map(makeSampleSticker);
export const sampleGroups: StickerGroup[] = [{ id: 'guide-cats', name: 'ねこスタンプ見本', tabSticker: sampleStickers[0], stickers: sampleStickers, category: 'sticker' }];
export const sampleMessages: Message[] = [
  { id: 'sample-1', sender: 'opponent', type: 'text', content: ['今日もおつかれさま！'], gap: 0.8 },
  { id: 'sample-2', sender: 'me', type: 'sticker', content: [sampleStickers[0]], gap: 1.2 },
  { id: 'sample-3', sender: 'opponent', type: 'text', content: ['このねこ、かわいいね'], gap: 1.2 },
  { id: 'sample-4', sender: 'me', type: 'sticker', content: [sampleStickers[1]], gap: 1.2 },
].map(message => ({ ...message, timestamp: new Date('2026-10-04T12:34:00+09:00') })) as Message[];
