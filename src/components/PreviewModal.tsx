import { useEffect, useRef, useState } from 'react';
import { AppSettings, Message, StickerGroup } from '../types';
import { drawFrame, RenderState } from '../render/engine';
import { loadCanvasImage, prepareRenderAssets, RenderAsset } from '../render/prepare';
import { buildTimeline } from '../render/timeline';
import { preloadIcons } from '../render/icons';
import { ensureAudio, sfxReceive, sfxSend } from '../render/sound';
import { exportVideo } from '../render/exporter';
import { ExportOverlay } from './ExportOverlay';

interface PreviewModalProps { open: boolean; onClose: () => void; autoExport: boolean; onAutoExportHandled: () => void; settings: AppSettings; messages: Message[]; stickerGroups: StickerGroup[]; emojiGroups: StickerGroup[]; activeStickerGroupId: string | null; activeEmojiGroupId: string | null; }

export function PreviewModal(props: PreviewModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null); const frameRef = useRef<number | null>(null); const nodesRef = useRef<AudioScheduledSourceNode[]>([]); const [assets, setAssets] = useState<Map<string, RenderAsset>>(new Map()); const [wallImage, setWallImage] = useState<HTMLImageElement | null>(null); const [frameImage, setFrameImage] = useState<HTMLImageElement | null>(null); const [playing, setPlaying] = useState(false); const [loading, setLoading] = useState(false); const [ready, setReady] = useState(false); const [exporting, setExporting] = useState(false); const [progress, setProgress] = useState(0);
  const timeline = buildTimeline(props.messages, props.settings.introGap);
  const state = (): RenderState => ({ settings: props.settings, messages: props.messages, timeline, assets, stickerGroups: props.stickerGroups, emojiGroups: props.emojiGroups, activeStickerGroupId: props.activeStickerGroupId, activeEmojiGroupId: props.activeEmojiGroupId, wallImage, frameImage });
  const paint = (time: number) => { if (canvasRef.current) drawFrame(canvasRef.current, time, state()); };
  useEffect(() => { if (!props.open) return; let disposed = false; setReady(false); setLoading(true); void Promise.all([prepareRenderAssets(props.messages, [...props.stickerGroups, ...props.emojiGroups]), loadCanvasImage(props.settings.backgroundImage), loadCanvasImage(props.settings.frameBg.imgUrl), preloadIcons(), document.fonts.ready]).then(([nextAssets, nextWall, nextFrame]) => { if (disposed) return; setAssets(nextAssets); setWallImage(nextWall); setFrameImage(nextFrame); setReady(true); setLoading(false); }).catch((error) => { console.error(error); setLoading(false); }); return () => { disposed = true; }; }, [props.open, props.messages, props.stickerGroups, props.emojiGroups, props.settings.backgroundImage, props.settings.frameBg.imgUrl]);
  useEffect(() => { if (props.open && !loading) paint(timeline.dur); }, [props.open, loading, assets, wallImage, frameImage, timeline.dur]);
  const stop = () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); for (const node of nodesRef.current) { try { node.stop(); } catch { /* already stopped */ } } nodesRef.current = []; setPlaying(false); paint(timeline.dur); };
  useEffect(() => () => stop(), []);
  const play = () => { if (playing) { stop(); return; } const audio = ensureAudio(); const start = audio.currentTime + .1; if (props.settings.sound) nodesRef.current = timeline.evs.map((event) => event.m.sender === 'me' ? sfxSend(audio, audio.destination, start + event.t) : sfxReceive(audio, audio.destination, start + event.t)); setPlaying(true); const loop = () => { const time = audio.currentTime - start; paint(Math.max(0, Math.min(time, timeline.dur))); if (time >= timeline.dur) { stop(); return; } frameRef.current = requestAnimationFrame(loop); }; frameRef.current = requestAnimationFrame(loop); };
  const writeVideo = async () => {
    if (!canvasRef.current || loading || exporting) return;
    stop();
    setProgress(0);
    setExporting(true);
    try { await exportVideo({ canvas: canvasRef.current, state: state(), timeline, onProgress: setProgress }); }
    catch (error) { console.error(error); alert(error instanceof Error ? error.message : '動画の書き出しに失敗しました。'); }
    finally { setExporting(false); paint(timeline.dur); }
  };
  useEffect(() => { if (props.open && props.autoExport && ready && !loading && !exporting) { props.onAutoExportHandled(); void writeVideo(); } }, [props.autoExport, props.open, ready, loading, exporting]);
  if (!props.open) return null;
  const disabled = loading || exporting;
  return <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4 bg-black/90 p-5"><div className="relative"><canvas ref={canvasRef} className="max-h-[80vh] max-w-[90vw] rounded-lg bg-black shadow-2xl" />{exporting && <ExportOverlay progress={progress} />}</div><div className="flex flex-wrap justify-center gap-2"><button type="button" disabled={disabled} onClick={play} className="rounded-xl bg-[#06C755] px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{playing ? '⏹ 停止' : '▶ 再生'}</button><button type="button" disabled={disabled} onClick={() => void writeVideo()} className="rounded-xl bg-slate-700 px-5 py-3 text-sm font-bold text-white disabled:opacity-50">🎬 書き出す</button><button type="button" disabled={exporting} onClick={() => { stop(); props.onClose(); }} className="rounded-xl bg-white/15 px-5 py-3 text-sm font-bold text-white disabled:opacity-50">✕ 閉じる</button></div>{loading && <p className="text-sm text-white/80">素材を準備しています…</p>}</div>;
}
