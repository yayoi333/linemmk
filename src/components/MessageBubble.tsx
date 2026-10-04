import React from 'react';
import { motion } from 'motion/react';
import { Trash2, ArrowLeftRight, Clock3, X, Star, Smile, RotateCcw } from 'lucide-react';
import { Message, AppSettings, Sticker } from '../types';
import { OPPONENT_AVATAR_SVG } from '../constants';
import { StickerImage } from './StickerImage';

interface MessageBubbleProps {
  msg: Message;
  isFirstInSequence: boolean;
  onRemove: (id: string) => void;
  formatTime: (date: Date) => string;
  onToggleSender?: (id: string) => void;
  onAddReaction?: (id: string) => void;
  onChangeGap?: (id: string, gap: number) => void;
  settings: AppSettings;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  msg,
  isFirstInSequence,
  onRemove,
  formatTime,
  onToggleSender,
  onAddReaction,
  onChangeGap,
  settings
}) => {
  const [showMenu, setShowMenu] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  // 「もう1回」再生用。値を進めるとメッセージ内の動くスタンプが再生し直される
  const [replayNonce, setReplayNonce] = React.useState(0);
  const contentStickers = (msg.content ?? []).filter((item): item is Sticker => typeof item !== 'string');
  const hasReplayableSticker = contentStickers.some(s => s.isAnimated && s.loopUrl);

  const handleLongPressMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowMenu(true);
  };

  // Support for touch long-press
  const touchTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = React.useRef(false);

  const handleTouchStart = () => {
    isLongPressRef.current = false;
    touchTimerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      setShowMenu(true);
      if ('vibrate' in navigator) {
        navigator.vibrate(40);
      }
    }, 600);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchTimerRef.current) {
      clearTimeout(touchTimerRef.current);
    }
    if (isLongPressRef.current) {
      e.preventDefault();
    }
  };

  const handleTouchMove = () => {
    if (touchTimerRef.current) {
      clearTimeout(touchTimerRef.current);
    }
  };

  // Close menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  return (
    <motion.div 
      initial={{ opacity: 0, x: msg.sender === 'me' ? 20 : -20, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      className={`flex flex-col select-none relative ${msg.sender === 'me' ? 'items-end' : 'items-start'} ${isFirstInSequence ? 'mt-4' : 'mt-1'}`}
      onContextMenu={handleLongPressMenu}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
    >
      {/* Mobile Action Menu Overlay */}
      {showMenu && (
        <div className="fixed inset-0 bg-black/20 z-[100] flex items-center justify-center p-4 backdrop-blur-[2px]" onClick={() => setShowMenu(false)}>
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            ref={menuRef}
            className="bg-white rounded-3xl shadow-2xl p-4 w-full max-w-[280px] flex flex-col gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-1 px-2">
              <span className="text-xs font-bold text-gray-400">アクション</span>
              <button onClick={() => setShowMenu(false)} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                <X size={16} className="text-gray-400" />
              </button>
            </div>

            <button 
              onClick={() => {
                if (onToggleSender) onToggleSender(msg.id);
                setShowMenu(false);
              }}
              className="flex items-center gap-3 w-full p-4 bg-gray-50 hover:bg-gray-100 rounded-2xl transition-all active:scale-95"
            >
              <div className="w-10 h-10 bg-[#06C755]/10 rounded-full flex items-center justify-center text-[#06C755]">
                <ArrowLeftRight size={20} />
              </div>
              <div className="text-left">
                <div className="text-sm font-bold text-gray-800">送⇔受 切り替え</div>
                <div className="text-[10px] text-gray-400">送信者と受信者を入れ替えます</div>
              </div>
            </button>

            <div className="flex items-center gap-3 rounded-2xl bg-gray-50 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10 text-amber-600"><Clock3 size={20} /></div>
              <label className="flex flex-1 items-center justify-between gap-3 text-sm font-bold text-gray-800">
                <span>間隔（秒）</span>
                <input
                  type="number"
                  min="0.2"
                  step="0.1"
                  value={msg.gap ?? 1.4}
                  onChange={(event) => {
                    const gap = event.currentTarget.valueAsNumber;
                    if (Number.isFinite(gap)) onChangeGap?.(msg.id, Math.max(0.2, gap));
                  }}
                  className="w-20 rounded-lg border border-gray-200 bg-white px-2 py-1 text-right text-sm font-medium focus:border-[#06C755] focus:outline-none"
                />
              </label>
            </div>

            <button 
              onClick={() => {
                if (onAddReaction) onAddReaction(msg.id);
                setShowMenu(false);
              }}
              className="flex items-center gap-3 w-full p-4 bg-gray-50 hover:bg-gray-100 rounded-2xl transition-all active:scale-95"
            >
              <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-500">
                <Smile size={20} />
              </div>
              <div className="text-left">
                <div className="text-sm font-bold text-gray-800">リアクションを選択</div>
                <div className="text-[10px] text-gray-400">メッセージにリアクションを付けます</div>
              </div>
            </button>

            <button 
              onClick={() => {
                onRemove(msg.id);
                setShowMenu(false);
              }}
              className="flex items-center gap-3 w-full p-4 bg-red-50 hover:bg-red-100 rounded-2xl transition-all active:scale-95"
            >
              <div className="w-10 h-10 bg-red-500/10 rounded-full flex items-center justify-center text-red-500">
                <Trash2 size={20} />
              </div>
              <div className="text-left">
                <div className="text-sm font-bold text-red-600">メッセージを削除</div>
                <div className="text-[10px] text-red-400 text-opacity-80">このメッセージを削除します</div>
              </div>
            </button>
          </motion.div>
        </div>
      )}
      <div className={`flex max-w-[85%] group relative ${msg.sender === 'me' ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        {msg.sender === 'opponent' && (
          <div className="w-7 h-7 shrink-0 mr-1.5 mt-1">
            {isFirstInSequence ? (
              <div className="w-full h-full rounded-full overflow-hidden" dangerouslySetInnerHTML={{ __html: OPPONENT_AVATAR_SVG }} />
            ) : (
              <div className="w-full h-full" />
            )}
          </div>
        )}

        <div className={`flex flex-col ${msg.sender === 'opponent' && (!isFirstInSequence || !settings.showOpponentNameInTalk) ? 'mt-1' : ''}`}>
          {/* Name (Opponent Only) */}
          {msg.sender === 'opponent' && isFirstInSequence && settings.showOpponentNameInTalk && (
            <span className="text-[11px] mb-0.5 ml-0.5" style={{ color: '#6b7280' }}>{settings.opponentName}</span>
          )}

          <div className={`flex items-end gap-1 ${msg.sender === 'me' ? 'flex-row-reverse' : 'flex-row'}`}>
            {/* Message Content */}
            <div className="relative group/sticker">
              {msg.type === 'sticker' ? (
                <div className="relative">
                  {(() => {
                    const sticker = msg.content && msg.content[0] && typeof msg.content[0] !== 'string' ? msg.content[0] : null;
                    return sticker ? (
                      <StickerImage
                        sticker={sticker}
                        loop={settings.loopAnimations}
                        replayNonce={replayNonce}
                        alt={sticker.name || ''}
                        className={`${msg.isEmoji ? 'w-[120px]' : 'max-w-[155px]'} h-auto rounded-lg select-none`}
                        draggable={false}
                      />
                    ) : (
                      <div className="w-20 h-20 bg-gray-100 rounded flex items-center justify-center text-[10px] text-gray-400">削除済</div>
                    );
                  })()}
                </div>
              ) : msg.type === 'emoji-combined' ? (
                <div className="flex gap-1 items-end">
                  {msg.content?.map((item, i) => (
                    typeof item !== 'string' && (
                      <StickerImage
                        key={i}
                        sticker={item}
                        loop={settings.loopAnimations}
                        replayNonce={replayNonce}
                        className={`${msg.content?.length === 2 ? 'w-[75px]' : msg.content?.length === 3 ? 'w-[55px]' : 'w-[45px]'} select-none object-contain h-auto`}
                      />
                    )
                  ))}
                </div>
              ) : (
                <div 
                  className={`px-3 py-1 rounded-2xl text-[14px] font-medium leading-relaxed relative ${
                    msg.sender === 'me' ? 'bg-[#A9E97A] text-black' : 'bg-white text-black border border-gray-100'
                  }`}
                >
                  {/* Bubble Tail */}
                  <div className={`absolute top-1 w-2 h-2 ${msg.sender === 'me' ? '-right-[3px] bg-[#A9E97A] [clip-path:polygon(0_0,0_100%,100%_0)]' : '-left-[3px] bg-white border-l border-t border-gray-100 [clip-path:polygon(0_0,100%_0,100%_100%)]'}`} />
                  
                  <div className="block">
                    {msg.content?.map((item, i) => (
                      typeof item === 'string' ? (
                        <span key={i} className="whitespace-pre-wrap">{item}</span>
                      ) : (
                        <StickerImage key={i} sticker={item} loop={settings.loopAnimations} replayNonce={replayNonce} className="w-5 h-5 inline-block align-bottom mx-0.5" />
                      )
                    ))}
                  </div>
                </div>
              )}

              {/* Tool buttons */}
              <div className="absolute -top-2 -right-2 opacity-0 group-hover/sticker:opacity-100 transition-opacity flex gap-1 z-10">
                {hasReplayableSticker && !settings.loopAnimations && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setReplayNonce(n => n + 1); }}
                    className="p-1.5 border rounded-full shadow-md hover:text-[#06C755] transition-colors"
                    style={{ backgroundColor: '#ffffff', borderColor: '#e5e7eb' }}
                    title="もう1回再生"
                  >
                    <RotateCcw size={14} />
                  </button>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); onRemove(msg.id); }}
                  className="p-1.5 border rounded-full shadow-md hover:text-red-500 transition-colors"
                  style={{ backgroundColor: '#ffffff', borderColor: '#e5e7eb' }}
                  title="削除"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            {/* Status & Timestamp */}
            <div className={`flex flex-col relative ${msg.sender === 'me' ? 'items-end' : 'items-start'} self-stretch min-w-[28px]`}>
              {/* Star mark for stickers only, centered vertically */}
              {msg.sender === 'me' && msg.type === 'sticker' && !msg.isEmoji && settings.showStar && (
                <div 
                  className="absolute top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center pointer-events-none"
                  style={{ backgroundColor: '#7b92b4', right: 0 }}
                >
                  <Star size={16} fill="none" stroke="white" strokeWidth={1.5} />
                </div>
              )}
              
              {/* Read status and Time at the bottom */}
              <div className={`flex flex-col mt-auto mb-1 ${msg.sender === 'me' ? 'items-end' : 'items-start'}`}>
                {msg.sender === 'me' && settings.showReadStatus && (
                  <span 
                    className="text-[9px] leading-tight" 
                    style={{ 
                      color: (settings.backgroundColor === 'default' || settings.backgroundColor === 'white')
                        ? '#6b7280' 
                        : 'white'
                    }}
                  >
                    既読{settings.readCount > 0 ? ` ${settings.readCount}` : ''}
                  </span>
                )}
                <span 
                  className="text-[9px] leading-tight whitespace-nowrap" 
                  style={{ 
                    color: (settings.backgroundColor === 'default' || settings.backgroundColor === 'white')
                      ? '#6b7280' 
                      : 'white'
                  }}
                >
                  {formatTime(msg.timestamp)}
                </span>
              </div>
            </div>
          </div>
          
          {/* Reactions */}
          {msg.reactions && msg.reactions.length > 0 && (
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={`mt-1 flex flex-wrap gap-0.5 ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.reactions.map((reaction, i) => (
                <div key={i} className="pointer-events-none">
                  <StickerImage sticker={reaction} loop={settings.loopAnimations} alt="reaction" className="w-[16.8px] h-[16.8px] object-contain" />
                </div>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>

  );
};
