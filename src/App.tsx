import { useEffect, useRef, useState } from 'react';
import JSZip from 'jszip';
import { Clapperboard } from 'lucide-react';
import { motion } from 'motion/react';

import { Message, Sticker, StickerGroup } from './types';
import { useAppSettings } from './hooks/useAppSettings';
import { useStickerGroups } from './hooks/useStickerGroups';
import { PhonePreview } from './components/PhonePreview';
import { SettingsPanel } from './components/SettingsPanel';
import { UploadSection } from './components/UploadSection';
import { VideoSettingsCard } from './components/VideoSettingsCard';
import { PreviewModal } from './components/PreviewModal';
import { generateId } from './utils/id';
import { createManagedObjectURL, revokeManagedObjectURL } from './utils/objectUrl';
import { isApng, toInfiniteLoopApng } from './utils/apng';
import { getContrastColor } from './utils/contrast';
import { InternalLink } from './access';

const getBasename = (path: string) => path.replace(/^.*[\\/]/, '');

export default function App() {
  const { settings, setSettings } = useAppSettings();
  const {
    stickerGroups,
    emojiGroups,
    activeStickerGroupId,
    activeEmojiGroupId,
    setActiveStickerGroupId,
    setActiveEmojiGroupId,
    addStickerGroup,
    addEmojiGroup,
    removeStickerGroup,
    removeEmojiGroup,
  } = useStickerGroups();
  const [inputText, setInputText] = useState<(string | Sticker)[]>([]);
  const [currentTyping, setCurrentTyping] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [reactionTargetId, setReactionTargetId] = useState<string | null>(null);
  const [activePanelTab, setActivePanelTab] = useState<'sticker' | 'emoji' | 'settings'>('sticker');
  const [isMobileFullscreen, setIsMobileFullscreen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [autoExport, setAutoExport] = useState(false);
  const talkRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const talk = talkRef.current;
      if (talk) talk.scrollTo({ top: talk.scrollHeight, behavior: 'smooth' });
    });
    return () => cancelAnimationFrame(frame);
  }, [messages]);

  const stickerToPreviewSticker = async (sticker: Sticker): Promise<Sticker> => {
    if (!sticker.blob) return { ...sticker };
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(sticker.blob!);
    });

    let isAnimated = false;
    let loopUrl: string | undefined;
    try {
      const bytes = new Uint8Array(await sticker.blob.arrayBuffer());
      isAnimated = isApng(bytes);
      const loopedBytes = isAnimated ? toInfiniteLoopApng(bytes) : null;
      if (loopedBytes) {
        loopUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(new Blob([loopedBytes], { type: 'image/png' }));
        });
      }
    } catch (error) {
      console.error('APNGの解析に失敗しました。', error);
    }

    return { ...sticker, url: dataUrl, blob: undefined, isAnimated, loopUrl };
  };

  const makeSticker = async (file: Blob, name: string): Promise<Sticker | null> => {
    const url = createManagedObjectURL(file);
    const image = new Image();
    try {
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error(`${name} を読み込めませんでした。`));
        image.src = url;
      });
      return {
        id: generateId(), name, url, blob: file, width: image.width, height: image.height,
        size: file.size, type: file.type || 'image/png',
      };
    } catch (error) {
      revokeManagedObjectURL(url);
      console.warn(error);
      return null;
    }
  };

  const addGroup = (group: StickerGroup) => {
    if (group.category === 'sticker') addStickerGroup(group);
    else addEmojiGroup(group);
    setActivePanelTab(group.category);
  };

  const handleZipUpload = async (event: React.ChangeEvent<HTMLInputElement>, category: 'sticker' | 'emoji') => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const archive = await JSZip.loadAsync(file);
      const stickers: Sticker[] = [];
      let tabSticker: Sticker | null = null;
      for (const [path, entry] of Object.entries(archive.files)) {
        if (entry.dir || !path.toLowerCase().endsWith('.png')) continue;
        const name = getBasename(path);
        const sticker = await makeSticker(await entry.async('blob'), name);
        if (!sticker) continue;
        if (name.toLowerCase() === 'main.png') {
          revokeManagedObjectURL(sticker.url);
          continue;
        }
        if (name.toLowerCase() === 'tab.png') tabSticker = sticker;
        else stickers.push(sticker);
      }
      stickers.sort((a, b) => a.name.localeCompare(b.name, 'ja'));
      if (stickers.length === 0) {
        alert('ZIP内に使用できるPNG画像がありません。');
        return;
      }
      addGroup({ id: generateId(), name: file.name.replace(/\.zip$/i, ''), tabSticker: tabSticker ?? stickers[0], stickers, category });
    } catch (error) {
      console.error(error);
      alert('ZIPファイルの解析に失敗しました。');
    }
  };

  const handlePngUpload = async (event: React.ChangeEvent<HTMLInputElement>, category: 'sticker' | 'emoji') => {
    const files = Array.from(event.target.files ?? []).filter((file) => file.type === 'image/png' || file.name.toLowerCase().endsWith('.png'));
    const stickers = (await Promise.all(files.map((file) => makeSticker(file, file.name)))).filter((sticker): sticker is Sticker => sticker !== null);
    if (stickers.length === 0) return;
    addGroup({
      id: generateId(), name: `Upload_${new Date().toLocaleTimeString('ja-JP')}`,
      tabSticker: stickers[0], stickers, category,
    });
  };

  const sendMessage = async () => {
    const source = [...inputText, ...(currentTyping.trim() ? [currentTyping] : [])];
    const content = source.filter((item) => typeof item !== 'string' || item.trim());
    if (content.length === 0) return;
    const previewContent = await Promise.all(content.map((item) => typeof item === 'string' ? item : stickerToPreviewSticker(item)));
    const onlyEmoji = previewContent.every((item) => typeof item !== 'string');
    const type: Message['type'] = onlyEmoji && previewContent.length === 1 ? 'sticker' : onlyEmoji && previewContent.length <= 3 ? 'emoji-combined' : 'text';
    setMessages((previous) => [...previous, {
      id: generateId(), sender: settings.senderType, timestamp: new Date(), type,
      isEmoji: onlyEmoji, stickerId: type === 'sticker' && typeof previewContent[0] !== 'string' ? previewContent[0].id : undefined,
      content: previewContent, gap: 1.4,
    }]);
    setInputText([]);
    setCurrentTyping('');
  };

  const handleSelectionClick = async (item: Sticker) => {
    const previewSticker = await stickerToPreviewSticker(item);
    if (reactionTargetId) {
      setMessages((previous) => previous.map((message) => message.id === reactionTargetId
        ? { ...message, reactions: [...(message.reactions ?? []), previewSticker] }
        : message));
      setReactionTargetId(null);
      return;
    }
    if (activePanelTab === 'sticker') {
      setMessages((previous) => [...previous, {
        id: generateId(), sender: settings.senderType, timestamp: new Date(), type: 'sticker',
        isEmoji: false, stickerId: previewSticker.id, content: [previewSticker], gap: 1.4,
      }]);
      return;
    }
    if (currentTyping) {
      setInputText((previous) => [...previous, currentTyping]);
      setCurrentTyping('');
    }
    setInputText((previous) => [...previous, previewSticker]);
  };

  const handleRemoveGroup = (group: StickerGroup) => {
    if (!window.confirm(`「${group.name}」を削除しますか？\n送信済みのメッセージは残ります。`)) return;
    if (group.category === 'sticker') removeStickerGroup(group.id);
    else removeEmojiGroup(group.id);
  };

  const handleBgUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const url = createManagedObjectURL(file);
    setSettings((previous) => ({ ...previous, backgroundImage: url, backgroundColor: 'image' }));
  };

  const handleClearHistory = () => {
    if (window.confirm('トーク履歴をクリアしますか？')) setMessages([]);
  };

  const handleFrameBgUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const url = createManagedObjectURL(file);
    setSettings((previous) => ({ ...previous, frameBg: { ...previous.frameBg, mode: 'image', imgUrl: url } }));
  };

  const handleChangeGap = (id: string, gap: number) => {
    setMessages((previous) => previous.map((message) => message.id === id ? { ...message, gap } : message));
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <header className="fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#06C755] text-white shadow-sm"><Clapperboard size={24} /></div>
          <div className="min-w-0"><h1 className="truncate text-lg font-bold leading-tight">みてみてくん</h1><p className="truncate text-xs text-gray-500">LINEトーク動画メーカー</p></div>
        </div>
        <InternalLink to="guide" className="rounded-full bg-green-50 px-3 py-2 text-xs font-bold text-green-800">使い方</InternalLink>
      </header>

      <main className={`mx-auto grid max-w-[1400px] grid-cols-1 items-start gap-4 px-1 pb-4 pt-20 sm:px-4 ${isMobileFullscreen ? '' : 'lg:grid-cols-[400px_1fr]'}`}>
        <section className={`z-10 flex w-full flex-col items-center pb-4 ${isMobileFullscreen ? 'fixed inset-0 z-[60] bg-white p-0' : 'lg:sticky lg:top-20'}`}>
          <PhonePreview
            settings={settings} messages={messages} inputText={inputText} currentTyping={currentTyping}
            onSendMessage={sendMessage} onRemoveInputItem={(index) => setInputText((previous) => previous.filter((_, itemIndex) => itemIndex !== index))}
            onRemoveMessage={(id) => setMessages((previous) => previous.filter((message) => message.id !== id))}
            setCurrentTyping={setCurrentTyping} talkRef={talkRef} messagesEndRef={messagesEndRef}
            activePanelTab={activePanelTab} setActivePanelTab={setActivePanelTab} stickerGroups={stickerGroups} emojiGroups={emojiGroups}
            activeStickerGroupId={activeStickerGroupId} activeEmojiGroupId={activeEmojiGroupId}
            setActiveStickerGroupId={setActiveStickerGroupId} setActiveEmojiGroupId={setActiveEmojiGroupId}
            handleSelectionClick={handleSelectionClick} formatTime={(date) => date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', hour12: false })}
            getContrastColor={getContrastColor} isMobileFullscreen={isMobileFullscreen} setIsMobileFullscreen={setIsMobileFullscreen}
            onToggleSender={(id) => setMessages((previous) => previous.map((message) => message.id === id ? { ...message, sender: message.sender === 'me' ? 'opponent' : 'me' } : message))}
            onAddReaction={(id) => { setReactionTargetId(id); setActivePanelTab('emoji'); }} setSettings={setSettings}
            onBgUpload={handleBgUpload} bgInputRef={bgInputRef} onClearHistory={handleClearHistory}
            onChangeGap={handleChangeGap} onFrameBgUpload={handleFrameBgUpload}
            onExportVideo={() => { setAutoExport(true); setPreviewOpen(true); }}
            onPreviewVideo={() => { setAutoExport(false); setPreviewOpen(true); }}
          />
          {!isMobileFullscreen && <div className="mt-6 flex w-full max-w-[375px] flex-col gap-4"><div className="relative flex overflow-hidden rounded-2xl border border-gray-100 bg-white p-1.5 shadow-sm">
            <button onClick={() => setSettings((previous) => ({ ...previous, senderType: 'opponent' }))} className={`relative z-10 flex-1 rounded-xl py-2.5 text-sm font-bold transition-all ${settings.senderType === 'opponent' ? 'text-white' : 'text-gray-500'}`}>受信</button>
            <button onClick={() => setSettings((previous) => ({ ...previous, senderType: 'me' }))} className={`relative z-10 flex-1 rounded-xl py-2.5 text-sm font-bold transition-all ${settings.senderType === 'me' ? 'text-white' : 'text-gray-500'}`}>送信</button>
            <motion.div className="absolute inset-1.5 w-[calc(50%-6px)] rounded-xl bg-[#06C755]" initial={false} animate={{ x: settings.senderType === 'opponent' ? 0 : '100%' }} />
          </div><div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => { setAutoExport(false); setPreviewOpen(true); }} className="rounded-2xl bg-[#06C755] px-4 py-3 text-sm font-bold text-white shadow-sm transition-transform active:scale-95">▶ プレビュー再生</button><button type="button" onClick={() => { setAutoExport(true); setPreviewOpen(true); }} className="rounded-2xl bg-slate-700 px-4 py-3 text-sm font-bold text-white shadow-sm transition-transform active:scale-95">🎬 動画を書き出す</button></div></div>}
        </section>

        <section className={`mx-auto flex w-full max-w-2xl flex-col gap-6 lg:mx-0 ${isMobileFullscreen ? 'hidden' : ''}`}>
          <VideoSettingsCard settings={settings} setSettings={setSettings} onFrameBgUpload={handleFrameBgUpload} />
          <UploadSection onZipUpload={handleZipUpload} onPngUpload={handlePngUpload} stickerGroupsCount={stickerGroups.length} emojiGroupsCount={emojiGroups.length} stickerGroups={stickerGroups} emojiGroups={emojiGroups} onRemoveGroup={handleRemoveGroup} />
          <SettingsPanel settings={settings} setSettings={setSettings} onBgUpload={handleBgUpload} onClearHistory={handleClearHistory} backgroundImageInputRef={bgInputRef} isMobileFullscreen={isMobileFullscreen} setIsMobileFullscreen={setIsMobileFullscreen} />
        </section>
      </main>
      <footer className={`pb-10 pt-4 text-center ${isMobileFullscreen ? 'hidden' : ''}`}><p className="text-xs font-medium tracking-wider text-gray-400">みてみてくん 🎬</p></footer>
      <PreviewModal open={previewOpen} onClose={() => { setPreviewOpen(false); setAutoExport(false); }} autoExport={autoExport} onAutoExportHandled={() => setAutoExport(false)} settings={settings} messages={messages} stickerGroups={stickerGroups} emojiGroups={emojiGroups} activeStickerGroupId={activeStickerGroupId} activeEmojiGroupId={activeEmojiGroupId} />
    </div>
  );
}
