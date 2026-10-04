/**
 * Canvasレンダラー。編集画面のDOMスマホ(PhonePreview/MessageBubble/StickerPanel)を
 * 忠実に再現して動画フレームを描く。寸法はすべて metrics.ts(DOM×2)を使うこと。
 * スマホフレーム・外側背景・のぞき見カラムのみ legacy/mitemite_v1.html 由来。
 */
import { AppSettings, Message, Sticker, StickerGroup } from '../types';
import { getContrastColor } from '../utils/contrast';
import { animFrameAt, DecodedApng } from './apng';
import { getIcon } from './icons';
import { FONT, M } from './metrics';
import { RenderAsset } from './prepare';
import { Timeline } from './timeline';

export interface RenderState {
  settings: AppSettings;
  messages: Message[];
  timeline: Timeline;
  assets: Map<string, RenderAsset>;
  stickerGroups: StickerGroup[];
  emojiGroups: StickerGroup[];
  activeStickerGroupId: string | null;
  activeEmojiGroupId: string | null;
  wallImage: HTMLImageElement | null;
  frameImage: HTMLImageElement | null;
}

interface ChromeOptions { chrome: boolean; panel: boolean; }

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const easeOut = (p: number) => 1 - Math.pow(1 - p, 3);
const APPEAR_SEC = 0.25;
const SCROLL_SEC = 0.32;

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number | number[]) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
}

function cover(ctx: CanvasRenderingContext2D, image: HTMLImageElement, x: number, y: number, width: number, height: number) {
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
  const iw = image.naturalWidth * scale;
  const ih = image.naturalHeight * scale;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, width, height);
  ctx.clip();
  ctx.drawImage(image, x + (width - iw) / 2, y + (height - ih) / 2, iw, ih);
  ctx.restore();
}

function hex2rgb(hex: string): [number, number, number] {
  const value = hex.replace('#', '');
  return [0, 2, 4].map((index) => parseInt(value.substring(index, index + 2), 16)) as [number, number, number];
}

function mix(hexA: string, hexB: string, ratio: number) {
  const a = hex2rgb(hexA);
  const b = hex2rgb(hexB);
  const m = a.map((v, i) => Math.round(v + (b[i] - v) * ratio));
  return `rgb(${m[0]},${m[1]},${m[2]})`;
}

// ============================================================
//  レイアウト計算(DOMのMessageBubble相当)
// ============================================================
type TextAtom = { ch: string } | { sticker: Sticker };

interface LayoutItem {
  m: Message;
  me: boolean;
  first: boolean;         // isFirstInSequence(DOMと同じ判定)
  y: number;              // ブロック上端(チャット内容座標)
  nameH: number;
  bx: number; by: number; bw: number; bh: number;
  lines?: { atoms: TextAtom[]; w: number }[];
  emojiSize?: number;
  h: number;              // name + bubble + reactions を含む高さ
}

interface Layout { items: LayoutItem[]; totalH: number; }

let layoutCache: Layout | null = null;
let layoutKey = '';

function isSameMinute(a: Date, b: Date) {
  const da = new Date(a);
  const db = new Date(b);
  return da.getHours() === db.getHours() && da.getMinutes() === db.getMinutes();
}

function assetSize(item: Sticker, assets: Map<string, RenderAsset>): [number, number] {
  const asset = assets.get(item.id);
  if (asset?.anim) return [asset.anim.w, asset.anim.h];
  if (asset?.imgEl.naturalWidth) return [asset.imgEl.naturalWidth, asset.imgEl.naturalHeight];
  return [item.width || 1, item.height || 1];
}

function wrapText(ctx: CanvasRenderingContext2D, content: (string | Sticker)[], maxW: number) {
  const atoms: TextAtom[] = [];
  for (const item of content) {
    if (typeof item === 'string') for (const ch of item) atoms.push({ ch });
    else atoms.push({ sticker: item });
  }
  const lines: { atoms: TextAtom[]; w: number }[] = [];
  let line: TextAtom[] = [];
  let width = 0;
  for (const atom of atoms) {
    if ('ch' in atom && atom.ch === '\n') {
      lines.push({ atoms: line, w: width });
      line = [];
      width = 0;
      continue;
    }
    const aw = 'ch' in atom ? ctx.measureText(atom.ch).width : M.inlineEmoji + M.inlineEmojiMx * 2;
    if (line.length && width + aw > maxW) {
      lines.push({ atoms: line, w: width });
      line = [];
      width = 0;
    }
    line.push(atom);
    width += aw;
  }
  lines.push({ atoms: line, w: width });
  return lines;
}

function computeLayout(ctx: CanvasRenderingContext2D, state: RenderState): Layout {
  const { messages, settings } = state;
  const key = JSON.stringify([
    settings.showOpponentNameInTalk, settings.showReadStatus,
    messages.map((m) => [m.id, m.sender, m.type, m.isEmoji,
      (m.content ?? []).map((c) => typeof c === 'string' ? c : `#${c.id}`),
      (m.reactions ?? []).length]),
  ]);
  if (layoutCache && layoutKey === key) return layoutCache;

  ctx.font = `500 ${M.textFont}px ${FONT}`;
  const items: LayoutItem[] = [];
  let y = M.chatPadY;
  messages.forEach((m, index) => {
    const me = m.sender === 'me';
    const prev = messages[index - 1];
    const first = !prev || prev.sender !== m.sender || !isSameMinute(prev.timestamp, m.timestamp);
    y += index === 0 ? (first ? M.mtFirst : M.mtNext) : (first ? M.mtFirst : M.mtNext) + M.msgGap;

    const nameH = (!me && first && settings.showOpponentNameInTalk) ? M.nameH : 0;
    const leftX = M.chatPadX + M.avatarD + M.avatarGapR;
    const stickers = (m.content ?? []).filter((c): c is Sticker => typeof c !== 'string');
    let bw = 0;
    let bh = 0;
    const item: LayoutItem = { m, me, first, y, nameH, bx: 0, by: 0, bw: 0, bh: 0, h: 0 };

    if (m.type === 'sticker') {
      const target = stickers[0];
      bw = m.isEmoji ? M.stickerEmojiW : M.stickerW;
      if (target) {
        const [nw, nh] = assetSize(target, state.assets);
        bh = Math.round(bw * nh / nw);
      } else {
        bh = bw;
      }
    } else if (m.type === 'emoji-combined') {
      const size = stickers.length === 2 ? M.emoji2 : stickers.length === 3 ? M.emoji3 : M.emoji4;
      item.emojiSize = size;
      bw = stickers.length * size + (stickers.length - 1) * M.emojiGap;
      bh = size;
    } else {
      const maxTextW = M.rowMax - (me ? 0 : M.avatarD + M.avatarGapR) - (M.statusW + M.statusGap) - M.bubblePadX * 2;
      const lines = wrapText(ctx, m.content ?? [], maxTextW);
      item.lines = lines;
      const maxLineW = Math.max(...lines.map((line) => line.w));
      bw = Math.ceil(maxLineW) + M.bubblePadX * 2;
      bh = lines.length * M.lineH + M.bubblePadY * 2;
    }

    item.bx = me ? (M.W - M.chatPadX - bw) : leftX;
    item.by = y + nameH;
    item.bw = bw;
    item.bh = bh;
    item.h = nameH + bh + ((m.reactions?.length) ? M.reactMT + M.reactSize : 0);
    y += item.h;
    items.push(item);
  });

  layoutCache = { items, totalH: y + M.chatPadY };
  layoutKey = key;
  return layoutCache;
}

// ============================================================
//  スタンプ・絵文字画像
// ============================================================
function frameFor(anim: DecodedApng, ms: number, loop: boolean) {
  if (!loop && ms >= anim.totalMs) return anim.frames[anim.frames.length - 1].img;
  return animFrameAt(anim, Math.max(0, ms));
}

function drawStickerImage(
  ctx: CanvasRenderingContext2D,
  asset: RenderAsset | undefined,
  x: number, y: number, width: number, height: number,
  elapsedSec: number, loop: boolean,
  align: 'contain' | 'bottom' = 'contain',
) {
  if (!asset) return;
  const source = asset.anim ? frameFor(asset.anim, elapsedSec * 1000, loop) : asset.imgEl;
  const nw = asset.anim?.w ?? asset.imgEl.naturalWidth;
  const nh = asset.anim?.h ?? asset.imgEl.naturalHeight;
  if (!nw || !nh) return;
  const scale = Math.min(width / nw, height / nh);
  const iw = nw * scale;
  const ih = nh * scale;
  const oy = align === 'bottom' ? height - ih : (height - ih) / 2;
  ctx.drawImage(source, x + (width - iw) / 2, y + oy, iw, ih);
}

// ============================================================
//  外側(フレーム・のぞき見・背景) — legacy/mitemite_v1.html 由来
// ============================================================
function drawOuterBackground(ctx: CanvasRenderingContext2D, w: number, h: number, orient: 'v' | 'h', state: RenderState) {
  const { frameBg } = state.settings;
  if (frameBg.mode === 'image' && state.frameImage) {
    cover(ctx, state.frameImage, 0, 0, w, h);
    ctx.fillStyle = 'rgba(0,0,0,.30)';
    ctx.fillRect(0, 0, w, h);
    return;
  }
  if (frameBg.mode === 'color') {
    const c = frameBg.color;
    const bg = orient === 'v' ? ctx.createLinearGradient(0, 0, 0, h) : ctx.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, mix(c, '#ffffff', 0.16));
    bg.addColorStop(1, mix(c, '#000000', 0.38));
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    return;
  }
  if (orient === 'v') {
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, '#3a4656');
    bg.addColorStop(1, '#1d2530');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    const highlight = ctx.createRadialGradient(w / 2, 300, 80, w / 2, 300, 900);
    highlight.addColorStop(0, 'rgba(255,255,255,.07)');
    highlight.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = highlight;
    ctx.fillRect(0, 0, w, h);
  } else {
    const bg = ctx.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, mix('#9ab0d7', '#1c2733', 0.55));
    bg.addColorStop(1, mix('#9ab0d7', '#0e141c', 0.75));
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    for (const [cx, cy, r, a] of [[330, 260, 420, 0.10], [1640, 860, 480, 0.08]] as const) {
      const rg = ctx.createRadialGradient(cx, cy, 10, cx, cy, r);
      rg.addColorStop(0, `rgba(255,255,255,${a})`);
      rg.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = rg;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, 7);
      ctx.fill();
    }
  }
}

function drawVerticalFramed(ctx: CanvasRenderingContext2D, time: number, state: RenderState, opt: ChromeOptions) {
  drawOuterBackground(ctx, 1080, 1920, 'v', state);
  const px = 62, py = 32, pw = 956, ph = 1856, pr = 96;
  ctx.fillStyle = '#0a0b0e';
  roundRect(ctx, px + pw - 4, py + 430, 10, 150, 5); ctx.fill();
  roundRect(ctx, px - 6, py + 380, 10, 100, 5); ctx.fill();
  roundRect(ctx, px - 6, py + 500, 10, 100, 5); ctx.fill();
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,.5)';
  ctx.shadowBlur = 60;
  ctx.shadowOffsetY = 24;
  ctx.fillStyle = '#0c0d10';
  roundRect(ctx, px, py, pw, ph, pr); ctx.fill();
  ctx.restore();
  const inset = 13;
  ctx.save();
  roundRect(ctx, px + inset, py + inset, pw - inset * 2, ph - inset * 2, pr - inset);
  ctx.clip();
  drawTalk(ctx, px + inset, py + inset, pw - inset * 2, ph - inset * 2, time, state, opt);
  ctx.restore();
}

function drawHorizontalFramed(ctx: CanvasRenderingContext2D, time: number, state: RenderState, opt: ChromeOptions) {
  drawOuterBackground(ctx, 1920, 1080, 'h', state);
  const ph = 1010, pw = Math.round(ph * 956 / 1856);
  const px = Math.round((1920 - pw) / 2), py = Math.round((1080 - ph) / 2);
  const scale = ph / 1856, pr = Math.round(96 * scale);
  ctx.fillStyle = '#0a0b0e';
  roundRect(ctx, px + pw - 3, py + Math.round(430 * scale), 7, Math.round(150 * scale), 3); ctx.fill();
  roundRect(ctx, px - 4, py + Math.round(380 * scale), 7, Math.round(100 * scale), 3); ctx.fill();
  roundRect(ctx, px - 4, py + Math.round(500 * scale), 7, Math.round(100 * scale), 3); ctx.fill();
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,.5)';
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 14;
  ctx.fillStyle = '#0c0d10';
  roundRect(ctx, px, py, pw, ph, pr); ctx.fill();
  ctx.restore();
  const inset = Math.max(7, Math.round(13 * scale));
  ctx.save();
  roundRect(ctx, px + inset, py + inset, pw - inset * 2, ph - inset * 2, pr - inset);
  ctx.clip();
  drawTalk(ctx, px + inset, py + inset, pw - inset * 2, ph - inset * 2, time, state, opt);
  ctx.restore();
}

function drawHorizontalPeek(ctx: CanvasRenderingContext2D, time: number, state: RenderState, opt: ChromeOptions) {
  drawOuterBackground(ctx, 1920, 1080, 'h', state);
  const scale = 1.16;
  const colW = Math.round(M.W * scale);
  const colX = Math.round((1920 - colW) / 2);
  const bez = Math.round(colW * 0.022);
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,.55)';
  ctx.shadowBlur = 70;
  ctx.fillStyle = '#0c0d10';
  ctx.fillRect(colX - bez, 0, colW + bez * 2, 1080);
  ctx.restore();
  ctx.fillStyle = '#0a0b0e';
  const bw = Math.max(5, Math.round(bez * 0.75));
  roundRect(ctx, colX + colW, 1080 * 0.33, bw, 1080 * 0.10, 3); ctx.fill();
  roundRect(ctx, colX - bw, 1080 * 0.29, bw, 1080 * 0.065, 3); ctx.fill();
  roundRect(ctx, colX - bw, 1080 * 0.38, bw, 1080 * 0.065, 3); ctx.fill();
  ctx.save();
  ctx.beginPath();
  ctx.rect(colX, 0, colW, 1080);
  ctx.clip();
  drawTalk(ctx, colX, 0, colW, 1080, time, state, opt);
  ctx.restore();
}

// ============================================================
//  トーク画面(DOM再現)
// ============================================================
function wallpaperInk(settings: AppSettings) {
  // DOMヘッダーと同じ: default=黒 / image=白 / 単色=輝度判定
  if (settings.backgroundColor === 'default') return 'black';
  if (settings.backgroundColor === 'image') return 'white';
  return getContrastColor(settings.backgroundColor);
}

function metaInk(settings: AppSettings) {
  // DOMのMessageBubbleと同一条件(既読・時刻の色)
  return (settings.backgroundColor === 'default' || settings.backgroundColor === 'white') ? '#6b7280' : 'white';
}

function drawWallpaper(ctx: CanvasRenderingContext2D, w: number, h: number, state: RenderState) {
  const { settings } = state;
  if (settings.backgroundColor === 'image' && state.wallImage) {
    cover(ctx, state.wallImage, 0, 0, w, h);
    return;
  }
  if (settings.backgroundColor !== 'default' && settings.backgroundColor !== 'image') {
    ctx.fillStyle = settings.backgroundColor;
    ctx.fillRect(0, 0, w, h);
    return;
  }
  const gradient = ctx.createLinearGradient(0, 0, 0, h);
  gradient.addColorStop(0, '#93aad4');   // DOMのDEFAULT_SKY_BGと同じ
  gradient.addColorStop(1, '#9ab0d7');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);
}

function drawIconAt(ctx: CanvasRenderingContext2D, name: string, color: string, x: number, y: number, size: number, rotate = 0) {
  const icon = getIcon(name, color);
  if (!icon) return;
  if (rotate === 0) {
    ctx.drawImage(icon, x, y, size, size);
    return;
  }
  ctx.save();
  ctx.translate(x + size / 2, y + size / 2);
  ctx.rotate(rotate);
  ctx.drawImage(icon, -size / 2, -size / 2, size, size);
  ctx.restore();
}

function drawAvatar(ctx: CanvasRenderingContext2D, x: number, y: number) {
  // DOMのOPPONENT_AVATAR_SVG(グレー丸+白い人型)を再現
  const d = M.avatarD;
  ctx.save();
  ctx.beginPath();
  ctx.arc(x + d / 2, y + d / 2, d / 2, 0, 7);
  ctx.clip();
  ctx.fillStyle = '#A0A8B0';
  ctx.fillRect(x, y, d, d);
  ctx.fillStyle = '#F1F2F4';
  ctx.beginPath();
  ctx.arc(x + d / 2, y + d * 0.4, d * 0.14, 0, 7);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + d / 2, y + d * 0.92, d * 0.3, 0, 7);
  ctx.fill();
  ctx.restore();
}

function formatTime(timestamp: Date) {
  return new Date(timestamp).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function drawMessage(ctx: CanvasRenderingContext2D, item: LayoutItem, p: number, dt: number, state: RenderState) {
  const { m, me } = item;
  const { settings } = state;
  const eased = easeOut(p);

  ctx.save();
  // DOMのmotion(opacity 0→1, x ±20, scale 0.9→1)を再現。基点は吹き出し中心
  ctx.globalAlpha = p;
  const cx = item.bx + item.bw / 2;
  const cy = item.by + item.bh / 2;
  const scale = 0.9 + 0.1 * eased;
  const offsetX = (me ? 1 : -1) * 40 * (1 - eased);
  ctx.translate(cx + offsetX, cy);
  ctx.scale(scale, scale);
  ctx.translate(-cx, -cy);

  // アバター(受信・シーケンス先頭のみ)
  if (!me && item.first) drawAvatar(ctx, M.chatPadX, item.y + M.avatarMT);

  // 名前
  if (item.nameH > 0) {
    ctx.fillStyle = '#6b7280';
    ctx.font = `${M.nameFont}px ${FONT}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(settings.opponentName, item.bx + 2, item.y + M.nameFont);
  }

  const stickers = (m.content ?? []).filter((c): c is Sticker => typeof c !== 'string');
  const loop = settings.loopAnimations;

  if (m.type === 'sticker') {
    drawStickerImage(ctx, stickers[0] && state.assets.get(stickers[0].id), item.bx, item.by, item.bw, item.bh, dt, loop);
  } else if (m.type === 'emoji-combined') {
    const size = item.emojiSize ?? M.emoji4;
    stickers.forEach((sticker, index) => {
      drawStickerImage(ctx, state.assets.get(sticker.id), item.bx + index * (size + M.emojiGap), item.by, size, size, dt, loop, 'bottom');
    });
  } else {
    // テキスト吹き出し
    ctx.fillStyle = me ? '#A9E97A' : '#ffffff';
    roundRect(ctx, item.bx, item.by, item.bw, item.bh, M.bubbleRadius);
    ctx.fill();
    if (!me) {
      ctx.strokeStyle = '#f3f4f6';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    // しっぽ(DOM: top-1 の位置に ±3px はみ出す 8px 三角)
    ctx.beginPath();
    if (me) {
      ctx.moveTo(item.bx + item.bw - M.tailSize + M.tailOut, item.by + M.tailTop);
      ctx.lineTo(item.bx + item.bw + M.tailOut, item.by + M.tailTop);
      ctx.lineTo(item.bx + item.bw - M.tailSize + M.tailOut, item.by + M.tailTop + M.tailSize);
      ctx.fillStyle = '#A9E97A';
    } else {
      ctx.moveTo(item.bx - M.tailOut, item.by + M.tailTop);
      ctx.lineTo(item.bx + M.tailSize - M.tailOut, item.by + M.tailTop);
      ctx.lineTo(item.bx + M.tailSize - M.tailOut, item.by + M.tailTop + M.tailSize);
      ctx.fillStyle = '#ffffff';
    }
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#000000';
    ctx.font = `500 ${M.textFont}px ${FONT}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    (item.lines ?? []).forEach((line, lineIndex) => {
      let x = item.bx + M.bubblePadX;
      const lineCy = item.by + M.bubblePadY + M.lineH * (lineIndex + 0.5);
      let run = '';
      const flush = () => {
        if (!run) return;
        ctx.fillText(run, x, lineCy);
        x += ctx.measureText(run).width;
        run = '';
      };
      for (const atom of line.atoms) {
        if ('ch' in atom) {
          run += atom.ch;
        } else {
          flush();
          drawStickerImage(ctx, state.assets.get(atom.sticker.id), x + M.inlineEmojiMx, lineCy - M.inlineEmoji / 2, M.inlineEmoji, M.inlineEmoji, dt, loop);
          x += M.inlineEmoji + M.inlineEmojiMx * 2;
        }
      }
      flush();
    });
  }

  // ☆マーク(送信スタンプのみ・DOMと同じ)
  if (me && m.type === 'sticker' && !m.isEmoji && settings.showStar) {
    const starCx = item.bx - M.statusGap - M.starD / 2;
    const starCy = item.by + item.bh / 2;
    ctx.fillStyle = '#7b92b4';
    ctx.beginPath();
    ctx.arc(starCx, starCy, M.starD / 2, 0, 7);
    ctx.fill();
    drawIconAt(ctx, 'star', 'white', starCx - M.starIcon / 2, starCy - M.starIcon / 2, M.starIcon);
  }

  // 既読・時刻(吹き出し下端揃え)
  ctx.fillStyle = metaInk(settings);
  ctx.font = `${M.metaFont}px ${FONT}`;
  ctx.textBaseline = 'alphabetic';
  const time = formatTime(m.timestamp);
  if (me) {
    ctx.textAlign = 'right';
    const tx = item.bx - M.statusGap;
    if (settings.showReadStatus) {
      ctx.fillText(`既読${settings.readCount > 0 ? ` ${settings.readCount}` : ''}`, tx, item.by + item.bh - M.metaMB - M.metaFont - 4);
    }
    ctx.fillText(time, tx, item.by + item.bh - M.metaMB);
  } else {
    ctx.textAlign = 'left';
    ctx.fillText(time, item.bx + item.bw + M.statusGap, item.by + item.bh - M.metaMB);
  }

  // リアクション(吹き出し下・送信=右寄せ/受信=左寄せ)
  const reactions = m.reactions ?? [];
  if (reactions.length) {
    const totalW = reactions.length * M.reactSize + (reactions.length - 1) * M.reactGap;
    let rx = me ? item.bx + item.bw - totalW : item.bx;
    const ry = item.by + item.bh + M.reactMT;
    for (const reaction of reactions) {
      drawStickerImage(ctx, state.assets.get(reaction.id), rx, ry, M.reactSize, M.reactSize, dt, loop);
      rx += M.reactSize + M.reactGap;
    }
  }
  ctx.restore();
}

function drawHeader(ctx: CanvasRenderingContext2D, state: RenderState) {
  const ink = wallpaperInk(state.settings);
  const cy = M.headerPadTop + (M.headerH - M.headerPadTop) / 2;
  drawIconAt(ctx, 'chevron-left', ink, M.headerPadX, cy - M.headerBackIcon / 2, M.headerBackIcon);
  ctx.fillStyle = ink;
  ctx.font = `bold ${M.headerNameFont}px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  const nameX = M.headerPadX + M.headerBackIcon + M.headerIconGap;
  const iconsW = 4 * M.headerIcon + 3 * M.headerIconGap;
  ctx.fillText(state.settings.opponentName, nameX, cy + 2, M.W - nameX - iconsW - M.headerPadX - 24);
  ctx.save();
  ctx.globalAlpha = 0.8;
  let ix = M.W - M.headerPadX - iconsW;
  for (const name of ['search', 'phone', 'calendar', 'menu']) {
    drawIconAt(ctx, name, ink, ix, cy - M.headerIcon / 2, M.headerIcon);
    ix += M.headerIcon + M.headerIconGap;
  }
  ctx.restore();
}

function drawInputBar(ctx: CanvasRenderingContext2D, top: number) {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, top, M.W, M.inputH);
  ctx.strokeStyle = '#f3f4f6';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, top);
  ctx.lineTo(M.W, top);
  ctx.stroke();

  const cy = top + M.inputH / 2;
  drawIconAt(ctx, 'chevron-left', '#9ca3af', M.inputPad, cy - M.inputChevron / 2, M.inputChevron, Math.PI);
  const fieldX = M.inputPad + M.inputChevron + M.inputGap;
  const fieldW = M.W - fieldX - M.inputGap - M.sendIcon - M.inputPad;
  ctx.fillStyle = '#F1F2F4';
  roundRect(ctx, fieldX, cy - M.fieldH / 2, fieldW, M.fieldH, M.fieldRadius);
  ctx.fill();
  ctx.fillStyle = '#9ca3af';
  ctx.font = `${M.placeholderFont}px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('メッセージを入力', fieldX + M.fieldPadX, cy + 2);
  drawIconAt(ctx, 'smile', '#6b7280', fieldX + fieldW - M.fieldPadX - M.smileIcon, cy - M.smileIcon / 2, M.smileIcon);
  drawIconAt(ctx, 'send', '#d1d5db', M.W - M.inputPad - M.sendIcon, cy - M.sendIcon / 2, M.sendIcon);
}

function drawPanel(ctx: CanvasRenderingContext2D, top: number, dt: number, state: RenderState) {
  const { settings } = state;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, top, M.W, M.panelH);
  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, top);
  ctx.lineTo(M.W, top);
  ctx.stroke();

  // 切替バー(スタンプ/絵文字ピル + グループタブ + 歯車)
  const isSticker = settings.videoPanelTab === 'sticker';
  const pillW = M.pillPadX * 2 + M.pillIcon * 2 - M.pillOverlap;
  const pillY = top + (M.switcherH - M.pillH) / 2;
  ctx.fillStyle = '#2D3340';
  roundRect(ctx, M.switcherPadL, pillY, pillW, M.pillH, M.pillH / 2);
  ctx.fill();
  const iconY = pillY + (M.pillH - M.pillIcon) / 2;
  ctx.save();
  ctx.globalAlpha = isSticker ? 1 : 0.3;
  drawIconAt(ctx, 'smile', 'white', M.switcherPadL + M.pillPadX, iconY, M.pillIcon * (isSticker ? 1.1 : 0.9));
  ctx.restore();
  ctx.save();
  ctx.globalAlpha = isSticker ? 0.3 : 1;
  drawIconAt(ctx, 'emoji-cat', 'white', M.switcherPadL + M.pillPadX + M.pillIcon - M.pillOverlap, iconY, M.pillIcon * (isSticker ? 0.9 : 1.1));
  ctx.restore();

  const groups = isSticker ? state.stickerGroups : state.emojiGroups;
  const activeId = isSticker ? state.activeStickerGroupId : state.activeEmojiGroupId;
  const activeGroup = groups.find((group) => group.id === activeId) ?? groups[0];

  let tabX = M.switcherPadL + pillW + M.tabsAfterPill;
  const gearX = M.W - 24 - M.gearIcon;
  ctx.save();
  ctx.beginPath();
  ctx.rect(tabX, top, gearX - tabX - 12, M.switcherH);
  ctx.clip();
  for (const group of groups) {
    const active = group.id === activeGroup?.id;
    if (active) {
      ctx.fillStyle = '#f3f4f6';
      roundRect(ctx, tabX, top + 8, M.tabW, M.switcherH - 8, [16, 16, 0, 0]);
      ctx.fill();
    }
    ctx.save();
    if (!active) ctx.globalAlpha = 0.4;
    const tab = group.tabSticker;
    const tabAsset = tab ? state.assets.get(tab.id) : undefined;
    if (tabAsset) {
      drawStickerImage(ctx, tabAsset, tabX + (M.tabW - M.tabImg) / 2, top + (M.switcherH - M.tabImg) / 2, M.tabImg, M.tabImg, 0, false);
    } else {
      drawIconAt(ctx, 'image', '#9ca3af', tabX + (M.tabW - 36) / 2, top + (M.switcherH - 36) / 2, 36);
    }
    ctx.restore();
    tabX += M.tabW + M.tabGap;
  }
  ctx.restore();
  drawIconAt(ctx, 'settings', '#9ca3af', gearX, top + (M.switcherH - M.gearIcon) / 2, M.gearIcon);
  ctx.strokeStyle = '#f3f4f6';
  ctx.beginPath();
  ctx.moveTo(0, top + M.switcherH);
  ctx.lineTo(M.W, top + M.switcherH);
  ctx.stroke();

  // グリッド
  const gridTop = top + M.switcherH + M.gridPad;
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, gridTop, M.W, top + M.panelH - M.panelBottomPad - gridTop);
  ctx.clip();
  if (!activeGroup) {
    ctx.fillStyle = '#9ca3af';
    ctx.font = `24px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${isSticker ? 'スタンプ' : '絵文字'}がありません`, M.W / 2, gridTop + 120);
  } else {
    const cols = isSticker ? 5 : 9;
    const gap = isSticker ? M.gridGapSticker : M.gridGapEmoji;
    const cell = (M.W - M.gridPad * 2 - (cols - 1) * gap) / cols;
    activeGroup.stickers.forEach((sticker, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = M.gridPad + col * (cell + gap);
      const y = gridTop + row * (cell + gap);
      if (y > top + M.panelH) return;
      drawStickerImage(ctx, state.assets.get(sticker.id), x + M.cellPad, y + M.cellPad, cell - M.cellPad * 2, cell - M.cellPad * 2, dt, state.settings.loopAnimations);
    });
  }
  ctx.restore();
}

function drawHomeBar(ctx: CanvasRenderingContext2D, top: number) {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, top, M.W, M.homeH);
  ctx.fillStyle = 'rgba(0,0,0,.2)';
  roundRect(ctx, (M.W - M.homePillW) / 2, top + (M.homeH - M.homePillH) / 2, M.homePillW, M.homePillH, M.homePillH / 2);
  ctx.fill();
}

function drawTalk(
  ctx: CanvasRenderingContext2D,
  sx: number, sy: number, sw: number, sh: number,
  time: number, state: RenderState, opt: ChromeOptions,
) {
  const k = sw / M.W;
  ctx.save();
  ctx.translate(sx, sy);
  ctx.scale(k, k);
  const vh = sh / k;

  const headerH = opt.chrome ? M.headerH : 0;
  const inputH = opt.chrome ? M.inputH : 0;
  const homeH = opt.chrome ? M.homeH : 0;
  const panelH = opt.panel ? M.panelH : 0;
  const chatTop = headerH;
  const chatBottom = vh - inputH - panelH - homeH;
  const chatH = chatBottom - chatTop;

  // 壁紙(ヘッダー+トーク面に連続。DOMと同じ)
  drawWallpaper(ctx, M.W, chatBottom, state);

  // ---- メッセージ ----
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, chatTop, M.W, chatH);
  ctx.clip();

  const layout = computeLayout(ctx, state);
  const { timeline } = state;
  let visible = 0;
  for (const event of timeline.evs) {
    if (time >= event.t) visible += 1;
  }
  const targetFor = (n: number) => {
    if (n <= 0) return 0;
    const item = layout.items[n - 1];
    if (!item) return 0;
    return Math.max(0, item.y + item.h + M.chatPadY - chatH);
  };
  let scroll = targetFor(visible);
  if (visible > 0) {
    const event = timeline.evs[visible - 1];
    const p = clamp((time - event.t) / SCROLL_SEC, 0, 1);
    scroll = targetFor(visible - 1) + (targetFor(visible) - targetFor(visible - 1)) * easeOut(p);
  }
  ctx.translate(0, chatTop - scroll);

  for (let index = 0; index < visible; index += 1) {
    const event = timeline.evs[index];
    const item = layout.items[index];
    if (!item) continue;
    const p = clamp((time - event.t) / APPEAR_SEC, 0, 1);
    drawMessage(ctx, item, p, time - event.t, state);
  }
  ctx.restore();

  if (opt.chrome) {
    drawHeader(ctx, state);
    drawInputBar(ctx, chatBottom);
    if (opt.panel) drawPanel(ctx, chatBottom + M.inputH, time, state);
    drawHomeBar(ctx, vh - M.homeH);
  }
  ctx.restore();
}

// ============================================================
//  エントリポイント
// ============================================================
export function drawFrame(canvas: HTMLCanvasElement, time: number, state: RenderState) {
  const { settings } = state;
  const vertical = settings.format === 'v';
  const width = vertical ? 1080 : 1920;
  const height = vertical ? 1920 : 1080;
  if (canvas.width !== width) canvas.width = width;
  if (canvas.height !== height) canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, width, height);

  if (vertical) {
    const opt: ChromeOptions = { chrome: true, panel: settings.videoPanel };
    if (settings.vFullscreen) drawTalk(ctx, 0, 0, 1080, 1920, time, state, opt);
    else drawVerticalFramed(ctx, time, state, opt);
    return;
  }
  if (settings.hMode === 'full') {
    // 横型・全画面: ヘッダー(相手の名前)・入力欄・パネルは描かない(トーク面のみ)
    drawTalk(ctx, 0, 0, 1920, 1080, time, state, { chrome: false, panel: false });
  } else if (settings.hMode === 'frame') {
    drawHorizontalFramed(ctx, time, state, { chrome: true, panel: settings.videoPanel });
  } else {
    // のぞき見: 中央カラム+左右ベゼル。ヘッダー/入力欄あり・パネルなし
    drawHorizontalPeek(ctx, time, state, { chrome: true, panel: false });
  }
}
