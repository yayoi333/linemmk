import { useState, useCallback } from 'react';
import { StickerGroup } from '../types';
import { revokeManagedObjectURL } from '../utils/objectUrl';

export const useStickerGroups = () => {
  const [stickerGroups, setStickerGroups] = useState<StickerGroup[]>([]);
  const [emojiGroups, setEmojiGroups] = useState<StickerGroup[]>([]);
  const [activeStickerGroupId, setActiveStickerGroupId] = useState<string | null>(null);
  const [activeEmojiGroupId, setActiveEmojiGroupId] = useState<string | null>(null);

  const cleanupGroup = useCallback((group: StickerGroup) => {
    if (group.tabSticker) {
      revokeManagedObjectURL(group.tabSticker.url);
    }
    group.stickers.forEach(s => revokeManagedObjectURL(s.url));
  }, []);

  const addStickerGroup = useCallback((group: StickerGroup) => {
    setStickerGroups((prev) => [...prev, group]);
    setActiveStickerGroupId(group.id);
  }, []);

  const addEmojiGroup = useCallback((group: StickerGroup) => {
    setEmojiGroups((prev) => [...prev, group]);
    setActiveEmojiGroupId(group.id);
  }, []);

  const removeStickerGroup = useCallback((id: string) => {
    setStickerGroups((prev) => {
      const next = prev.filter((g) => g.id !== id);
      setActiveStickerGroupId((current) => {
        if (current !== id) return current;
        return next[0]?.id ?? null;
      });
      return next;
    });
  }, []);

  const removeEmojiGroup = useCallback((id: string) => {
    setEmojiGroups((prev) => {
      const next = prev.filter((g) => g.id !== id);
      setActiveEmojiGroupId((current) => {
        if (current !== id) return current;
        return next[0]?.id ?? null;
      });
      return next;
    });
  }, []);

  const clearAllGroups = useCallback(() => {
    stickerGroups.forEach(cleanupGroup);
    emojiGroups.forEach(cleanupGroup);
    setStickerGroups([]);
    setEmojiGroups([]);
    setActiveStickerGroupId(null);
    setActiveEmojiGroupId(null);
  }, [stickerGroups, emojiGroups, cleanupGroup]);

  const removeStickerFromGroup = useCallback((groupId: string, stickerId: string, category: 'sticker' | 'emoji') => {
    const setter = category === 'sticker' ? setStickerGroups : setEmojiGroups;
    setter((prev) => prev.map(group => {
      if (group.id !== groupId) return group;
      return {
        ...group,
        stickers: group.stickers.filter(s => s.id !== stickerId)
      };
    }));
  }, []);

  return {
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
    removeStickerFromGroup,
    clearAllGroups
  };
};
