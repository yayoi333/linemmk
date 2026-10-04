import { ArrayBufferTarget, Muxer } from 'mp4-muxer';
import { drawFrame, RenderState } from './engine';
import { sfxReceive, sfxSend } from './sound';
import { Timeline } from './timeline';

export interface ExportOptions {
  canvas: HTMLCanvasElement;
  state: RenderState;
  timeline: Timeline;
  onProgress: (percent: number) => void;
}

export interface ExportResult { format: 'mp4' | 'webm'; size: number; duration: number; }

const hasWebCodecs = () => typeof VideoEncoder !== 'undefined'
  && typeof AudioEncoder !== 'undefined'
  && typeof OfflineAudioContext !== 'undefined';

const download = (blob: Blob, format: 'mp4' | 'webm', vertical: boolean) => {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `mitemitekun_${vertical ? 'tate' : 'yoko'}_${Date.now()}.${format}`;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(link.href), 8_000);
};

const yieldNow = () => new Promise<void>((resolve) => {
  const channel = new MessageChannel();
  channel.port1.onmessage = () => resolve();
  channel.port2.postMessage(undefined);
});

const draw = ({ canvas, state }: ExportOptions, time: number) => drawFrame(canvas, time, state);

export async function exportVideo(options: ExportOptions): Promise<ExportResult> {
  if (hasWebCodecs()) {
    try { return await exportDeterministic(options); }
    catch (error) { console.error('[export/webcodecs] failed -> fallback', error); }
  }
  return exportRealtime(options);
}

async function exportDeterministic(options: ExportOptions): Promise<ExportResult> {
  const { canvas, state, timeline, onProgress } = options;
  const fps = 30;
  draw(options, 0);
  const width = canvas.width;
  const height = canvas.height;
  const totalFrames = Math.max(1, Math.ceil(timeline.dur * fps));
  const target = new ArrayBufferTarget();
  const muxer = new Muxer({
    target,
    video: { codec: 'avc', width, height, frameRate: fps },
    ...(state.settings.sound ? { audio: { codec: 'aac' as const, sampleRate: 48_000, numberOfChannels: 2 } } : {}),
    fastStart: 'in-memory',
  });

  if (state.settings.sound) await encodeAudio(muxer, timeline, onProgress);
  const encoder = new VideoEncoder({
    output: (chunk, metadata) => muxer.addVideoChunk(chunk, metadata),
    error: (error) => console.error('[video encoder]', error),
  });
  encoder.configure({ codec: 'avc1.640028', width, height, bitrate: 10_000_000, framerate: fps });
  const waitDequeue = () => new Promise<void>((resolve) => encoder.addEventListener('dequeue', () => resolve(), { once: true }));

  for (let index = 0; index < totalFrames; index += 1) {
    draw(options, index / fps);
    const frame = new VideoFrame(canvas, { timestamp: Math.round(index / fps * 1_000_000), duration: Math.round(1_000_000 / fps) });
    encoder.encode(frame, { keyFrame: index % (fps * 2) === 0 });
    frame.close();
    while (encoder.encodeQueueSize > 6) await waitDequeue();
    if (index % 6 === 0) { onProgress(Math.round(index / totalFrames * 100)); await yieldNow(); }
  }
  await encoder.flush();
  encoder.close();
  muxer.finalize();
  onProgress(100);
  const blob = new Blob([target.buffer], { type: 'video/mp4' });
  download(blob, 'mp4', state.settings.format === 'v');
  return { format: 'mp4', size: blob.size, duration: timeline.dur };
}

async function encodeAudio(muxer: Muxer<ArrayBufferTarget>, timeline: Timeline, onProgress: (percent: number) => void) {
  const sampleRate = 48_000;
  const context = new OfflineAudioContext(2, Math.ceil(timeline.dur * sampleRate), sampleRate);
  const gain = context.createGain();
  gain.gain.value = .9;
  gain.connect(context.destination);
  for (const event of timeline.evs) (event.m.sender === 'me' ? sfxSend : sfxReceive)(context, gain, event.t);
  const audio = await context.startRendering();
  const encoder = new AudioEncoder({ output: (chunk, metadata) => muxer.addAudioChunk(chunk, metadata), error: (error) => console.error('[audio encoder]', error) });
  encoder.configure({ codec: 'mp4a.40.2', sampleRate, numberOfChannels: 2, bitrate: 192_000 });
  const left = audio.getChannelData(0);
  const right = audio.numberOfChannels > 1 ? audio.getChannelData(1) : left;
  const step = 4_800;
  for (let offset = 0; offset < audio.length; offset += step) {
    const frames = Math.min(step, audio.length - offset);
    const data = new Float32Array(frames * 2);
    data.set(left.subarray(offset, offset + frames));
    data.set(right.subarray(offset, offset + frames), frames);
    const chunk = new AudioData({ format: 'f32-planar', sampleRate, numberOfFrames: frames, numberOfChannels: 2, timestamp: Math.round(offset / sampleRate * 1_000_000), data });
    encoder.encode(chunk);
    chunk.close();
    if (offset % (step * 5) === 0) onProgress(Math.min(15, Math.round(offset / audio.length * 15)));
  }
  await encoder.flush();
  encoder.close();
}

function pickMime() {
  const candidates = ['video/mp4;codecs=avc1.640028,mp4a.40.2', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm'];
  return candidates.find((candidate) => typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(candidate)) ?? '';
}

function exportRealtime(options: ExportOptions): Promise<ExportResult> {
  const mime = pickMime();
  if (!mime) return Promise.reject(new Error('このブラウザは動画書き出しに対応していません。Chrome/Edge最新版で開いてください。'));
  const { canvas, state, timeline, onProgress } = options;
  draw(options, 0);
  const stream = canvas.captureStream(60);
  const audio = new AudioContext();
  const gain = audio.createGain();
  gain.gain.value = .9;
  gain.connect(audio.destination);
  let mediaDestination: MediaStreamAudioDestinationNode | null = null;
  if (state.settings.sound) {
    mediaDestination = audio.createMediaStreamDestination();
    gain.connect(mediaDestination);
    for (const track of mediaDestination.stream.getAudioTracks()) stream.addTrack(track);
  }
  const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 10_000_000, audioBitsPerSecond: 192_000 });
  const chunks: BlobPart[] = [];
  recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };

  return new Promise<ExportResult>((resolve, reject) => {
    recorder.onerror = () => reject(new Error('リアルタイム録画に失敗しました。'));
    recorder.onstop = () => {
      const format = mime.startsWith('video/mp4') ? 'mp4' : 'webm';
      const blob = new Blob(chunks, { type: format === 'mp4' ? 'video/mp4' : 'video/webm' });
      download(blob, format, state.settings.format === 'v');
      mediaDestination?.disconnect();
      onProgress(100);
      resolve({ format, size: blob.size, duration: timeline.dur });
    };
    recorder.start(120);
    const start = audio.currentTime + .1;
    if (state.settings.sound) for (const event of timeline.evs) (event.m.sender === 'me' ? sfxSend : sfxReceive)(audio, gain, start + event.t);
    const render = () => {
      const time = Math.max(0, audio.currentTime - start);
      draw(options, Math.min(time, timeline.dur));
      onProgress(Math.round(Math.min(1, time / timeline.dur) * 100));
      if (time < timeline.dur) requestAnimationFrame(render);
      else window.setTimeout(() => recorder.stop(), 300);
    };
    requestAnimationFrame(render);
  });
}
