import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Clapperboard, X } from 'lucide-react';
import { sampleModes } from './guideSamples';
import './guide.css';
import { InternalLink } from './access';

const asset = (name: string) => `${import.meta.env.BASE_URL}guide/${name}`;
const steps = [
  { number: '01', title: 'スタンプを入れる', text: 'PNGなら「PNGで追加」。申請用ZIPを持っているなら「ZIPで一括追加」。絵文字は、その下の絵文字欄へ。', image: '01-upload', alt: 'アップロード欄のZIPで一括追加・PNGで追加を、手描き風の赤丸で囲んだ画面', wide: true },
  { number: '02', title: '相手と自分の会話をつくる', text: '相手のセリフは「受信」、自分のセリフは「送信」を選択。入力欄に文字を入れて、右の紙飛行機を押します。', image: '02-talk', alt: '受信・送信、メッセージ入力欄と紙飛行機ボタンを赤丸で囲んだ画面' },
  { number: '03', title: 'スタンプをタップして送る', text: '下の一覧から使いたいスタンプをタップ。それだけでトークに追加されます。送る前に「受信／送信」を選んでおきます。', image: '03-sticker', alt: 'アップロードしたねこスタンプをトークに送信し、一覧のスタンプを赤丸で示した画面' },
  { number: '04', title: '動画の形を選ぶ', text: '「動画の設定」で縦型・横型を選びます。迷ったら、下の動画見本で出来上がりを見てから選んでOK。', image: '04-format', alt: '動画の設定にある横型16対9のボタンを赤丸で囲んだ画面', wide: true },
  { number: '05', title: '再生して、動画にする', text: '「プレビュー再生」で順番とテンポを確認。よければ「動画を書き出す」を押して、書き出し完了まで待ちます。', image: '06-export', alt: 'プレビュー再生と動画を書き出すボタンを赤丸で囲んだ画面' },
];

export default function Guide() {
  const [zoom, setZoom] = useState<typeof steps[number] | null>(null);
  useEffect(() => {
    document.title = '使い方と動画見本 | みてみてくん';
    const robots = document.createElement('meta'); robots.name = 'robots'; robots.content = 'noindex, nofollow'; document.head.append(robots);
    return () => robots.remove();
  }, []);
  useEffect(() => {
    if (!zoom) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setZoom(null); };
    const before = document.body.style.overflow; document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = before; document.removeEventListener('keydown', onKey); };
  }, [zoom]);
  return <div className="guide-page">
    <header className="guide-header"><InternalLink to="app" className="guide-brand"><Clapperboard size={23} /><span>みてみてくん</span></InternalLink><InternalLink to="features" className="guide-back">全機能ガイド</InternalLink><InternalLink className="guide-back" to="app"><ArrowLeft size={16} />アプリへ</InternalLink></header>
    <main className="guide-main">
      <section className="guide-hero"><p className="guide-kicker">みてみてくん / VISUAL GUIDE</p><h1>見ながらつくる。<br /><span>トークが、動画になる。</span></h1><p>赤丸の場所を順に押すだけ。<br />まずはスタンプを入れて、短い会話をつくってみよう。</p><div className="guide-hero-links"><a href="#steps">画面で使い方を見る <ArrowRight size={17} /></a><a href="#samples">出来上がりの動画を見る ↓</a></div></section>
      <section id="steps" className="guide-section"><div className="guide-section-heading"><p className="guide-kicker">HOW TO</p><h2>5つの画面で、最初の1本。</h2></div><div className="guide-step-grid">{steps.map(step => <article key={step.number} className={`guide-step ${step.wide ? 'guide-step-wide' : ''}`}><div className="guide-step-copy"><span className="guide-number">{step.number}</span><div><h3>{step.title}</h3><p>{step.text}</p></div></div><button className="guide-image-button" aria-label={`${step.title}のスクショを拡大`} onClick={() => setZoom(step)}><img src={asset(`${step.image}.png`)} alt={step.alt} loading="lazy" /><span>タップで拡大 ↗</span></button></article>)}</div></section>
      <section id="samples" className="guide-section guide-samples"><div className="guide-section-heading"><p className="guide-kicker">VIDEO SAMPLES</p><h2>5つの見せ方を、動画で比べる。</h2><p>同じ会話を、5つの見せ方で書き出しました。<br />再生ボタンを押して、出来上がりを比べてみてください。</p></div><div className="guide-video-grid">{sampleModes.map(mode => <article className={`guide-video-card ${mode.format === 'v' ? 'guide-vertical' : 'guide-horizontal'}`} key={mode.id}><div className="guide-video-heading"><span className="guide-ratio">{mode.format === 'v' ? '9:16' : '16:9'}</span><h3>{mode.title}</h3></div><video controls controlsList="nodownload" playsInline preload="none" poster={asset(`${mode.id}.png`)} aria-label={`${mode.title}の完成動画見本`} src={asset(`${mode.id}.mp4`)} /><p>{mode.description}</p></article>)}</div><p className="guide-small">見本はオリジナルのねこ素材を使ったサンプルです。効果音が入っています。再生時は端末の音量を調整してください。</p></section>
      <section className="guide-tips"><h2>ちょっとだけ、覚えておくと便利。</h2><div><p><strong>絵文字は入力欄に。</strong><br />絵文字タブで選ぶと入力欄に入り、文字と一緒に送れます。</p><p><strong>送った会話を直したいとき。</strong><br />メッセージを右クリック（スマホでは長押し）すると操作メニューが開きます。送信者や間隔を変えたり、削除したりできます。</p><p><strong>完成したら保存を。</strong><br />会話やアップロード画像は再読み込みで消えます。動画を書き出してからページを閉じてください。</p></div><InternalLink to="app">アプリを開いて、つくってみる <ArrowRight size={18} /></InternalLink></section>
    </main><footer className="guide-footer">みてみてくん 🎬 ・ ガイドの画面は最新版のPC表示です。</footer>
    {zoom && <div className="guide-lightbox" role="dialog" aria-modal="true" aria-label={zoom.title} onClick={() => setZoom(null)}><button autoFocus className="guide-close" aria-label="拡大画像を閉じる" onClick={() => setZoom(null)}><X /></button><img src={asset(`${zoom.image}.png`)} alt={zoom.alt} onClick={e => e.stopPropagation()} /></div>}
  </div>;
}



