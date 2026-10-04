export interface FeatureItem {
  id: string;
  label: string;
  detail: string;
  left: string;
  right: string;
  result?: string;
  source?: string;
  outcome: string;
}
export interface FeatureSection {
  id: string;
  title: string;
  intro: string;
  source: string;
  result: string;
  sourceLabel: string;
  resultLabel: string;
  items: FeatureItem[];
}

export const featureSections: FeatureSection[] = [
  { id: 'appearance', title: '名前・表示の設定', intro: '名前、既読、☆。スイッチと画面のどこが対応するか。', source: 'appearance-settings', result: 'phone-appearance', sourceLabel: '名前設定・プレビュー設定', resultLabel: 'スマホのトーク画面', items: [
    { id: 'name', label: '相手の名前', left: 'name', right: 'name', outcome: '上部の名前が変わる', detail: '入力した名前がトーク上部と、相手のメッセージの上に表示されます。' },
    { id: 'notch', label: 'ノッチ', left: 'notch', right: 'notch', outcome: '上の黒い切り欠きを表示', detail: '「スマホのノッチを表示」をONにすると、編集画面のスマホ上部に黒い切り欠きが現れます。' },
    { id: 'read', label: '既読', left: 'read', right: 'read', outcome: '自分の発言に「既読」', detail: 'ONにすると、自分が送ったメッセージの横に既読を表示します。相手のメッセージには付きません。' },
    { id: 'count', label: '既読数', left: 'count', right: 'read', outcome: '「既読 2」の数字を変える', detail: '既読をONにすると数字の欄が現れます。0なら「既読」の文字だけ、1以上なら人数も表示されます。' },
    { id: 'star', label: 'お気に入り（☆）', left: 'star', right: 'star', outcome: '送ったスタンプの横に☆', detail: 'ONにすると、自分が送ったスタンプの横に☆が付きます。文字メッセージや絵文字には付きません。' },
    { id: 'loop', label: '動くスタンプの連続再生', left: 'loop', right: 'sticker', outcome: '動く素材を繰り返し再生', detail: 'APNGのスタンプ・絵文字は、ONで繰り返し動きます。OFFでは素材の再生回数に従います。編集画面で素材をタップすると、もう一度再生できます。静止PNGは動きません。' },
    { id: 'senderName', label: 'トーク内の名前', left: 'senderName', right: 'senderName', outcome: '相手の発言の上に名前', detail: '相手のメッセージの上に出る名前を表示・非表示にします。トーク上部の名前はそのままです。' },
    { id: 'fullscreen', label: '全画面表示モード', left: 'fullscreen', right: 'talk', result: 'phone-fullscreen', outcome: '編集画面を端末いっぱいに', detail: 'スマホ画面を端末いっぱいに広げて編集できます。右上の×で戻れます。動画のフレームを変える場合は「動画の設定」の見せ方を選びます。' },
  ] },
  { id: 'materials', title: 'スタンプ・絵文字の追加', intro: '入れた素材は、スマホ下の一覧から使います。', source: 'upload-settings', result: 'phone-appearance', sourceLabel: 'アップロード欄', resultLabel: '追加された素材一覧', items: [
    { id: 'stickerPng', label: 'スタンプのPNG', left: 'stickerPng', right: 'panel', outcome: 'スタンプ一覧に追加', detail: '「PNGで追加」で1枚でも複数枚でも追加できます。動くAPNGもPNGとして読み込めます。' },
    { id: 'stickerZip', label: 'スタンプのZIP', left: 'stickerZip', right: 'groups', outcome: 'まとめて1グループに', detail: '申請用ZIP内のPNGをまとめて追加します。main.pngは一覧から除外、tab.pngはグループのタブ画像に使われます。ZIP内のファイル名順に並びます。' },
    { id: 'emojiPng', label: '絵文字のPNG', left: 'emojiPng', right: 'emoji', result: 'emoji-input', outcome: '絵文字一覧に追加', detail: '絵文字は下段の「PNGで追加」へ。スマホ下の切り替えアイコンで絵文字一覧を開いて選びます。' },
    { id: 'emojiZip', label: '絵文字のZIP', left: 'emojiZip', right: 'group', result: 'emoji-input', outcome: '絵文字のグループを追加', detail: '下段の「ZIPで一括追加」で、絵文字もまとめて追加できます。スタンプ・絵文字はそれぞれ5グループまで追加できます。' },
    { id: 'remove', label: '素材グループを削除', left: 'remove', right: 'groups', outcome: '一覧からグループを外す', detail: '素材名の右のごみ箱を押し、確認すると、そのグループが一覧から消えます。すでに送ったメッセージは残ります。' },
  ] },
  { id: 'conversation', title: '会話をつくる', intro: '自分・相手を選んで、文字やスタンプを追加します。', source: 'talk-controls', result: 'phone-appearance', sourceLabel: 'スマホ下の操作', resultLabel: 'トークに入る場所', items: [
    { id: 'received', label: '受信', left: 'received', right: 'senderName', outcome: '相手の発言は左側', detail: '「受信」を選んでから送ると、相手の発言として左側に表示されます。文字・スタンプ・絵文字に共通です。' },
    { id: 'sent', label: '送信', left: 'sent', right: 'sticker', outcome: '自分の発言は右側', detail: '「送信」を選んでから送ると、自分の発言として右側に表示されます。' },
    { id: 'input', label: '文字を入力', left: 'input', right: 'message', result: 'phone-reaction', outcome: '入力した文が吹き出しに', detail: '入力欄に文字を入れ、紙飛行機またはEnterで送信。Shift＋Enterで改行できます。空の入力欄は送信できません。' },
    { id: 'send', label: '紙飛行機で送る', left: 'send', right: 'bubble', result: 'phone-emoji', outcome: '文字と絵文字をまとめて送信', detail: '入力欄にある文字・絵文字を、1つのメッセージとして送ります。' },
    { id: 'sticker', label: 'スタンプを送る', left: 'sticker', right: 'sticker', outcome: 'タップしたスタンプが入る', detail: 'スタンプ一覧で画像をタップすると、そのままトークに追加されます。紙飛行機を押す必要はありません。' },
    { id: 'category', label: 'スタンプ／絵文字の切り替え', left: 'category', right: 'category', result: 'emoji-input', outcome: '下の一覧が切り替わる', detail: '一覧の左上にある、顔が重なったアイコンを押すと、スタンプと絵文字を切り替えます。' },
    { id: 'groups', label: '素材グループの切り替え', left: 'groups', right: 'groups', outcome: '選んだグループの一覧へ', detail: '上の小さな画像タブを押すと、そのグループの素材を表示します。複数追加したときに使います。' },
  ] },
  { id: 'emoji', title: '絵文字を混ぜる', intro: '文字の途中にも、絵文字だけでも。', source: 'emoji-input', result: 'phone-emoji', sourceLabel: '絵文字を選んだ入力欄', resultLabel: '送ったメッセージ', items: [
    { id: 'inline', label: '文字＋絵文字', left: 'input', right: 'bubble', outcome: '吹き出しの中に絵文字', detail: '文字を入力してから絵文字をタップすると、その続きに入ります。さらに文字や絵文字を足して、紙飛行機でまとめて送れます。' },
    { id: 'emojiOnly', label: '絵文字だけで送る', left: 'emoji', right: 'bubble', outcome: '絵文字だけのメッセージも', detail: '文字を入れずに絵文字を選んで送信できます。絵文字だけで1〜3個なら、文字と混ぜるときより大きく表示されます。' },
    { id: 'undoEmoji', label: '送る前の絵文字を外す', left: 'input', right: 'bubble', outcome: '送信前に内容を調整', detail: '入力欄の絵文字にカーソルを合わせ、ごみ箱を押すと外せます。文字が空の状態でBackspaceを押すと、最後に入れた素材や文字を外せます。' },
  ] },
  { id: 'messages', title: '送ったメッセージの操作', intro: '右クリック。スマホでは長押し。', source: 'message-menu', result: 'phone-reaction', sourceLabel: 'メッセージの操作メニュー', resultLabel: '操作するメッセージ', items: [
    { id: 'sender', label: '送⇔受 切り替え', left: 'sender', right: 'message', outcome: '発言者を入れ替える', detail: '選んだメッセージの発言者を、自分から相手、相手から自分へ入れ替えます。左右の表示も切り替わります。' },
    { id: 'gap', label: '間隔（秒）', left: 'gap', right: 'message', outcome: 'この発言が出るまでの時間', detail: '前の発言から、このメッセージが現れるまでの待ち時間を指定します。最小0.2秒。テンポは動画プレビューで確認できます。' },
    { id: 'reaction', label: 'リアクション', left: 'reaction', right: 'reaction', outcome: '発言の下に小さな絵文字', detail: '「リアクションを選択」を押すと絵文字一覧が開きます。絵文字を1つ選ぶと、操作したメッセージの下に付きます。繰り返すと追加できます。' },
    { id: 'delete', label: 'メッセージを削除', left: 'remove', right: 'message', outcome: 'この発言をトークから外す', detail: '操作メニューの「メッセージを削除」で、この1件を削除します。PCではメッセージにカーソルを合わせて現れるごみ箱からも削除できます。' },
  ] },
  { id: 'background', title: 'トークの背景・履歴', intro: 'スマホの中の色や画像を変えます。', source: 'background-settings', result: 'phone-background', sourceLabel: '背景設定', resultLabel: 'スマホ内の背景', items: [
    { id: 'default', label: '標準背景', left: 'default', right: 'talk', result: 'phone-appearance', outcome: '青い標準背景に戻す', detail: '一番左の青い色ボタンで、標準の背景に戻ります。' },
    { id: 'color', label: '背景色', left: 'color', right: 'background', outcome: 'トーク面の色を変える', detail: '白・マゼンタ・ブルー・黒・グリーン・オレンジから選びます。例は白を選んだ画面です。' },
    { id: 'image', label: '背景画像', left: 'image', right: 'background', outcome: 'ここに画像が入る', detail: '＋のボタンから画像を選ぶと、トーク面と上部の背景になります。画面に合わせて画像の一部が切り取られることがあります。' },
    { id: 'clear', label: 'トーククリア', left: 'clear', right: 'background', outcome: 'トーク履歴をまとめて消す', detail: '「トーククリア」を押し、確認すると、すべてのメッセージが消えます。アップロードした素材や設定は残ります。' },
  ] },
  { id: 'gear', title: 'スマホ内の歯車メニュー', intro: 'スマホ画面からも、同じ設定を変更できます。', source: 'phone-appearance', result: 'phone-gear', sourceLabel: '一覧右上の歯車', resultLabel: '開いた設定パネル', items: [
    { id: 'gear', label: '歯車を開く・閉じる', left: 'gear', right: 'settings', outcome: '一覧が設定パネルに切り替わる', detail: '歯車を押すと、スマホ下の素材一覧が設定に切り替わります。もう一度押すとスタンプ一覧に戻ります。' },
    { id: 'shared', label: '右の設定と連動', left: 'name', right: 'name', outcome: 'どちらで変えても同じ名前', detail: '相手の名前、ノッチ、☆、既読・既読数、全画面モード、連続再生、相手名表示、背景を変更できます。右側の設定と連動します。' },
    { id: 'scroll', label: '下へスクロール', left: 'gear', right: 'settings', outcome: '背景・動画設定は下の方に', detail: '歯車パネルの中を下へスクロールすると、背景、履歴クリア、動画設定、プレビュー再生、動画書き出しも使えます。' },
  ] },
  { id: 'video', title: '動画の形・背景・パネル', intro: 'ここで選んだ見せ方は、動画プレビューに反映されます。', source: 'video-settings', result: 'video-output', sourceLabel: '動画の設定', resultLabel: '完成動画のプレビュー', items: [
    { id: 'vertical', label: '縦型 9:16', left: 'vertical', right: 'frame', outcome: '縦長の動画にする', detail: '1080×1920の縦型動画。フレームあり・全画面の2種類を選べます。' },
    { id: 'horizontal', label: '横型 16:9', left: 'horizontal', right: 'talk', result: 'sample-horizontal-frame', outcome: '横長の動画にする', detail: '1920×1080の横型動画。のぞき見・フレームあり・全画面の3種類を選べます。' },
    { id: 'frame', label: '縦型・フレームあり', left: 'frame', right: 'frame', outcome: 'スマホ全体を背景の上に', detail: 'スマホのフレームと外側の背景を含めて見せます。' },
    { id: 'full', label: '縦型・全画面', left: 'full', right: 'talk', result: 'sample-vertical-full', outcome: 'トーク画面が縦いっぱいに', detail: '黒いスマホフレームを外し、トーク画面を動画いっぱいに表示します。' },
    { id: 'background', label: 'スマホ外側の背景', left: 'background', right: 'background', outcome: 'スマホの外の余白を変える', detail: 'デフォルト・単色・画像を選べます。単色を選ぶと色の入力欄、画像を選ぶと「画像を選択」が現れます。フレームあり、または横型のぞき見で使えます。' },
    { id: 'panel', label: '動画内パネル', left: 'panel', right: 'panel', outcome: '動画にも素材一覧を入れる', detail: '「表示する」をONにすると、動画内にスタンプ・絵文字の選択パネルが入ります。縦型と横型のフレームありで使えます。' },
    { id: 'panelTab', label: 'パネルのスタンプ／絵文字', left: 'panelTab', right: 'panel', outcome: '動画に出す一覧を選ぶ', detail: '動画内パネルをONにして、スタンプか絵文字を選びます。編集画面で開いているタブとは別に、動画用の一覧を指定できます。' },
  ] },
  { id: 'horizontal', title: '横型の3つの見せ方', intro: '同じ会話でも、窓の切り取り方が変わります。', source: 'horizontal-settings', result: 'sample-horizontal-peek', sourceLabel: '横型の見せ方', resultLabel: '完成動画の1コマ', items: [
    { id: 'peek', label: 'のぞき見', left: 'peek', right: 'talk', result: 'sample-horizontal-peek', outcome: 'スマホを横長の窓からのぞく', detail: '中央のスマホ画面を大きく表示し、上下を切り取る見せ方。上部の名前と入力欄は入り、素材一覧は入りません。' },
    { id: 'frame', label: 'フレームあり', left: 'frame', right: 'frame', result: 'sample-horizontal-frame', outcome: '横長の背景にスマホ全体', detail: '背景の中央に、スマホ全体を配置します。動画内パネルを表示することもできます。' },
    { id: 'full', label: '全画面', left: 'full', right: 'talk', result: 'sample-horizontal-full', outcome: '会話が横いっぱいに', detail: 'トーク面だけを横いっぱいに表示します。上部の相手名・入力欄・素材一覧は入りません。' },
  ] },
  { id: 'playback', title: '音・テンポ・書き出し', intro: '再生して確かめてから、完成動画を保存します。', source: 'video-settings', result: 'video-output', sourceLabel: '動画の設定', resultLabel: '動画プレビュー', items: [
    { id: 'sound', label: '効果音（シュポ音）', left: 'sound', right: 'talk', outcome: 'メッセージの登場に合わせて音', detail: 'ONで、受信・送信に合わせた効果音が入ります。プレビュー再生と書き出した動画に反映されます。' },
    { id: 'intro', label: '冒頭の間隔', left: 'intro', right: 'talk', outcome: '最初の発言までに間を足す', detail: '動画の冒頭の待ち時間です。最初のメッセージ自身の「間隔（秒）」も加わります。0なら、冒頭に追加の間を入れません。' },
    { id: 'preview', label: 'プレビュー再生', source: 'talk-controls', left: 'preview', right: 'talk', outcome: '動画の完成形を確認', detail: '動画プレビューを開きます。「再生」で会話が順番に現れ、「停止」で最後の状態に戻ります。「閉じる」で編集画面へ戻れます。' },
    { id: 'play', label: '再生・停止・閉じる', source: 'preview-controls', left: 'play', right: 'talk', outcome: '会話の順番とテンポを確認', detail: '再生中は「再生」が「停止」に変わります。音量は端末で調整できます。「閉じる」で編集に戻ります。' },
    { id: 'export', label: '動画を書き出す', source: 'talk-controls', left: 'export', right: 'frame', outcome: '完成した自分の動画を保存', detail: '「動画を書き出す」を押すと書き出しが始まり、完了時に動画ファイルが保存されます。プレビュー内の「書き出す」からも保存できます。書き出し中はページを閉じずに待ってください。' },
    { id: 'format', label: 'MP4／WebM', source: 'preview-controls', left: 'export', right: 'frame', outcome: 'ブラウザに対応した形式で保存', detail: '対応ブラウザではMP4で書き出します。非対応の場合はリアルタイム録画に切り替わり、ブラウザによってMP4またはWebMになります。' },
  ] },
];
