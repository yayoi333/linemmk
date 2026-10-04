export type Sender = 'me' | 'opponent';

export interface Sticker {
  id: string;
  name: string;
  url: string;
  blob?: Blob;
  width?: number;
  height?: number;
  size?: number;
  type?: string;
  isMain?: boolean;
  isTab?: boolean;
  /** APNG(アニメーション)かどうか。トーク送信時のプレビュー変換で判定される */
  isAnimated?: boolean;
  /** 無限ループ版のData URL。有限ループのAPNGにのみ設定される */
  loopUrl?: string;
}

export interface StickerGroup {
  id: string;
  name: string;
  tabSticker: Sticker | null;
  stickers: Sticker[];
  category: 'sticker' | 'emoji';
}

export interface Message {
  id: string;
  sender: Sender;
  timestamp: Date;
  type: 'sticker' | 'text' | 'emoji-combined';
  isEmoji?: boolean;
  stickerId?: string; // For legacy/pure stickers
  content?: (string | Sticker)[]; // For text + inline emojis
  reactions?: Sticker[];
  gap: number;
}

export interface ValidationResult {
  passed: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  category: 'sticker' | 'emoji';
  counts: {
    stickers: number;
    hasMain: boolean;
    hasTab: boolean;
  };
}

export interface ValidationError {
  id: string;
  label: string;
  description: string;
}

export interface ValidationWarning {
  id: string;
  label: string;
  description: string;
}

export interface AppSettings {
  backgroundColor: string;
  backgroundImage: string | null;
  senderType: Sender;
  showNotch: boolean;
  opponentName: string;
  showReadStatus: boolean;
  readCount: number;
  showStar: boolean;
  showOpponentNameInTalk: boolean;
  loopAnimations: boolean;
  format: 'v' | 'h';
  vFullscreen: boolean;
  hMode: 'peek' | 'frame' | 'full';
  frameBg: {
    mode: 'default' | 'color' | 'image';
    color: string;
    imgUrl: string | null;
  };
  videoPanel: boolean;
  videoPanelTab: 'sticker' | 'emoji';
  sound: boolean;
  introGap: number;
}
