/** 壁紙色に対する文字色。DOM(ヘッダー/時刻)とCanvasレンダラーで共用する */
export const getContrastColor = (color: string) => {
  if (color === 'default' || color === 'image') return 'white';
  const hex = color.replace('#', '');
  if (hex.length !== 6) return 'black';
  const luminance = (0.299 * parseInt(hex.slice(0, 2), 16) + 0.587 * parseInt(hex.slice(2, 4), 16) + 0.114 * parseInt(hex.slice(4, 6), 16)) / 255;
  return luminance > 0.7 ? 'black' : 'white';
};
