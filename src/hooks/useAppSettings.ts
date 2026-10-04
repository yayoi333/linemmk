import { useState, useEffect } from 'react';
import { AppSettings } from '../types';

const STORAGE_KEY = 'mitemitekun_settings';

export const useAppSettings = () => {
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const defaults: AppSettings = {
      backgroundColor: 'default',
      backgroundImage: null,
      senderType: 'me',
      showNotch: true,
      opponentName: '相手',
      showReadStatus: false,
      readCount: 1,
      showStar: false,
      showOpponentNameInTalk: true,
      loopAnimations: false,
      format: 'v',
      vFullscreen: false,
      hMode: 'peek',
      frameBg: { mode: 'default', color: '#2b3648', imgUrl: null },
      videoPanel: true,
      videoPanelTab: 'sticker',
      sound: true,
      introGap: 0.4,
    };

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const savedFrameBg = parsed.frameBg ?? {};
        return {
          ...defaults,
          ...parsed,
          // Don't restore BLOB URLs as they are invalid on reload
          backgroundImage: null,
          backgroundColor: parsed.backgroundColor === 'image' ? 'default' : parsed.backgroundColor,
          frameBg: {
            ...defaults.frameBg,
            ...savedFrameBg,
            imgUrl: null,
            mode: savedFrameBg.mode === 'image' ? 'default' : (savedFrameBg.mode ?? defaults.frameBg.mode),
          },
          senderType: 'me' // Always default to 'me' on start
        };
      } catch (e) {
        console.error('Failed to parse settings', e);
      }
    }
    return defaults;
  });

  useEffect(() => {
    const toSave = {
      backgroundColor: settings.backgroundColor,
      showNotch: settings.showNotch,
      opponentName: settings.opponentName,
      showReadStatus: settings.showReadStatus,
      readCount: settings.readCount,
      showStar: settings.showStar,
      showOpponentNameInTalk: settings.showOpponentNameInTalk,
      loopAnimations: settings.loopAnimations,
      format: settings.format,
      vFullscreen: settings.vFullscreen,
      hMode: settings.hMode,
      frameBg: {
        ...settings.frameBg,
        imgUrl: null,
        mode: settings.frameBg.mode === 'image' ? 'default' : settings.frameBg.mode,
      },
      videoPanel: settings.videoPanel,
      videoPanelTab: settings.videoPanelTab,
      sound: settings.sound,
      introGap: settings.introGap,
      // backgroundImage is purposefully not saved to disk if it's a blob URL
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  }, [
    settings.backgroundColor, 
    settings.showNotch, 
    settings.opponentName,
    settings.showReadStatus,
    settings.readCount,
    settings.showStar,
    settings.showOpponentNameInTalk,
    settings.loopAnimations,
    settings.format,
    settings.vFullscreen,
    settings.hMode,
    settings.frameBg,
    settings.videoPanel,
    settings.videoPanelTab,
    settings.sound,
    settings.introGap,
  ]);

  return { settings, setSettings };
};
