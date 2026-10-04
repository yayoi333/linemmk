import React from 'react';
import { motion } from 'motion/react';
import { Clapperboard, ImageIcon, Smile, Settings, Plus, Trash2 } from 'lucide-react';
import { Sticker, StickerGroup, AppSettings } from '../types';
import { BACKGROUND_COLORS } from '../constants';
import { VideoSettingsFields } from './VideoSettingsFields';
import { StickerThumbnail } from './StickerThumbnail';

interface StickerPanelProps {
  activePanelTab: 'sticker' | 'emoji' | 'settings';
  setActivePanelTab: React.Dispatch<React.SetStateAction<'sticker' | 'emoji' | 'settings'>>;
  stickerGroups: StickerGroup[];
  emojiGroups: StickerGroup[];
  activeStickerGroupId: string | null;
  activeEmojiGroupId: string | null;
  setActiveStickerGroupId: (id: string | null) => void;
  setActiveEmojiGroupId: (id: string | null) => void;
  onSelect: (item: Sticker) => void;
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  isMobileFullscreen: boolean;
  setIsMobileFullscreen: (val: boolean) => void;
  onBgUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  bgInputRef: React.RefObject<HTMLInputElement | null>;
  onClearHistory: () => void;
  onFrameBgUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onExportVideo: () => void;
  onPreviewVideo: () => void;
}

export const StickerPanel: React.FC<StickerPanelProps> = ({
  activePanelTab,
  setActivePanelTab,
  stickerGroups,
  emojiGroups,
  activeStickerGroupId,
  activeEmojiGroupId,
  setActiveStickerGroupId,
  setActiveEmojiGroupId,
  onSelect,
  settings,
  setSettings,
  isMobileFullscreen,
  setIsMobileFullscreen,
  onBgUpload,
  onClearHistory,
  onFrameBgUpload,
  onExportVideo,
  onPreviewVideo
}) => {
  const localBgInputRef = React.useRef<HTMLInputElement>(null);
  const effectiveTab = activePanelTab === 'settings' ? 'sticker' : activePanelTab;
  const currentGroups = effectiveTab === 'sticker' ? stickerGroups : emojiGroups;
  const activeGroupId = effectiveTab === 'sticker' ? activeStickerGroupId : activeEmojiGroupId;
  const activeGroup = currentGroups.find(g => g.id === activeGroupId) || currentGroups[0];

  return (
    <div className="h-56 bg-white border-t border-gray-200 shrink-0 flex flex-col">
      {/* Category Switcher bar */}
      <div className="h-12 pl-3 pr-0 flex items-center justify-between bg-white border-b border-gray-100 uppercase overflow-hidden">
        <div className="flex items-center gap-3 h-full">
          {/* Toggle Switch - Overlapping Icons Style */}
          <div 
            onClick={() => setActivePanelTab(prev => prev === 'sticker' ? 'emoji' : 'sticker')}
            className="h-[32px] px-2 bg-[#2D3340] rounded-full cursor-pointer flex items-center transition-all"
          >
            <div className="flex items-center -space-x-1.5 h-full">
              <div className={`transition-all duration-300 ${effectiveTab === 'sticker' ? 'z-20 text-white scale-110' : 'z-10 text-white opacity-30 scale-90'}`}>
                <Smile size={20} />
              </div>
              <div className={`transition-all duration-300 ${effectiveTab === 'emoji' ? 'z-20 text-white scale-110' : 'z-10 text-white opacity-30 scale-90'}`}>
                <svg viewBox="0 0 24 24" className="w-5 h-5">
                  <path fill="currentColor" d="M4.5,10.6c0-1.8,1.5-3.3,3.3-3.3c0.4,0,0.8,0.1,1.1,0.2c1.1-1.2,2.7-2,4.4-2s3.3,0.8,4.4,2c0.3-0.1,0.7-0.2,1.1-0.2c1.8,0,3.3,1.5,3.3,3.3c0,1.2-0.7,2.3-1.7,2.8c0.1,0.5,0.2,1.1,0.2,1.6c0,4.4-3.6,8-8,8s-8-3.59-8-8c0-0.5,0.1-1.1,0.2-1.6C5.2,12.9,4.5,11.8,4.5,10.6z M12,14c-1.1,0-2,0.9-2,2s0.9,2,2,2s2-0.9,2-2S13.1,14,12,14z M8,12c-0.6,0-1,0.4-1,1s0.4,1,1,1s1-0.4,1-1S8.6,12,8,12z M16,12c-0.6,0-1,0.4-1,1s0.4,1,1,1s1-0.4,1-1S16.6,12,16,12z"/>
                </svg>
              </div>
            </div>
          </div>

          {/* Group Tabs */}
          <div className="flex h-full items-center gap-1 overflow-x-auto scrollbar-hide max-w-[210px]">
            {currentGroups.map(group => (
              <button
                key={group.id}
                onClick={() => {
                  if (effectiveTab === 'sticker') setActiveStickerGroupId(group.id);
                  else setActiveEmojiGroupId(group.id);
                  setActivePanelTab(effectiveTab);
                }}
                className={`h-full px-2 flex items-center justify-center transition-all min-w-[40px] rounded-t-lg ${activeGroup?.id === group.id && activePanelTab !== 'settings' ? 'bg-gray-100 shadow-inner' : 'opacity-40 hover:opacity-100 hover:bg-gray-50'}`}
              >
                {group.tabSticker ? (
                  <StickerThumbnail sticker={group.tabSticker} alt="Tab" className="w-7 h-7 object-contain" />
                ) : (
                  <ImageIcon size={18} />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Settings Gear Icon (always on the right) */}
        <button 
          onClick={() => setActivePanelTab(prev => prev === 'settings' ? effectiveTab : 'settings')}
          className={`h-full pl-3 pr-2 flex items-center justify-center transition-all ${activePanelTab === 'settings' ? 'text-[#06C755] bg-gray-50' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <Settings size={22} className={activePanelTab === 'settings' ? 'animate-spin-slow' : ''} />
        </button>
      </div>
      
      {/* Grid Area / Settings Area */}
      <div className="flex-1 overflow-y-auto p-2 scrollbar-hide">
        {activePanelTab === 'settings' ? (
          <div className="flex flex-col gap-4 p-1 pb-4">
            {/* Condensed Settings UI */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-gray-600">相手の名前</span>
                <input 
                  type="text" 
                  value={settings.opponentName}
                  onChange={(e) => setSettings((prev) => ({ ...prev, opponentName: e.target.value }))}
                  className="w-32 px-2 py-1 bg-gray-50 border border-gray-100 rounded-lg text-[11px] focus:outline-none focus:ring-1 focus:ring-[#06C755]/30 focus:border-[#06C755]"
                />
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-gray-600">ノッチ表示</span>
                  <button 
                    onClick={() => setSettings((prev) => ({ ...prev, showNotch: !prev.showNotch }))}
                    className={`relative w-8 h-4.5 rounded-full transition-all border ${settings.showNotch ? 'bg-[#06C755] border-[#06C755]' : 'bg-gray-200 border-gray-200'}`}
                  >
                    <motion.div className="absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full shadow-sm" animate={{ x: settings.showNotch ? 14 : 0 }} />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-gray-600">お気に入り(☆)</span>
                  <button 
                    onClick={() => setSettings((prev) => ({ ...prev, showStar: !prev.showStar }))}
                    className={`relative w-8 h-4.5 rounded-full transition-all border ${settings.showStar ? 'bg-[#06C755] border-[#06C755]' : 'bg-gray-200 border-gray-200'}`}
                  >
                    <motion.div className="absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full shadow-sm" animate={{ x: settings.showStar ? 14 : 0 }} />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-gray-600">既読表示</span>
                  <button 
                    onClick={() => setSettings((prev) => ({ ...prev, showReadStatus: !prev.showReadStatus }))}
                    className={`relative w-8 h-4.5 rounded-full transition-all border ${settings.showReadStatus ? 'bg-[#06C755] border-[#06C755]' : 'bg-gray-200 border-gray-200'}`}
                  >
                    <motion.div className="absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full shadow-sm" animate={{ x: settings.showReadStatus ? 14 : 0 }} />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-gray-600">全画面モード</span>
                  <button 
                    onClick={() => setIsMobileFullscreen(!isMobileFullscreen)}
                    className={`relative w-8 h-4.5 rounded-full transition-all border ${isMobileFullscreen ? 'bg-[#06C755] border-[#06C755]' : 'bg-gray-200 border-gray-200'}`}
                  >
                    <motion.div className="absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full shadow-sm" animate={{ x: isMobileFullscreen ? 14 : 0 }} />
                  </button>
                </div>

                {settings.showReadStatus && (
                  <div className="flex items-center justify-between bg-gray-50 px-2 py-1.5 rounded-lg col-span-2">
                    <span className="text-[11px] font-bold text-gray-600">既読数</span>
                    <div className="flex items-center bg-white border border-gray-200 rounded-md overflow-hidden">
                      <input 
                        type="number"
                        min="0"
                        value={settings.readCount}
                        onChange={(e) => setSettings((prev) => ({ ...prev, readCount: Math.max(0, parseInt(e.target.value) || 0) }))}
                        className="w-12 px-2 py-0.5 text-[11px] font-mono text-center focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <div className="flex flex-col border-l border-gray-200">
                        <button 
                          onClick={() => setSettings(prev => ({ ...prev, readCount: prev.readCount + 1 }))}
                          className="px-1.5 py-0 border-b border-gray-100 hover:bg-gray-50 flex items-center justify-center h-[11px]"
                        >
                          <div className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-bottom-[4px] border-bottom-gray-400" />
                        </button>
                        <button 
                          onClick={() => setSettings(prev => ({ ...prev, readCount: Math.max(0, prev.readCount - 1) }))}
                          className="px-1.5 py-0 hover:bg-gray-50 flex items-center justify-center h-[11px]"
                        >
                          <div className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-top-[4px] border-top-gray-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between col-span-2">
                  <span className="text-[11px] font-bold text-gray-600">動くスタンプを連続再生</span>
                  <button
                    onClick={() => setSettings((prev) => ({ ...prev, loopAnimations: !prev.loopAnimations }))}
                    className={`relative w-8 h-4.5 rounded-full transition-all border ${settings.loopAnimations ? 'bg-[#06C755] border-[#06C755]' : 'bg-gray-200 border-gray-200'}`}
                  >
                    <motion.div className="absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full shadow-sm" animate={{ x: settings.loopAnimations ? 14 : 0 }} />
                  </button>
                </div>

                <div className="flex items-center justify-between col-span-2">
                  <span className="text-[11px] font-bold text-gray-600">相手の名前表示</span>
                  <button 
                    onClick={() => setSettings((prev) => ({ ...prev, showOpponentNameInTalk: !prev.showOpponentNameInTalk }))}
                    className={`relative w-8 h-4.5 rounded-full transition-all border ${settings.showOpponentNameInTalk ? 'bg-[#06C755] border-[#06C755]' : 'bg-gray-200 border-gray-200'}`}
                  >
                    <motion.div className="absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full shadow-sm" animate={{ x: settings.showOpponentNameInTalk ? 14 : 0 }} />
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[11px] font-bold text-gray-600">背景設定</span>
                  <button onClick={onClearHistory} className="text-[10px] text-gray-400 hover:text-red-500 flex items-center gap-1 transition-colors">
                    <Trash2 size={10} /> 履歴クリア
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSettings((prev) => ({ ...prev, backgroundColor: 'default', backgroundImage: null }))}
                    className={`w-8 h-8 rounded-lg border-2 transition-all ${settings.backgroundColor === 'default' ? 'border-[#06C755] scale-110 shadow-sm' : 'border-transparent opacity-60 hover:opacity-100'}`}
                    style={{ background: 'linear-gradient(to bottom, #93aad4, #9ab0d7)' }}
                  />
                  {BACKGROUND_COLORS.map(c => (
                    <button
                      key={c.value}
                      onClick={() => setSettings((prev) => ({ ...prev, backgroundColor: c.value, backgroundImage: null }))}
                      className={`w-8 h-8 rounded-lg border-2 transition-all ${settings.backgroundColor === c.value ? 'border-[#06C755] scale-110 shadow-sm' : 'border-transparent opacity-60 hover:opacity-100'}`}
                      style={{ backgroundColor: c.value }}
                    />
                  ))}
                  <input type="file" ref={localBgInputRef} className="hidden" accept="image/*" onChange={onBgUpload} />
                  <button
                    onClick={() => localBgInputRef.current?.click()}
                    className={`w-8 h-8 rounded-lg border-2 border-dashed flex items-center justify-center transition-all ${settings.backgroundColor === 'image' ? 'border-[#06C755] bg-green-50' : 'border-gray-200 hover:border-gray-400'}`}
                  >
                    <Plus size={16} className="text-gray-400" />
                  </button>
                </div>
              </div>

              {/* 動画の設定(右列カードと同じコンポーネント) */}
              <div className="pt-3 border-t border-gray-100">
                <div className="flex items-center gap-1.5 mb-3">
                  <Clapperboard size={12} className="text-gray-500" />
                  <span className="text-[11px] font-bold text-gray-600">動画の設定</span>
                </div>
                <VideoSettingsFields settings={settings} setSettings={setSettings} onFrameBgUpload={onFrameBgUpload} />
                <button
                  type="button"
                  onClick={onPreviewVideo}
                  className="mt-4 w-full rounded-2xl bg-[#06C755] px-4 py-3 text-sm font-bold text-white shadow-sm transition-transform active:scale-95 hover:bg-[#05b34d]"
                >
                  ▶ プレビュー再生
                </button>
                <button
                  type="button"
                  onClick={onExportVideo}
                  className="mt-2 w-full rounded-2xl bg-slate-700 px-4 py-3 text-sm font-bold text-white shadow-sm transition-transform active:scale-95 hover:bg-slate-800"
                >
                  🎬 動画を書き出す
                </button>
              </div>
            </div>
          </div>
        ) : !activeGroup ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 opacity-40">
            <ImageIcon size={32} />
            <p className="text-xs">{activePanelTab === 'sticker' ? 'スタンプ' : '絵文字'}がありません</p>
          </div>
        ) : (
          <div className={`grid ${activePanelTab === 'sticker' ? 'grid-cols-5 gap-2' : 'grid-cols-9 gap-1'}`}>
            {activeGroup.stickers.map(s => (
              <button 
                key={s.id}
                onClick={() => {
                  onSelect(s);
                }}
                className={`aspect-square p-1 hover:bg-gray-50 rounded-md transition-all active:scale-95 flex items-center justify-center ${activePanelTab === 'emoji' ? 'scale-110' : ''}`}
              >
                <StickerThumbnail sticker={s} className="w-full h-full object-contain" />
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="h-4 flex items-center justify-between px-3 bg-white" />
    </div>
  );
};
