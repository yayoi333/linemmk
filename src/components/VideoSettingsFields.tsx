import { useState } from 'react';
import { FileImage, Volume2 } from 'lucide-react';
import { AppSettings } from '../types';

interface VideoSettingsFieldsProps {
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  onFrameBgUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

/** 動画の設定フォーム。右列カードと歯車タブの両方から同一コンポーネントを使う */
export function VideoSettingsFields({ settings, setSettings, onFrameBgUpload }: VideoSettingsFieldsProps) {
  const [frameBgFileName, setFrameBgFileName] = useState('');
  const showFrameBg = (settings.format === 'v' && !settings.vFullscreen) || (settings.format === 'h' && settings.hMode !== 'full');
  const showVideoPanel = settings.format === 'v' || (settings.format === 'h' && settings.hMode === 'frame');

  const setFrameBgMode = (mode: AppSettings['frameBg']['mode']) => {
    setSettings((previous) => ({ ...previous, frameBg: { ...previous.frameBg, mode } }));
  };

  return (
    <div className="space-y-5">
      <Setting label="形式"><Segments value={settings.format} onChange={(format) => setSettings((previous) => ({ ...previous, format: format as AppSettings['format'] }))} options={[['v', '縦型 9:16'], ['h', '横型 16:9']]} /></Setting>
      {settings.format === 'v' ? <Setting label="縦型の見せ方"><Segments value={settings.vFullscreen ? 'full' : 'frame'} onChange={(value) => setSettings((previous) => ({ ...previous, vFullscreen: value === 'full' }))} options={[['frame', 'フレームあり'], ['full', '全画面']]} /></Setting> : <Setting label="横型の見せ方"><Segments value={settings.hMode} onChange={(hMode) => setSettings((previous) => ({ ...previous, hMode: hMode as AppSettings['hMode'] }))} options={[['peek', 'のぞき見'], ['frame', 'フレームあり'], ['full', '全画面']]} /></Setting>}
      {showFrameBg && <Setting label="スマホ外側の背景">
        <div className="space-y-2"><Segments value={settings.frameBg.mode} onChange={(mode) => setFrameBgMode(mode as AppSettings['frameBg']['mode'])} options={[['default', 'デフォルト'], ['color', '単色'], ['image', '画像']]} />
          {settings.frameBg.mode === 'color' && <input aria-label="外側背景色" type="color" value={settings.frameBg.color} onChange={(event) => setSettings((previous) => ({ ...previous, frameBg: { ...previous.frameBg, color: event.target.value } }))} className="h-9 w-full cursor-pointer rounded-lg border border-gray-200 bg-white p-1" />}
          {settings.frameBg.mode === 'image' && <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 px-3 py-2 text-xs font-bold text-gray-500 hover:border-[#06C755] hover:text-[#06C755]"><FileImage size={15} />画像を選択<input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(event) => { setFrameBgFileName(event.target.files?.[0]?.name ?? ''); onFrameBgUpload(event); }} /></label>}
          {settings.frameBg.mode === 'image' && frameBgFileName && <p className="truncate text-[11px] text-gray-400">{frameBgFileName}</p>}
        </div>
      </Setting>}
      {showVideoPanel && <Setting label="動画内パネル"><div className="space-y-2"><Toggle checked={settings.videoPanel} onClick={() => setSettings((previous) => ({ ...previous, videoPanel: !previous.videoPanel }))} label="表示する" />{settings.videoPanel && <Segments value={settings.videoPanelTab} onChange={(videoPanelTab) => setSettings((previous) => ({ ...previous, videoPanelTab: videoPanelTab as AppSettings['videoPanelTab'] }))} options={[['sticker', 'スタンプ'], ['emoji', '絵文字']]} />}</div></Setting>}
      <Setting label="効果音（シュポ音）"><Toggle checked={settings.sound} onClick={() => setSettings((previous) => ({ ...previous, sound: !previous.sound }))} label={<span className="flex items-center gap-1"><Volume2 size={14} />有効</span>} /></Setting>
      <Setting label="冒頭の間隔"><div className="flex items-center gap-2"><input aria-label="冒頭の間隔（秒）" type="number" min="0" step="0.1" value={settings.introGap} onChange={(event) => { const value = event.currentTarget.valueAsNumber; if (Number.isFinite(value)) setSettings((previous) => ({ ...previous, introGap: Math.max(0, value) })); }} className="w-24 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-[#06C755] focus:outline-none" /><span className="text-xs text-gray-500">秒</span></div></Setting>
    </div>
  );
}

function Setting({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-2"><p className="text-xs font-bold text-gray-600">{label}</p>{children}</div>;
}

function Segments({ value, onChange, options }: { value: string; onChange: (value: string) => void; options: [string, string][] }) {
  return <div className="flex rounded-xl bg-gray-100 p-1">{options.map(([optionValue, label]) => <button key={optionValue} type="button" onClick={() => onChange(optionValue)} className={`min-w-0 flex-1 rounded-lg px-2 py-2 text-[11px] font-bold transition-all ${value === optionValue ? 'bg-white text-[#06C755] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>{label}</button>)}</div>;
}

function Toggle({ checked, onClick, label }: { checked: boolean; onClick: () => void; label: React.ReactNode }) {
  return <button type="button" onClick={onClick} className="flex items-center gap-2 text-xs font-bold text-gray-600"><span className={`relative inline-block h-5 w-9 shrink-0 rounded-full transition-colors ${checked ? 'bg-[#06C755]' : 'bg-gray-200'}`}><span className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-4' : 'translate-x-0'}`} /></span>{label}</button>;
}
