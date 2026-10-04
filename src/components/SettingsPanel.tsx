import React from 'react';
import { motion } from 'motion/react';
import { Sun, ImageIcon, Trash2, Plus } from 'lucide-react';
import { AppSettings } from '../types';
import { BACKGROUND_COLORS } from '../constants';

interface SettingsPanelProps {
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  onBgUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearHistory: () => void;
  backgroundImageInputRef: React.RefObject<HTMLInputElement | null>;
  isMobileFullscreen: boolean;
  setIsMobileFullscreen: (val: boolean) => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ 
  settings, 
  setSettings, 
  onBgUpload, 
  onClearHistory,
  backgroundImageInputRef,
  isMobileFullscreen,
  setIsMobileFullscreen
}) => {
  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <h2 className="text-sm font-bold text-gray-500 mb-4 flex items-center gap-2">
          <Sun size={16} /> 2. 名前設定
        </h2>
        <div className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-bold text-gray-600">相手の名前</span>
            <input 
              type="text" 
              value={settings.opponentName}
              onChange={(e) => setSettings((prev) => ({ ...prev, opponentName: e.target.value }))}
              placeholder="映えチェッカーくん"
              className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#06C755]/20 focus:border-[#06C755] transition-all"
            />
          </div>
        </div>
      </div>

      {/* Settings */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <h2 className="text-sm font-bold text-gray-500 mb-4 flex items-center gap-2">
          <Sun size={16} /> 3. プレビュー設定
        </h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-600">スマホのノッチを表示</span>
            <button 
              onClick={() => setSettings((prev) => ({ ...prev, showNotch: !prev.showNotch }))}
              className={`relative w-12 h-6 rounded-full transition-all border-2 ${settings.showNotch ? 'bg-[#06C755] border-[#06C755]' : 'bg-gray-200 border-gray-200'}`}
            >
              <motion.div 
                className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm"
                animate={{ x: settings.showNotch ? 24 : 0 }}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-600">既読を表示</span>
            <button 
              onClick={() => setSettings((prev) => ({ ...prev, showReadStatus: !prev.showReadStatus }))}
              className={`relative w-12 h-6 rounded-full transition-all border-2 ${settings.showReadStatus ? 'bg-[#06C755] border-[#06C755]' : 'bg-gray-200 border-gray-200'}`}
            >
              <motion.div 
                className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm"
                animate={{ x: settings.showReadStatus ? 24 : 0 }}
              />
            </button>
          </div>

          {settings.showReadStatus && (
            <div className="flex items-center justify-between pl-4">
              <span className="text-xs text-gray-500">既読数</span>
              <input 
                type="number"
                min="0"
                value={settings.readCount}
                onChange={(e) => setSettings((prev) => ({ ...prev, readCount: Math.max(0, parseInt(e.target.value) || 0) }))}
                className="w-16 px-2 py-1 bg-gray-50 border border-gray-100 rounded-lg text-sm text-center"
              />
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-600">お気に入り(☆)を表示</span>
            <button 
              onClick={() => setSettings((prev) => ({ ...prev, showStar: !prev.showStar }))}
              className={`relative w-12 h-6 rounded-full transition-all border-2 ${settings.showStar ? 'bg-[#06C755] border-[#06C755]' : 'bg-gray-200 border-gray-200'}`}
            >
              <motion.div 
                className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm"
                animate={{ x: settings.showStar ? 24 : 0 }}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-gray-600">動くスタンプを連続再生</span>
              <span className="text-[10px] text-gray-400">OFFのときはスタンプをタップでもう1回再生</span>
            </div>
            <button
              onClick={() => setSettings((prev) => ({ ...prev, loopAnimations: !prev.loopAnimations }))}
              className={`relative w-12 h-6 rounded-full transition-all border-2 ${settings.loopAnimations ? 'bg-[#06C755] border-[#06C755]' : 'bg-gray-200 border-gray-200'}`}
            >
              <motion.div
                className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm"
                animate={{ x: settings.loopAnimations ? 24 : 0 }}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-600">トーク内の相手の名前を表示</span>
            <button 
              onClick={() => setSettings((prev) => ({ ...prev, showOpponentNameInTalk: !prev.showOpponentNameInTalk }))}
              className={`relative w-12 h-6 rounded-full transition-all border-2 ${settings.showOpponentNameInTalk ? 'bg-[#06C755] border-[#06C755]' : 'bg-gray-200 border-gray-200'}`}
            >
              <motion.div 
                className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm"
                animate={{ x: settings.showOpponentNameInTalk ? 24 : 0 }}
              />
            </button>
          </div>

          {/* Fullscreen Toggle */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-50 border-dashed">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-gray-600">全画面表示モード</span>
              <span className="text-[10px] text-gray-400">スマホで本物のように表示します</span>
            </div>
            <button 
              onClick={() => setIsMobileFullscreen(!isMobileFullscreen)}
              className={`relative w-12 h-6 rounded-full transition-all border-2 ${isMobileFullscreen ? 'bg-[#06C755] border-[#06C755]' : 'bg-gray-200 border-gray-200'}`}
            >
              <motion.div 
                className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm"
                animate={{ x: isMobileFullscreen ? 24 : 0 }}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Background Settings */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-sm font-bold text-gray-500 flex items-center gap-2">
            <ImageIcon size={16} /> 4. 背景設定
          </h2>
          <button 
            onClick={onClearHistory}
            className="text-xs text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1"
          >
            <Trash2 size={12} /> トーククリア
          </button>
        </div>
        
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setSettings((prev) => ({ ...prev, backgroundColor: 'default', backgroundImage: null }))}
            className={`w-10 h-10 rounded-xl border-2 transition-all ${settings.backgroundColor === 'default' ? 'border-[#06C755] scale-110 shadow-md' : 'border-transparent opacity-60 hover:opacity-100'}`}
            style={{ background: 'linear-gradient(to bottom, #93aad4, #9ab0d7)' }}
            title="標準背景"
          />
          {BACKGROUND_COLORS.map(c => (
            <button
              key={c.value}
              onClick={() => setSettings((prev) => ({ ...prev, backgroundColor: c.value, backgroundImage: null }))}
              className={`w-10 h-10 rounded-xl border-2 transition-all ${settings.backgroundColor === c.value ? 'border-[#06C755] scale-110 shadow-md' : 'border-transparent opacity-60 hover:opacity-100'}`}
              style={{ backgroundColor: c.value }}
              title={c.name}
            />
          ))}
          <input 
            type="file" 
            ref={backgroundImageInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={onBgUpload} 
          />
          <button
            onClick={() => backgroundImageInputRef.current?.click()}
            className={`w-10 h-10 rounded-xl border-2 border-dashed flex items-center justify-center transition-all ${settings.backgroundColor === 'image' ? 'border-[#06C755] bg-green-50' : 'border-gray-200 hover:border-gray-400'}`}
            title="背景画像をアップロード"
          >
            <Plus size={20} className="text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  );
};
