import { Clapperboard } from 'lucide-react';
import { AppSettings } from '../types';
import { VideoSettingsFields } from './VideoSettingsFields';

interface VideoSettingsCardProps {
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  onFrameBgUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export function VideoSettingsCard({ settings, setSettings, onFrameBgUpload }: VideoSettingsCardProps) {
  return (
    <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
      <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-gray-500"><Clapperboard size={16} />動画の設定</h2>
      <VideoSettingsFields settings={settings} setSettings={setSettings} onFrameBgUpload={onFrameBgUpload} />
      <p className="mt-5 text-[11px] leading-relaxed text-gray-400">WebCodecs非対応ブラウザでは、書き出し時にリアルタイム録画へ切り替わります。</p>
    </section>
  );
}
