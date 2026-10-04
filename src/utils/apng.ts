/**
 * APNG (アニメーションPNG) 判定と、再生回数(num_plays)の書き換えユーティリティ。
 * LINE用のAPNGは再生回数が有限(1〜4回)なので、プレビューで連続再生したい場合は
 * acTLチャンクの num_plays を 0(無限ループ)に書き換えたコピーを作る。
 */

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

const crc32 = (bytes: Uint8Array, start: number, end: number): number => {
  let c = 0xffffffff;
  for (let i = start; i < end; i++) {
    c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
};

const readUint32 = (bytes: Uint8Array, offset: number): number =>
  ((bytes[offset] << 24) | (bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3]) >>> 0;

const writeUint32 = (bytes: Uint8Array, offset: number, value: number): void => {
  bytes[offset] = (value >>> 24) & 0xff;
  bytes[offset + 1] = (value >>> 16) & 0xff;
  bytes[offset + 2] = (value >>> 8) & 0xff;
  bytes[offset + 3] = value & 0xff;
};

/** acTLチャンクのデータ部の先頭オフセットを返す。APNGでなければ -1。 */
const findAcTLDataOffset = (bytes: Uint8Array): number => {
  if (bytes.length < 8) return -1;
  for (let i = 0; i < 8; i++) {
    if (bytes[i] !== PNG_SIGNATURE[i]) return -1;
  }
  let pos = 8;
  // チャンク構造: length(4) + type(4) + data(length) + crc(4)
  while (pos + 8 <= bytes.length) {
    const length = readUint32(bytes, pos);
    const type = String.fromCharCode(bytes[pos + 4], bytes[pos + 5], bytes[pos + 6], bytes[pos + 7]);
    if (type === 'acTL') {
      // acTLのデータ部は num_frames(4) + num_plays(4) の8バイト固定
      if (length !== 8 || pos + 8 + 8 + 4 > bytes.length) return -1;
      return pos + 8;
    }
    // 仕様上 acTL は最初の IDAT より前に置かれる
    if (type === 'IDAT' || type === 'IEND') return -1;
    pos += 8 + length + 4;
  }
  return -1;
};

export const isApng = (bytes: Uint8Array): boolean => findAcTLDataOffset(bytes) >= 0;

/**
 * num_plays を 0(無限ループ)に書き換えたコピーを返す。
 * APNGでない場合と、すでに無限ループの場合は null。
 */
export const toInfiniteLoopApng = (bytes: Uint8Array): Uint8Array | null => {
  const dataOffset = findAcTLDataOffset(bytes);
  if (dataOffset < 0) return null;
  const numPlays = readUint32(bytes, dataOffset + 4);
  if (numPlays === 0) return null;

  const out = bytes.slice();
  writeUint32(out, dataOffset + 4, 0);
  // CRCはチャンクtype+dataに対して計算する
  const crc = crc32(out, dataOffset - 4, dataOffset + 8);
  writeUint32(out, dataOffset + 8, crc);
  return out;
};
