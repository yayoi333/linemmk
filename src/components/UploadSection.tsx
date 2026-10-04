import React, { useRef } from 'react';
import { Upload, ImageIcon, Smile, Trash2 } from 'lucide-react';
import { StickerGroup } from '../types';

interface UploadSectionProps {
  onZipUpload: (e: React.ChangeEvent<HTMLInputElement>, category: 'sticker' | 'emoji') => void;
  onPngUpload: (e: React.ChangeEvent<HTMLInputElement>, category: 'sticker' | 'emoji') => void;
  stickerGroupsCount: number;
  emojiGroupsCount: number;
  stickerGroups: StickerGroup[];
  emojiGroups: StickerGroup[];
  onRemoveGroup: (group: StickerGroup) => void;
}

export const UploadSection: React.FC<UploadSectionProps> = ({ 
  onZipUpload, 
  onPngUpload, 
  stickerGroupsCount, 
  emojiGroupsCount,
  stickerGroups,
  emojiGroups,
  onRemoveGroup
}) => {
  const stickerZipRef = useRef<HTMLInputElement>(null);
  const stickerPngRef = useRef<HTMLInputElement>(null);
  const emojiZipRef = useRef<HTMLInputElement>(null);
  const emojiPngRef = useRef<HTMLInputElement>(null);

  const handleResetAndCall = (
    e: React.ChangeEvent<HTMLInputElement>, 
    callback: (e: React.ChangeEvent<HTMLInputElement>, category: 'sticker' | 'emoji') => void, 
    category: 'sticker' | 'emoji'
  ) => {
    callback(e, category);
    e.target.value = ''; // Reset so the same file can be selected again
  };

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col gap-6">
      {/* Sticker Upload */}
      <div>
        <h2 className="text-sm font-bold text-gray-500 mb-3 flex items-center gap-2">
          <Upload size={16} /> 1. スタンプをアップロード
        </h2>
        <div className="flex gap-2">
          <input 
            type="file" 
            ref={stickerZipRef} 
            className="hidden" 
            accept=".zip" 
            onChange={(e) => handleResetAndCall(e, onZipUpload, 'sticker')} 
          />
          <button 
            onClick={() => stickerZipRef.current?.click()}
            disabled={stickerGroupsCount >= 5}
            className="flex-1 bg-[#06C755] text-white py-3 px-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-[#05b34d] transition-all active:scale-95 disabled:opacity-50 disabled:grayscale disabled:active:scale-100 shadow-sm shadow-green-200"
          >
            <Upload size={18} />
            <div className="text-left">
              <p className="text-[13px]">ZIPで一括追加</p>
              <p className="text-[9px] opacity-70 font-normal">main.png / tab.png 任意</p>
            </div>
          </button>
          
          <input 
            type="file" 
            ref={stickerPngRef} 
            className="hidden" 
            accept=".png" 
            multiple 
            onChange={(e) => handleResetAndCall(e, onPngUpload, 'sticker')} 
          />
          <button 
            onClick={() => stickerPngRef.current?.click()}
            disabled={stickerGroupsCount >= 5}
            className="flex-1 bg-white text-[#06C755] border-2 border-[#06C755] py-3 px-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-green-50 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100"
          >
            <ImageIcon size={18} />
            <div className="text-left">
              <p className="text-[13px]">PNGで追加</p>
              <p className="text-[9px] opacity-70 font-normal">複数選択可能</p>
            </div>
          </button>
        </div>

        {/* Uploaded Stickers List */}
        {stickerGroups.length > 0 && (
          <div className="mt-3 space-y-1">
            {stickerGroups.map((group) => (
              <div key={group.id} className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-lg py-2 px-3 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  {group.tabSticker && (
                    <img src={group.tabSticker.url} alt="" className="w-5 h-5 object-contain rounded" referrerPolicy="no-referrer" />
                  )}
                  <span className="truncate font-medium text-gray-600">
                    {group.name.startsWith('Upload_') ? 'スタンプPNGグループ' : group.name}
                  </span>
                  <span className="text-gray-400">({group.stickers.length})</span>
                </div>
                <button 
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onRemoveGroup(group);
                  }}
                  className="text-gray-400 hover:text-red-500 transition-colors p-2 -mr-1"
                  title="素材一覧から削除"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Emoji Upload(スタンプと同じ見た目) */}
      <div>
        <h2 className="text-sm font-bold text-gray-500 mb-3 flex items-center gap-2">
          <Smile size={16} /> 2. 絵文字をアップロード
        </h2>
        <div className="flex gap-2">
          <input
            type="file"
            ref={emojiZipRef}
            className="hidden"
            accept=".zip"
            onChange={(e) => handleResetAndCall(e, onZipUpload, 'emoji')}
          />
          <button
            onClick={() => emojiZipRef.current?.click()}
            disabled={emojiGroupsCount >= 5}
            className="flex-1 bg-[#06C755] text-white py-3 px-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-[#05b34d] transition-all active:scale-95 disabled:opacity-50 disabled:grayscale disabled:active:scale-100 shadow-sm shadow-green-200"
          >
            <Upload size={18} />
            <div className="text-left">
              <p className="text-[13px]">ZIPで一括追加</p>
              <p className="text-[9px] opacity-70 font-normal">main.png / tab.png 任意</p>
            </div>
          </button>
          <input
            type="file"
            ref={emojiPngRef}
            className="hidden"
            accept=".png"
            multiple
            onChange={(e) => handleResetAndCall(e, onPngUpload, 'emoji')}
          />
          <button
            onClick={() => emojiPngRef.current?.click()}
            disabled={emojiGroupsCount >= 5}
            className="flex-1 bg-white text-[#06C755] border-2 border-[#06C755] py-3 px-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-green-50 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100"
          >
            <ImageIcon size={18} />
            <div className="text-left">
              <p className="text-[13px]">PNGで追加</p>
              <p className="text-[9px] opacity-70 font-normal">複数選択可能</p>
            </div>
          </button>
        </div>

        {/* Uploaded Emojis List */}
        {emojiGroups.length > 0 && (
          <div className="mt-3 space-y-1">
            {emojiGroups.map((group) => (
              <div key={group.id} className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-lg py-2 px-3 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  {group.tabSticker && (
                    <img src={group.tabSticker.url} alt="" className="w-5 h-5 object-contain rounded" referrerPolicy="no-referrer" />
                  )}
                  <span className="truncate font-medium text-gray-600">
                    {group.name.startsWith('Upload_') ? '絵文字PNGグループ' : group.name}
                  </span>
                  <span className="text-gray-400">({group.stickers.length})</span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onRemoveGroup(group);
                  }}
                  className="text-gray-400 hover:text-red-500 transition-colors p-2 -mr-1"
                  title="素材一覧から削除"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
