import React from 'react';
import { ChevronLeft, Search, Phone, Calendar, Menu, Send, Smile, Trash2, X } from 'lucide-react';
import { Message, Sticker, AppSettings, StickerGroup } from '../types';
import { DEFAULT_SKY_BG } from '../constants';
import { MessageBubble } from './MessageBubble';
import { StickerPanel } from './StickerPanel';

interface PhonePreviewProps {
  settings: AppSettings;
  messages: Message[];
  inputText: (string | Sticker)[];
  currentTyping: string;
  onSendMessage: () => void;
  onRemoveInputItem: (index: number) => void;
  onRemoveMessage: (id: string) => void;
  setCurrentTyping: (val: string) => void;
  talkRef: React.RefObject<HTMLDivElement | null>;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  activePanelTab: 'sticker' | 'emoji' | 'settings';
  setActivePanelTab: React.Dispatch<React.SetStateAction<'sticker' | 'emoji' | 'settings'>>;
  stickerGroups: StickerGroup[];
  emojiGroups: StickerGroup[];
  activeStickerGroupId: string | null;
  activeEmojiGroupId: string | null;
  setActiveStickerGroupId: (id: string | null) => void;
  setActiveEmojiGroupId: (id: string | null) => void;
  handleSelectionClick: (item: Sticker) => void;
  formatTime: (date: Date) => string;
  getContrastColor: (color: string) => string;
  isMobileFullscreen?: boolean;
  setIsMobileFullscreen?: (val: boolean) => void;
  onToggleSender?: (id: string) => void;
  onAddReaction?: (id: string) => void;
  onChangeGap?: (id: string, gap: number) => void;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  onBgUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  bgInputRef: React.RefObject<HTMLInputElement | null>;
  onClearHistory: () => void;
  onFrameBgUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onExportVideo: () => void;
  onPreviewVideo: () => void;
}

export const PhonePreview: React.FC<PhonePreviewProps> = ({
  settings,
  messages,
  inputText,
  currentTyping,
  onSendMessage,
  onRemoveInputItem,
  onRemoveMessage,
  setCurrentTyping,
  talkRef,
  messagesEndRef,
  activePanelTab,
  setActivePanelTab,
  stickerGroups,
  emojiGroups,
  activeStickerGroupId,
  activeEmojiGroupId,
  setActiveStickerGroupId,
  setActiveEmojiGroupId,
  handleSelectionClick,
  formatTime,
  getContrastColor,
  isMobileFullscreen = false,
  setIsMobileFullscreen,
  onToggleSender,
  onAddReaction,
  onChangeGap,
  setSettings,
  onBgUpload,
  bgInputRef,
  onClearHistory,
  onFrameBgUpload,
  onExportVideo,
  onPreviewVideo
}) => {
  const isCaniSend = inputText.length > 0 || currentTyping.trim().length > 0;

  const isSameMinute = (d1: Date, d2: Date) => {
    return d1.getHours() === d2.getHours() && d1.getMinutes() === d2.getMinutes();
  };

  return (
    <div 
      className={`relative bg-white flex flex-col shrink-0 origin-top shadow-2xl transition-all duration-300 ${
        isMobileFullscreen 
          ? 'w-full h-full rounded-none border-0 scale-100 mb-0' 
          : 'w-[375px] h-[844px] rounded-[48px] border-[10px] border-black overflow-hidden scale-[0.75] xs:scale-[0.85] sm:scale-100 mb-[-140px] xs:mb-[-100px] sm:mb-0'
      }`}
    >
      {/* Exit Fullscreen Button */}
      {isMobileFullscreen && setIsMobileFullscreen && (
        <button 
          onClick={() => setIsMobileFullscreen(false)}
          className="fixed top-4 right-4 z-[100] w-10 h-10 bg-black/50 text-white rounded-full flex items-center justify-center backdrop-blur-md"
        >
          <X size={24} />
        </button>
      )}

      {/* Notch */}
      {settings.showNotch && !isMobileFullscreen && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-b-2xl z-50" />
      )}
      
      {/* Talk Header */}
      <header 
        className="h-14 flex items-center justify-between px-6 pt-5 shrink-0 relative z-30"
        style={{ 
          backgroundColor: settings.backgroundColor !== 'default' && settings.backgroundColor !== 'image' ? settings.backgroundColor : undefined,
          backgroundImage: settings.backgroundColor === 'default' 
            ? DEFAULT_SKY_BG 
            : (settings.backgroundColor === 'image' ? `url(${settings.backgroundImage})` : undefined),
          backgroundPosition: 'center top',
          backgroundRepeat: 'no-repeat',
          backgroundSize: settings.backgroundColor === 'image' ? 'cover' : undefined,
          color: settings.backgroundColor === 'default' 
            ? 'black' 
            : getContrastColor(settings.backgroundColor === 'image' ? '#000000' : settings.backgroundColor)
        }}
      >
        <div className="flex items-center gap-3 min-w-0 pr-4">
          <ChevronLeft size={24} className="shrink-0" />
          <span className="font-bold text-base truncate">{settings.opponentName}</span>
        </div>
        <div className="flex items-center gap-3 opacity-80">
          <Search size={20} />
          <Phone size={20} />
          <Calendar size={20} />
          <Menu size={20} />
        </div>
      </header>

      {/* Messages Area */}
      <div 
        ref={talkRef}
        className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-1.5 py-4 relative scrollbar-hide"
        style={{
          backgroundColor: settings.backgroundColor !== 'default' && settings.backgroundColor !== 'image' ? settings.backgroundColor : undefined,
          backgroundImage: settings.backgroundColor === 'default' 
            ? DEFAULT_SKY_BG 
            : (settings.backgroundColor === 'image' ? `url(${settings.backgroundImage})` : undefined),
          backgroundPosition: 'center center',
          backgroundRepeat: 'no-repeat',
          backgroundSize: settings.backgroundColor === 'image' ? 'cover' : undefined
        }}
      >
        <div className="flex flex-col gap-2 relative z-10">
          {messages.map((msg, index) => {
            const prevMsg = messages[index - 1];
            const isFirstInSequence = !prevMsg || prevMsg.sender !== msg.sender || !isSameMinute(prevMsg.timestamp, msg.timestamp);

            return (
              <MessageBubble 
                key={msg.id}
                msg={msg}
                isFirstInSequence={isFirstInSequence}
                onRemove={onRemoveMessage}
                formatTime={formatTime}
                onToggleSender={onToggleSender}
                onAddReaction={onAddReaction}
                onChangeGap={onChangeGap}
                settings={settings}
              />
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Bar */}
      <div className="px-2 py-2 flex items-center bg-white border-t border-gray-100 shrink-0 gap-2">
         <ChevronLeft size={20} className="text-gray-400 rotate-180" />
         <div className="flex-1 flex items-center bg-[#F1F2F4] rounded-2xl px-3 py-1.5 gap-1 min-h-[40px] max-h-[80px] overflow-y-auto">
           <div className="flex flex-wrap items-center gap-1 w-full relative">
             {inputText.map((item, i) => (
               typeof item === 'string' ? (
                 <span key={i} className="text-sm">{item}</span>
               ) : (
                 <div key={i} className="relative group/token">
                   <img src={item.url} alt="" className="w-6 h-6 object-contain" referrerPolicy="no-referrer" />
                   <button 
                     onClick={() => onRemoveInputItem(i)}
                     className="absolute -top-1 -right-1 bg-gray-500 text-white rounded-full p-0.5 opacity-0 group-hover/token:opacity-100 transition-opacity"
                   >
                     <Trash2 size={8} />
                   </button>
                 </div>
               )
             ))}
             <textarea 
               className="flex-1 min-w-[40px] bg-transparent border-none outline-none text-sm resize-none py-1 h-[28px] max-h-[80px]"
               value={currentTyping}
               rows={1}
               placeholder={inputText.length === 0 ? "メッセージを入力" : ""}
               onKeyDown={(e) => {
                 if (e.key === 'Backspace' && currentTyping === '' && inputText.length > 0) {
                   onRemoveInputItem(inputText.length - 1);
                 }
                 if (e.key === 'Enter' && !e.shiftKey) {
                   e.preventDefault();
                   onSendMessage();
                 }
               }}
               onChange={(e) => {
                 setCurrentTyping(e.target.value);
                 e.target.style.height = 'auto';
                 e.target.style.height = `${Math.min(e.target.scrollHeight, 80)}px`;
               }}
             />
           </div>
           <div className="flex items-center gap-2 ml-auto shrink-0">
              <div className="p-1 hover:bg-gray-200 rounded-full cursor-pointer transition-colors">
                <Smile size={20} className="text-gray-500" strokeWidth={1.5} />
              </div>
           </div>
         </div>
         <button 
           onClick={onSendMessage}
           className={`transition-colors p-1 ${isCaniSend ? 'text-[#06C755]' : 'text-gray-300'}`}
         >
           <Send size={24} fill="currentColor" stroke="none" />
         </button>
      </div>

      {/* Panel */}
      <div>
        <StickerPanel 
          activePanelTab={activePanelTab}
          setActivePanelTab={setActivePanelTab}
          stickerGroups={stickerGroups}
          emojiGroups={emojiGroups}
          activeStickerGroupId={activeStickerGroupId}
          activeEmojiGroupId={activeEmojiGroupId}
          setActiveStickerGroupId={setActiveStickerGroupId}
          setActiveEmojiGroupId={setActiveEmojiGroupId}
          onSelect={handleSelectionClick}
          settings={settings}
          setSettings={setSettings}
          isMobileFullscreen={isMobileFullscreen}
          setIsMobileFullscreen={setIsMobileFullscreen || (() => {})}
          onBgUpload={onBgUpload}
          bgInputRef={bgInputRef}
          onClearHistory={onClearHistory}
          onFrameBgUpload={onFrameBgUpload}
          onExportVideo={onExportVideo}
          onPreviewVideo={onPreviewVideo}
        />
      </div>
      
      {/* Bottom Home Indicator */}
      <div className="h-6 flex justify-center items-center bg-white">
        <div className="w-32 h-1.5 bg-black/20 rounded-full" />
      </div>
    </div>
  );
};
