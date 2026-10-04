import React from 'react';
import { Sticker } from '../types';
import { decodeAPNG } from '../render/apng';

// Cache by source URL so switching groups does not decode thumbnails again.
const thumbnails = new Map<string, Promise<string>>();

function firstFrame(sticker: Sticker): Promise<string> {
  const cached = thumbnails.get(sticker.url);
  if (cached) return cached;
  const result = (async () => {
    const blob = sticker.blob ?? await (await fetch(sticker.url)).blob();
    const animation = await decodeAPNG(await blob.arrayBuffer(), true);
    return animation ? animation.frames[0].img.toDataURL('image/png') : sticker.url;
  })();
  thumbnails.set(sticker.url, result);
  result.catch(() => thumbnails.delete(sticker.url));
  return result;
}

/** Picker images stay on the first animation frame, independently of playback. */
export function StickerThumbnail({ sticker, className, alt = sticker.name }: {
  sticker: Sticker; className?: string; alt?: string;
}) {
  const [thumbnail, setThumbnail] = React.useState<{ url: string; src: string } | null>(null);
  React.useEffect(() => {
    let cancelled = false;
    firstFrame(sticker).then((src) => {
      if (!cancelled) setThumbnail({ url: sticker.url, src });
    }).catch((error) => console.error('Failed to create sticker thumbnail', error));
    return () => { cancelled = true; };
  }, [sticker.url, sticker.blob]);
  if (thumbnail?.url !== sticker.url) return null;
  return <img src={thumbnail.src} alt={alt} className={className} referrerPolicy="no-referrer" />;
}
