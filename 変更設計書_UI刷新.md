# みてみてくん UI刷新 変更設計書

作成: 2026-07-16 / 作成者: Claude (Fable 5) / 実装担当: Codex
ステータス: 設計確定・実装未着手

---

## 0. この文書の使い方(Codexへの指示)

- この文書が唯一の仕様書。ここに書いていない「ついで改善」は実装しない。気づいた改善点は実装せず、フェーズ完了報告に「提案」として列挙する。
- フェーズ順(§9)に実装する。**各フェーズの完了条件を満たしたら一度停止し、検証結果(実行したコマンド・確認内容)を報告してユーザーの確認を待つ**。先のフェーズに勝手に進まない。
- 仕様に2通り以上の解釈がある箇所を見つけたら、黙って選ばずに解釈候補+推奨を提示して確認する。
- 同じエラーへの修正が2回失敗したら3回目の変種を試さず、現状・試したこと・残る仮説を報告する。
- 参照元コードのパス:
  - みてみてくん(現行・移植元エンジン): `C:\Users\akiru\OneDrive\ドキュメント\AI\みてみてくん\index.html`(単一ファイル1855行、vanilla JS)
  - 映えチェッカーくん(UI/UXの手本): `C:\Users\akiru\OneDrive\ドキュメント\AI\スタンプ切り出しくん\lineskchk\`(React 19 + Vite 6 + Tailwind 4 + motion + lucide-react + JSZip)

---

## 1. 背景と目的

現行みてみてくんの「会話シナリオ」欄は、**各メッセージカードの中に**スタンプ/絵文字のミニ一覧(34〜44pxサムネイル)を表示して選ばせる方式。サムネイルが小さく選びにくい上、メッセージごとに同じ一覧が繰り返し出て見通しが悪い。

映えチェッカーくんは、実物のLINEと同じ操作モデル(スマホ画面下の大きな選択パネルからタップ→即トークに反映)を持ち、この問題がない。

**目的**: みてみてくんの編集UIを映えチェッカーくん方式に刷新する。見た目・操作は映えチェッカーくんを踏襲し、みてみてくん固有の機能(動画書き出し・タイムライン・グループトーク等、§4.2の一覧)をすべて残す。

## 2. 完了の定義(機械的判定)

以下がすべて満たされたら完了:

1. `npm run dev` でアプリが起動し、映えチェッカーくん同様の「左:スマホプレビュー / 右:設定カード」レイアウトが表示される
2. ZIPアップロード→スマホ画面下のパネルにスタンプが**大きなグリッド(スタンプ4〜5列)**で並び、タップすると即トークに送信される
3. メッセージの長押し(右クリック)メニューから 送受切替 / リアクション / 間隔変更 / 削除 ができる
4. ▶プレビュー再生で、メッセージが間隔(gap)どおりに効果音付きで順番に出るアニメーションがCanvas上で再生される
5. 🎬書き出しでMP4がダウンロードされ、再生するとアニメ・効果音・APNGの動きが入っている(縦1080×1920 / 横1920×1080 の両方)
6. §4.2の固有機能がすべて新UIから操作できる
7. `npm run lint`(tsc --noEmit)が exit 0

## 3. 現状整理

### 3.1 みてみてくん(移植元)

単一HTML。エディタはフォーム的なカードUI(問題箇所)、描画はすべてCanvas(仮想幅750の座標系)、書き出しはWebCodecs+mp4-muxer(フォールバック: MediaRecorder実時間録画)。

### 3.2 映えチェッカーくん(UIの手本)

DOMで実物そっくりのスマホ(375×844、黒フレーム)を描き、その中で直接編集する。動画機能はない。主要コンポーネント:

| ファイル | 役割 |
|---|---|
| `src/App.tsx` | 状態管理・ZIP/PNG取込・送信ロジック |
| `src/components/PhonePreview.tsx` | スマホ本体(ヘッダー/トーク面/入力バー/パネル) |
| `src/components/StickerPanel.tsx` | 選択パネル(タブ切替・グリッド・設定ギア) |
| `src/components/MessageBubble.tsx` | 吹き出し+長押しアクションメニュー |
| `src/components/UploadSection.tsx` | ZIP/PNGアップロードカード |
| `src/components/StickerImage.tsx` | APNGループ制御付き画像 |
| `src/utils/apng.ts` | isApng / 無限ループ化 |
| `src/hooks/useAppSettings.ts` `useStickerGroups.ts` | 設定・素材グループ |

## 4. 方針

### 4.1 アーキテクチャ(確定)

**映えチェッカーくんをフォークして新みてみてくんの土台にし、みてみてくんのCanvasエンジンをTSモジュールとして移植する2層構成。**

```
[編集レイヤー]  DOMスマホ(映えチェッカー流用) ←ユーザーが直接操作
        ↕ 共有state(messages, settings, groups)
[出力レイヤー]  Canvasレンダラー(みてみてくんから移植)
                → プレビュー再生(モーダル内canvas) & MP4書き出し
```

- 編集中の見た目はDOM。**再生・書き出し時だけ**同じstateをCanvasレンダラーに渡して描く。
- DOMとCanvasで見た目が完全一致する必要はない(Canvas側が最終成果物。DOMは編集用の近似で良い)。ただし吹き出し色・背景・並び順・リアクションの有無は一致させること。
- 現行 `index.html` は `legacy/mitemite_v1.html` に移動して保存(mp4-muxer.min.jsも `legacy/` にコピー)。参照用であり配信対象外。

却下した代替案(記録): 現行vanilla単一ファイルのままエディタ部分だけ作り替える案。映えチェッカーくんの「見た目も機能も元に」という要求に対しReact資産を捨てて再実装する二度手間になるため不採用。

### 4.2 みてみてくん固有機能(全て残す)

| # | 機能 | 現行実装の場所(index.html行) |
|---|---|---|
| F1 | MP4書き出し(WebCodecs確定生成+OfflineAudioContext音声合成、フォールバックMediaRecorder) | 1306-1458 |
| F2 | プレビュー再生(音声クロック駆動、効果音事前スケジュール) | 1264-1303 |
| F3 | 効果音合成(送信/受信のシュポ音、ON/OFF) | 1211-1262 |
| F4 | メッセージ間隔 gap(秒)+冒頭間隔 introGap | buildTimeline 681-691 |
| F5 | 出力形式: 縦9:16(フレームあり/全画面) / 横16:9(のぞき見/フレーム/全画面) | 693-807 |
| F6 | スマホ外側背景: デフォルト/単色/画像 | 712-746 |
| F7 | テーマ: 青空/ダーク/カスタム色(壁紙色) | theme() 286-329 |
| F8 | グループトーク(グループ名・メンバー複数・既読N人・名前表示・アバター色) | 各所 |
| F9 | 動画内スタンプ選択パネル表示ON/OFF+タブ選択(演出用) | drawPanel 930-997 |
| F10 | APNGフルデコード(Canvasにコマ描画するため) | decodeAPNG 373-450 |
| F11 | インライン絵文字(本文に自作絵文字を混ぜる) | parseRich 575-601 |
| F12 | 絵文字メッセージ複数+改行(3個まで大きく単体/4個以上か改行で吹き出し内) | splitEmojiRows 604-612, 1157-1180 |
| F13 | LINE実物仕様リアクション(顔マーク黄/グレー+絵文字画像最大3個、reactMine) | 1103-1131 |
| F14 | 時刻文字列の指定(例 12:34)・既読表示ON/OFF | 各所 |
| F15 | 自前ZIPパーサ相当(→JSZipに置換可。main.png/tab.png自動除外は維持) | 456-497 |

### 4.3 映えチェッカーくんから採用する操作モデル

- スマホ画面下の**大きな選択パネル**: スタンプ/絵文字トグル、グループごとのタブ、グリッド(スタンプ5列・絵文字9列)。タップで即送信(スタンプ)/入力バーにトークン追加(絵文字)
- 入力バー: テキスト+絵文字トークン混在入力、Enter送信 → インライン絵文字(F11)はこの方式で実現(`:1:`記法は廃止)
- メッセージ長押し(PC:右クリック)のアクションメニュー
- リアクション付与フロー(対象メッセージ選択→パネルから絵文字タップ)
- 送信者トグル(受信/送信)
- アップロードカード(ZIP/PNG、グループ一覧+削除)
- モバイル全画面モード

## 5. ディレクトリ構成(新)

みてみてくんリポジトリ直下をVite化する。lineskchkから流用するファイルは**コピーして持ち込む**(lineskchk側は変更しない)。

```
みてみてくん/
├── legacy/mitemite_v1.html        ← 現行index.htmlを移動(参照用)
├── legacy/mp4-muxer.min.js
├── index.html                     ← Viteエントリ(新規)
├── package.json                   ← lineskchkベース + mp4-muxer追加
├── vite.config.ts / tsconfig.json
└── src/
    ├── main.tsx / index.css
    ├── App.tsx
    ├── types.ts                   ← §6のデータモデル
    ├── constants.ts
    ├── components/
    │   ├── PhonePreview.tsx       ← 流用+拡張
    │   ├── MessageBubble.tsx      ← 流用+拡張(gap表示・メニュー項目追加)
    │   ├── StickerPanel.tsx       ← 流用+拡張(設定タブの中身差替え)
    │   ├── StickerImage.tsx       ← 流用そのまま
    │   ├── UploadSection.tsx      ← 流用そのまま
    │   ├── VideoSettingsCard.tsx  ← 新規(§7.3)
    │   ├── ScenarioList.tsx       ← 新規(§7.4)
    │   ├── TalkSettingsCard.tsx   ← 新規(§7.5 グループトーク)
    │   └── ExportOverlay.tsx      ← 新規(進捗バー)
    ├── hooks/
    │   ├── useAppSettings.ts      ← 流用+項目追加
    │   └── useStickerGroups.ts    ← 流用そのまま
    ├── render/                    ← ★Canvasエンジン移植先(全て新規TS)
    │   ├── apng.ts                ← decodeAPNG移植(F10)
    │   ├── layout.ts              ← V定数・computeLayout・wrapAtoms・splitEmojiRows
    │   ├── theme.ts               ← theme()/mix()
    │   ├── draw.ts                ← drawFrame一式(drawScreen/drawPanel/drawMessage…)
    │   ├── timeline.ts            ← buildTimeline
    │   ├── sound.ts               ← sfxSend/sfxReceive
    │   └── exporter.ts            ← exportDeterministic/exportRealtime
    └── utils/                     ← id.ts / objectUrl.ts / apng.ts(ループ化) 流用
```

注意: lineskchkの `stickerValidation.ts` / `ValidationPanel.tsx`(申請規格チェック)は**持ち込まない**(みてみてくんの責務外。映えチェッカーくんの担当機能)。

## 6. データモデル

lineskchkの型をベースに拡張。ポイント: 送信者を `'me' | 'opponent'` から **`'me' | memberId`** に一般化し、gap と reactions拡張を追加。

```ts
// types.ts(要点のみ。実装時はlineskchk types.tsを下敷きに)
export type SenderId = 'me' | string;      // string = Member.id。1対1では固定id 'p' を相手に使う

export interface Member {                  // F8
  id: string;
  name: string;
  emoji: string;                           // アバター絵文字
  color: string;                           // アバター背景色(PALETTE から自動割当)
}

export interface RenderSticker {           // DOM表示用url + Canvas用デコード結果を併せ持つ
  id: string;
  name: string;
  url: string;                             // DataURL(DOM表示・永続用)
  imgEl?: HTMLImageElement;                // Canvas描画用(遅延生成可)
  anim?: DecodedApng | null;               // F10: フルデコード結果(フレーム配列+delay)
  isAnimated?: boolean;
  loopUrl?: string;                        // DOM側ループ再生用(lineskchk方式)
}

export type EmojiItem = RenderSticker | { br: true };  // F12の改行マーカー

export interface Message {
  id: string;
  sender: SenderId;
  gap: number;                             // F4: 直前メッセージからの秒数(default 1.4, min 0.2)
  type: 'text' | 'sticker' | 'emoji';
  content?: (string | RenderSticker)[];    // text: 文字列+インライン絵文字(F11)
  sticker?: RenderSticker;                 // sticker用
  items?: EmojiItem[];                     // emoji用(F12)
  reactions: Reaction[];                   // F13: 最大3
  reactMine: boolean;                      // F13: 顔マーク黄(true)/グレー線(false)
}

export interface Reaction {
  kind: 'emoji' | 'img';
  value?: string;                          // kind==='emoji': '❤️' | '👍'
  sticker?: RenderSticker;                 // kind==='img'
}

export interface AppSettings {
  // --- lineskchk由来 ---
  backgroundColor: string; backgroundImage: string | null;
  senderType: SenderId;                    // パネルタップ時の送信者(受信/送信トグル→グループ時はセレクタ)
  showNotch: boolean; showReadStatus: boolean; loopAnimations: boolean;
  showOpponentNameInTalk: boolean;
  // --- みてみてくん固有 ---
  format: 'v' | 'h';                       // F5
  vFullscreen: boolean;                    // F5
  hMode: 'peek' | 'frame' | 'full';        // F5
  frameBg: { mode: 'default' | 'color' | 'image'; color: string; imgUrl: string | null }; // F6
  theme: 'sky' | 'dark' | 'custom';        // F7
  customColor: string;                     // F7
  sound: boolean;                          // F3
  time: string;                            // F14 例 '12:34'
  introGap: number;                        // F4
  talk: 'solo' | 'group';                  // F8
  partnerName: string; partnerEmoji: string;
  groupName: string; members: Member[];
  videoPanel: boolean;                     // F9 動画内パネル表示
  videoPanelTab: 'sticker' | 'emoji';      // F9
}
```

背景色系の統合ルール: lineskchkの `backgroundColor`(壁紙)とみてみてくんの `theme` は重複する。**みてみてくんの theme(sky/dark/custom) を正とし**、lineskchkの背景色パレットは custom テーマの色プリセットとして吸収する。背景画像(壁紙画像)は現行みてみてくんに無い機能なので**採用しない**(外側背景F6の画像とは別物。混同注意)。

## 7. 画面仕様

全体レイアウトはlineskchk App.tsxを踏襲:
`ヘッダー(みてみてくん🎬ブランド) / main: grid [スマホ列 | 設定列] / フッター`

### 7.1 スマホ列(左・sticky)

1. **PhonePreview**(lineskchk流用): ヘッダー・トーク面・入力バー・選択パネル・ノッチ
   - ヘッダーのタイトル: solo=相手名 / group=`グループ名 (N)`(N=メンバー数+1)
   - トーク面の壁紙: theme(F7)に従う(sky=既存グラデ、dark、custom=単色)
   - グループ時、受信メッセージのアバターは `Member.color` 丸+絵文字で描く(lineskchkの固定SVGアバターを置換)
2. **送信者トグル**(スマホの下): solo時は lineskchk同様「受信/送信」2ボタン。group時は「自分+各メンバー」の横スクロールチップに変える。選択中の送信者でパネルタップ・テキスト送信が入る
3. **▶プレビュー再生 / 🎬書き出し ボタン**(スマホの下、送信者トグルの下)
   - 再生: モーダルを開き、その中のcanvasでCanvasレンダラー再生(F2)。モーダル内に停止ボタン
   - 書き出し: ExportOverlay(進捗バー)を出してF1実行

### 7.2 選択パネル(StickerPanel拡張)

lineskchkのまま: スタンプ/絵文字トグル、グループタブ、グリッド(スタンプ5列・絵文字9列)、設定ギア。
変更点は設定タブの中身のみ(§7.6)。

- スタンプタップ → 選択中送信者でstickerメッセージ即送信(gap=1.4)
- 絵文字タップ → 入力バーにトークン追加(送信時にtext or emojiメッセージ化。lineskchkのsendMessageロジック踏襲)
  - **F12対応**: 絵文字のみで送信した場合、1〜3個=単体表示、4個以上=吹き出し内。改行はテキスト入力中のShift+Enterで `{br:true}` を挟む(解釈が難しければ「絵文字のみ4個以上は自動で吹き出し内」だけ先行実装し、明示改行UIはフェーズ5で確認)
- リアクションモード中(reactionTargetId≠null)のタップ → 対象メッセージにReaction追加(kind:'img')

### 7.3 VideoSettingsCard(右列・新規)— F5/F6/F9/F3/F14/F4

現行みてみてくんの「🎞 動画の設定」カード相当。映えチェッカーくんのカード様式(白・rounded-3xl・セグメントボタン)で再構成:

- 形式: 縦9:16 / 横16:9
- 縦の見せ方: フレームあり/全画面(format=vのみ表示)
- 横の見せ方: のぞき見/フレーム/全画面(format=hのみ表示)
- スマホ外側の背景: デフォルト/単色(color input)/画像(file)— フレームが描かれるモードのみ表示
- 動画内パネル: 表示ON/OFF+スタンプ/絵文字タブ — 縦型・横型フレームのみ表示
- テーマ: 青空/ダーク/カスタム(+色プリセット・color input)
- 効果音ON/OFF・既読表示ON/OFF・時刻テキスト・冒頭の間隔(秒)

表示条件は現行 `updateRowVisibility()`(index.html 1474-1482)と同一にすること。

### 7.4 ScenarioList(右列・新規)— タイムライン微調整用

スマホでの直接編集を補完する一覧。1メッセージ=1行のコンパクト表示:
`[No.] [送信者名] [内容の要約(テキスト先頭 or サムネ24px)] [gap数値入力(秒)] [▲▼並べ替え] [✕削除]`

- ここでは内容の編集はしない(内容編集はスマホ側で削除→再送、またはフェーズ5の拡張)
- gap変更・並べ替え・削除は即プレビューstateに反映

### 7.5 TalkSettingsCard(右列・新規)— F8

- 種類: 1対1 / グループ(セグメント)
- solo: 相手の名前・アイコン絵文字
- group: グループ名、メンバー一覧(名前・絵文字・削除)、+メンバー追加(色はPALETTE順自動)
- solo⇔group切替時のsender振替は現行ロジック(index.html 1517-1527)を踏襲

### 7.6 メッセージ長押しメニュー(MessageBubble拡張)

lineskchkの3項目に追加して:

1. 送信者切替(solo: 送⇔受トグル / group: 送信者リストから選択)
2. リアクションを選択(既存フロー)+ **クイックリアクション ❤️/👍**(F13、メニュー内に直接ボタン)+ 付与済みリアクションの削除チップ + 「マークを黄色に」トグル(reactMine)
3. 間隔(gap)の数値入力(0.2〜、step 0.1)
4. メッセージを削除(既存)

トーク面のリアクション表示は現行LINE仕様(F13: 顔マーク+最大3個、透過、送信=右下/受信=左下)に合わせてDOM実装を修正する(lineskchkは絵文字画像を並べるだけなので顔マークを追加)。

## 8. Canvasエンジン移植仕様(src/render/)

**原則: index.htmlの該当関数をロジック変更なしでTS化する。**動きが検証済みのコードなので、リファクタは型付けと引数化(グローバルS参照→引数渡し)に留める。

| 移植先 | 元(index.html) | 備考 |
|---|---|---|
| apng.ts | 354-450 (CRC/pngChunk/decodeAPNG/animFrameAt) | ZIP取込・個別取込の両方でデコードし `RenderSticker.anim` に格納 |
| theme.ts | 286-329 | AppSettings.theme/customColorを引数に |
| layout.ts | 574-678 (parseRich/wrapAtoms/splitEmojiRows/V/computeLayout) | parseRichは廃止し、`Message.content`配列を直接atoms化(F11の`:1:`記法は新UIでは不要) |
| timeline.ts | 681-691 | |
| draw.ts | 693-1209 (drawFrame〜drawPicture一式) | 新Message型への読み替えが必要(§8.1) |
| sound.ts | 1211-1262 | |
| exporter.ts | 1306-1458 | mp4-muxerはnpmパッケージ `mp4-muxer` をimport(グローバルscript廃止)。フォールバックのMediaRecorder経路も移植 |

### 8.1 型読み替え表(旧S.messages → 新Message)

| 旧 | 新 |
|---|---|
| `m.sender: 'me'\|'p'\|memberId` | `m.sender: SenderId`(soloの相手は固定 `'p'`) |
| `m.type: 'text'` + `m.text`(`:1:`記法) | `type:'text'` + `content: (string\|RenderSticker)[]` |
| `m.type: 'stamp'` + `m.imgEl/m.anim` | `type:'sticker'` + `sticker.imgEl/anim` |
| `m.type: 'emoji'` + `m.items[{imgEl,anim}\|{br}]` | `type:'emoji'` + `items: EmojiItem[]` |
| `m.reactions[{kind,value,imgEl}]` | `Reaction`(imgElは`sticker.imgEl`) |
| グローバル `libStamps/libEmojis/currentStampSet…` | `StickerGroup[]` + activeGroupId(drawPanel F9用に渡す) |

### 8.2 動作要件

- 書き出し中のUI: ExportOverlay(進捗%・「タブを切り替えずに待ってね」)。書き出し中は再生/書き出しボタンdisabled
- WebCodecs非対応ブラウザではMediaRecorder実時間録画に自動フォールバックし、その旨をヒント表示(現行fmtHint相当をVideoSettingsCard下部に)
- ファイル名: `mitemitekun_{tate|yoko}_{timestamp}.mp4`(現行踏襲)
- 効果音は書き出し時OfflineAudioContextで合成(F1)、プレビュー時は音声クロック駆動+事前スケジュール(F2)。この方式は音ズレ対策として実機検証済みのため**変更禁止**

## 9. フェーズ分割(各フェーズ末で停止・報告)

### Phase 0: 足場
- 現行ファイルを `legacy/` に退避、lineskchkから§5のファイル群をコピーしてViteプロジェクト構築、ブランド文言をみてみてくんに変更、mp4-muxerをnpm追加
- ValidationPanel/stickerValidation関連のimportを除去
- **完了条件**: `npm run dev` 起動、`npm run lint` exit 0、映えチェッカー相当のUIが動く(スタンプZIP→パネル→タップ送信まで)

### Phase 1: データモデル差し替え
- §6の型に置換。sender一般化・gap追加・TalkSettingsCard(F8)・送信者トグルのグループ対応・ScenarioList
- グループ時のアバター/名前/既読N表示(DOM側)
- **完了条件**: グループトークで複数メンバーの会話が組め、ScenarioListでgap編集・並べ替え・削除ができる。lint exit 0

### Phase 2: Canvasエンジン移植
- src/render/ 一式(§8)。まず「再生モーダル」でプレビュー再生(F2/F3)が動くこと
- APNGフルデコードをアップロード経路に組み込み(F10)
- **完了条件**: 再生モーダルで、テキスト/スタンプ/絵文字/リアクション/グループ名表示が現行v1と同等に動き、効果音が鳴る。APNGスタンプが動く

### Phase 3: 書き出し
- exporter.ts移植、ExportOverlay、フォールバック経路、VideoSettingsCard(F5/F6/F7/F9/F14/F4の全項目)
- **完了条件**: 縦/横×主要モードでMP4がダウンロードでき、実ファイルの再生でアニメ・音・APNGを確認(検証したモードの組み合わせを列挙して報告)

### Phase 4: メッセージ操作の仕上げ
- 長押しメニュー拡張(§7.6)、リアクションLINE仕様のDOM表示、クイックリアクション、reactMine
- インライン絵文字(入力バー混在→text content)がCanvas側でも描けることを確認
- **完了条件**: §2の1〜7を全て満たす

### Phase 5: 保留事項の確認(実装前にユーザーへ提示)
- 絵文字メッセージの明示改行UI(§7.2)
- 既存メッセージの内容再編集
- その他Phase報告で挙がった提案

## 10. やらないこと(非目標)

- 映えチェッカーくんの申請規格バリデーション機能の移植
- シナリオの保存/読み込み(現行にも無い。第2弾候補のまま)
- 壁紙への画像設定(§6の統合ルール参照)
- lineskchkリポジトリ側への一切の変更
- 現行v1(legacy)の改修

## 11. リスク・注意点

| 項目 | 内容 |
|---|---|
| DOM/Canvasの二重実装 | 吹き出しの見た目差異は許容するが、**表示有無・並び・色**の不一致はバグ扱い。Phase 2完了時に同一シナリオのDOM/Canvasスクショ比較を報告に含める |
| APNGデコードのメモリ | フルデコード(全コマcanvas化)は重い。ZIP一括取込時は`anim`を遅延デコード(初回再生/書き出し時)にしてよい — 実装が複雑なら全デコードのままでも可(現行と同じ) |
| mp4-muxer npm版 | 現行はグローバル版。npm版のAPI差異(あれば)はexporter.ts内で吸収 |
| OneDrive配下のnode_modules | 同期が遅くなる場合がある。問題が出たら報告(勝手にリポジトリ移動しない) |
| 書き出し中のバックグラウンド減速 | 既知(v1と同じ)。対応不要 |

## 12. Codex⇄ユーザー連携ルール(再掲・厳守)

1. フェーズ完了ごとに: 完了したこと / 実行した検証(コマンド・戻り値・確認手順) / 次にやること / 気になっていること(確信度: 高・中・低)を報告して停止
2. 「動くはず」ではなく実行結果で報告。スキップした検証は理由を明記
3. 仕様の曖昧さは解釈候補+推奨を提示して確認(成果物が変わらない場合のみ独断可)
4. この設計書への修正が必要になったら、差分案を提示して承認後に本ファイルを更新する
