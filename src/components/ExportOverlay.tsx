interface ExportOverlayProps { progress: number; }

export function ExportOverlay({ progress }: ExportOverlayProps) {
  return <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 rounded-lg bg-black/80 p-8 text-center text-white">
    <p className="text-lg font-bold">動画を書き出しています…</p>
    <p className="text-sm text-white/80">タブを切り替えずにそのまま待ってね</p>
    <div className="h-3 w-full max-w-md overflow-hidden rounded-full bg-white/20"><div className="h-full rounded-full bg-[#06C755] transition-[width]" style={{ width: `${progress}%` }} /></div>
    <p className="tabular-nums text-sm font-bold">{progress}%</p>
  </div>;
}
