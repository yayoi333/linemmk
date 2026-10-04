import { Message, Sticker, StickerGroup } from '../types';
import { decodeAPNG, DecodedApng } from './apng';

export interface RenderAsset { imgEl: HTMLImageElement; anim: DecodedApng | null; }
const cache = new Map<string, RenderAsset>();

async function loadAsset(sticker: Sticker): Promise<RenderAsset | null> {
  const cached = cache.get(sticker.id); if (cached) return cached;
  const imgEl = new Image(); imgEl.src = sticker.url;
  await new Promise<void>((resolve, reject) => { imgEl.onload = () => resolve(); imgEl.onerror = () => reject(new Error(`${sticker.name} を読み込めませんでした。`)); });
  let anim: DecodedApng | null = null;
  try { anim = await decodeAPNG(await (await fetch(sticker.url)).arrayBuffer()); } catch { /* 静止画像はそのまま描画 */ }
  const asset = { imgEl, anim }; cache.set(sticker.id, asset); return asset;
}

export async function prepareRenderAssets(messages: Message[], groups: StickerGroup[]): Promise<Map<string, RenderAsset>> {
  const stickers = new Map<string, Sticker>();
  for (const group of groups) {
    if (group.tabSticker) stickers.set(group.tabSticker.id, group.tabSticker); // パネルのタブ画像
    for (const sticker of group.stickers) stickers.set(sticker.id, sticker);
  }
  for (const message of messages) { for (const item of message.content ?? []) if (typeof item !== 'string') stickers.set(item.id, item); for (const reaction of message.reactions ?? []) stickers.set(reaction.id, reaction); }
  await Promise.all([...stickers.values()].map(async (sticker) => { try { await loadAsset(sticker); } catch (error) { console.warn(error); } }));
  return cache;
}

export async function loadCanvasImage(url: string | null): Promise<HTMLImageElement | null> {
  if (!url) return null;
  const image = new Image(); image.src = url;
  try { await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error('画像を読み込めませんでした。')); }); return image; } catch { return null; }
}
