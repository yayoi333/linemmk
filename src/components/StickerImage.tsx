import React from 'react';
import { Sticker } from '../types';

interface StickerImageProps {
  sticker: Sticker;
  /** 連続再生ON時は無限ループ版のURLで表示する */
  loop: boolean;
  /** 親からの「もう1回」トリガー。値が変わると再生し直す */
  replayNonce?: number;
  className?: string;
  alt?: string;
  draggable?: boolean;
}

/**
 * スタンプ・絵文字表示用のimg。
 * 有限ループのAPNGは同じURLのままだと再生し直せないため、
 * 再生時に毎回新しいObject URLを作り直してアニメーションを最初から再生する。
 */
export const StickerImage: React.FC<StickerImageProps> = ({
  sticker,
  loop,
  replayNonce = 0,
  className,
  alt = '',
  draggable
}) => {
  const [replaySrc, setReplaySrc] = React.useState<string | null>(null);
  // loopUrlがある = 有限ループのAPNG(再生し直す意味があるもの)
  const canReplay = !!sticker.isAnimated && !!sticker.loopUrl;
  const looping = loop && !!sticker.loopUrl;

  const replay = React.useCallback(async () => {
    try {
      const res = await fetch(sticker.url);
      const blob = await res.blob();
      setReplaySrc(URL.createObjectURL(blob));
    } catch (err) {
      console.error('Failed to replay sticker animation', err);
    }
  }, [sticker.url]);

  // 前回のObject URLを解放する(値が変わった時とアンマウント時)
  React.useEffect(() => {
    if (!replaySrc) return;
    return () => URL.revokeObjectURL(replaySrc);
  }, [replaySrc]);

  // 前回値と比較することで、StrictModeのeffect二重実行でも誤発火しない
  const lastNonce = React.useRef(replayNonce);
  React.useEffect(() => {
    if (lastNonce.current === replayNonce) return;
    lastNonce.current = replayNonce;
    if (canReplay && !looping) {
      replay();
    }
  }, [replayNonce, canReplay, looping, replay]);

  const handleClick = canReplay && !looping ? () => { replay(); } : undefined;
  const src = looping ? sticker.loopUrl! : (replaySrc ?? sticker.url);

  return (
    <img
      src={src}
      alt={alt}
      className={`${className ?? ''}${handleClick ? ' cursor-pointer' : ''}`}
      draggable={draggable}
      referrerPolicy="no-referrer"
      title={handleClick ? 'タップでもう1回再生' : undefined}
      onClick={handleClick}
    />
  );
};
