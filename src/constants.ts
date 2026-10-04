export const BACKGROUND_COLORS = [
  { name: '白', value: '#FFFFFF' },
  { name: 'マゼンタ', value: '#FF3DCC' },
  { name: 'ブルー', value: '#5BA4F5' },
  { name: '黒', value: '#000000' },
  { name: 'グリーン', value: '#1FAE5C' },
  { name: 'オレンジ', value: '#F97316' },
];

export const DEFAULT_SKY_BG = 'linear-gradient(to bottom, #93aad4, #9ab0d7)';

export const OPPONENT_AVATAR_SVG = `
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <circle cx="50" cy="50" r="50" fill="#A0A8B0"/>
  <circle cx="50" cy="40" r="14" fill="#F1F2F4"/>
  <path d="M22 88 Q50 64 78 88 L78 100 L22 100 Z" fill="#F1F2F4"/>
</svg>
`;

export const LINE_GREEN = '#06C755';

export const VALIDATION_CRITERIA = {
  FORMAT: 'PNG (透過必須)',
  SIZE_LIMIT: '1MB以下/画像',
  ZIP_LIMIT: '20MB以下',
  STICKER: {
    DIMENSIONS: 'W370×H320px 以内',
    WIDTH: 370,
    HEIGHT: 320,
    COUNT_VARIANTS: [8, 16, 24, 32, 40],
  },
  EMOJI: {
    DIMENSIONS: 'W180×H180px 以内',
    WIDTH: 180,
    HEIGHT: 180,
    COUNT_VARIANTS: [8, 16, 24, 32, 40], // LINE Emoji count variants appear similar
  },
  MAIN_SIZE: { w: 240, h: 240 },
  TAB_SIZE: { w: 96, h: 74 },
};
