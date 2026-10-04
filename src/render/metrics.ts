/**
 * Canvas描画の寸法定数。すべて「DOMスマホ(幅375px)のCSS値 × 2」= 仮想幅750px系。
 * DOM側(PhonePreview/MessageBubble/StickerPanel)のTailwindクラスと1対1で対応させること。
 */
export const FONT = '-apple-system,"Segoe UI","Hiragino Kaku Gothic ProN","Hiragino Sans","Yu Gothic UI",Meiryo,sans-serif';

export const M = {
  W: 750,                 // スマホ画面の仮想幅(DOM 375×2)

  // ヘッダー(DOM: h-14 px-6 pt-5)
  headerH: 112,
  headerPadTop: 40,
  headerPadX: 48,
  headerNameFont: 32,     // text-base bold
  headerIcon: 40,         // size=20
  headerIconGap: 24,      // gap-3
  headerBackIcon: 48,     // ChevronLeft size=24

  // トーク面(DOM: px-1.5 py-4 / gap-2 / mt-4|mt-1)
  chatPadX: 12,
  chatPadY: 32,
  msgGap: 16,
  mtFirst: 32,
  mtNext: 8,
  rowMax: 637,            // max-w-[85%]

  // アバター・名前(DOM: w-7 mr-1.5 mt-1 / text-[11px] mb-0.5)
  avatarD: 56,
  avatarGapR: 12,
  avatarMT: 8,
  nameFont: 22,
  nameH: 26,

  // 吹き出し(DOM: px-3 py-1 rounded-2xl text-[14px] leading-relaxed)
  bubblePadX: 24,
  bubblePadY: 8,
  bubbleRadius: 32,
  textFont: 28,
  lineH: 45,
  tailSize: 16,           // w-2 h-2
  tailTop: 8,             // top-1
  tailOut: 6,             // ±3px はみ出し

  // スタンプ・絵文字(DOM: max-w-[155px] / w-[120px] / 75|55|45px)
  stickerW: 310,
  stickerEmojiW: 240,
  emoji2: 150,
  emoji3: 110,
  emoji4: 90,
  emojiGap: 8,            // gap-1
  inlineEmoji: 40,        // w-5
  inlineEmojiMx: 4,       // mx-0.5

  // 時刻・既読(DOM: text-[9px] min-w-[28px] mb-1)
  statusW: 56,
  statusGap: 8,
  metaFont: 18,
  metaMB: 8,

  // ☆マーク(DOM: w-7 円 #7b92b4 + Star size=16)
  starD: 56,
  starIcon: 32,

  // リアクション(DOM: 16.8px mt-1 gap-0.5)
  reactSize: 34,
  reactGap: 4,
  reactMT: 8,

  // 入力バー(DOM: px-2 py-2 gap-2 / フィールド min-h-[40px] rounded-2xl px-3)
  inputH: 112,
  inputPad: 16,
  inputGap: 16,
  inputChevron: 40,
  fieldH: 80,
  fieldPadX: 24,
  fieldRadius: 32,
  placeholderFont: 28,
  smileIcon: 40,
  sendIcon: 48,

  // パネル(DOM: h-56 / 切替バー h-12 pl-3 / ピル h-[32px] px-2 / タブ min-w-[40px] img w-7)
  panelH: 448,
  switcherH: 96,
  switcherPadL: 24,
  pillH: 64,
  pillPadX: 16,
  pillIcon: 40,
  pillOverlap: 12,        // -space-x-1.5
  tabW: 80,
  tabImg: 56,
  tabGap: 8,              // gap-1
  tabsAfterPill: 24,      // gap-3
  gearIcon: 44,
  gridPad: 16,            // p-2
  gridGapSticker: 16,     // gap-2
  gridGapEmoji: 8,        // gap-1
  cellPad: 8,             // p-1
  panelBottomPad: 32,     // h-4

  // ホームバー(DOM: h-6 / ピル w-32 h-1.5)
  homeH: 48,
  homePillW: 256,
  homePillH: 12,
};
