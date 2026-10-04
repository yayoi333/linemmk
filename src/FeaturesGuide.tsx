import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Clapperboard, Search, X } from 'lucide-react';
import screenData from './featureScreens';
import { featureSections, type FeatureSection } from './featureCatalog';
import './guide.css';
import './features.css';
import { InternalLink } from './access';

interface Box { x: number; y: number; w: number; h: number }
interface Screen { image: string; width: number; height: number; boxes: Record<string, Box> }
const screens: Record<string, Screen> = screenData;
const asset = (screen: Screen) => `${import.meta.env.BASE_URL}guide/features/${screen.image}`;
interface Zoom { screen: Screen; box: Box; label: string }
interface Geometry { width: number; height: number; left: Box; right: Box }

function scribble(box: Box, pad = 9) {
  const cx = box.x + box.w / 2, cy = box.y + box.h / 2;
  const rx = box.w / 2 + pad, ry = box.h / 2 + pad;
  return `M ${cx+rx} ${cy-4} C ${cx+rx+8} ${cy+ry} ${cx-rx+5} ${cy+ry+8} ${cx-rx} ${cy+3} C ${cx-rx-9} ${cy-ry-5} ${cx+rx-7} ${cy-ry-10} ${cx+rx+2} ${cy+6}`;
}

function FeatureBoard({ section, query, openZoom }: { section: FeatureSection; query: string; openZoom: (zoom: Zoom) => void }) {
  const items = section.items.filter(item => `${section.title} ${item.label} ${item.detail}`.includes(query));
  const [selected, setSelected] = useState(section.items[0].id);
  const item = items.find(item => item.id === selected) ?? items[0];
  const source = screens[item.source ?? section.source], result = screens[item.result ?? section.result];
  const leftBox = source.boxes[item.left], rightBox = result.boxes[item.right];
  const board = useRef<HTMLDivElement>(null), leftImg = useRef<HTMLImageElement>(null), rightImg = useRef<HTMLImageElement>(null);
  const [geometry, setGeometry] = useState<Geometry | null>(null);
  const arrow = `arrow-${useId().replace(/:/g, '')}`;
  const measure = () => {
    if (!board.current || !leftImg.current || !rightImg.current || !leftBox || !rightBox) return;
    const parent = board.current.getBoundingClientRect();
    const relative = (img: HTMLImageElement, box: Box): Box => { const rect = img.getBoundingClientRect(); return { x: rect.x - parent.x + box.x*rect.width, y: rect.y - parent.y + box.y*rect.height, w: box.w*rect.width, h: box.h*rect.height }; };
    setGeometry({ width: parent.width, height: parent.height, left: relative(leftImg.current, leftBox), right: relative(rightImg.current, rightBox) });
  };
  useLayoutEffect(() => {
    const observer = new ResizeObserver(measure);
    if (board.current) observer.observe(board.current);
    if (leftImg.current) observer.observe(leftImg.current);
    if (rightImg.current) observer.observe(rightImg.current);
    measure(); return () => observer.disconnect();
  }, [item.id, source, result]);
  const number = section.items.findIndex(entry => entry.id === item.id) + 1;
  let connector = '';
  if (geometry) {
    const { left, right } = geometry;
    if (right.x > left.x + left.w) {
      const sx = left.x + left.w + 12, sy = left.y + left.h/2, ex = right.x-14, ey = right.y+right.h/2;
      const mid = (sx+ex)/2;
      connector = `M ${sx} ${sy} C ${mid+14} ${sy-16} ${mid-14} ${ey+16} ${ex} ${ey}`;
    } else {
      const sx = left.x+left.w+12, sy = left.y+left.h/2, ex = right.x+right.w/2, ey = right.y-14;
      const gutter = geometry.width-10;
      connector = `M ${sx} ${sy} C ${gutter} ${sy} ${gutter} ${sy+14} ${gutter} ${sy+28} L ${gutter} ${ey-28} Q ${gutter} ${ey-38} ${gutter-18} ${ey-38} C ${ex+26} ${ey-38} ${ex} ${ey-25} ${ex} ${ey}`;
    }
  }
  return <section id={section.id} className="feature-section">
    <div className="feature-title"><span className="guide-kicker">{String(featureSections.indexOf(section)+1).padStart(2,'0')}</span><div><h2>{section.title}</h2><p>{section.intro}</p></div></div>
    <div className="feature-options" aria-label={`${section.title}の項目`}>{items.map((entry) => <button key={entry.id} aria-pressed={entry.id === item.id} onClick={() => setSelected(entry.id)}><span>{section.items.indexOf(entry)+1}</span>{entry.label}</button>)}</div>
    <div className="feature-caption" aria-live="polite"><span>{number}</span><div><h3>{item.outcome}</h3><p>{item.detail}</p></div></div>
    <div className="feature-board" ref={board}>
      <figure className="feature-source"><figcaption>{item.source === 'preview-controls' ? 'プレビューの操作ボタン' : item.source === 'talk-controls' ? 'スマホ下の操作' : section.sourceLabel}</figcaption><button aria-label={`${item.label}の操作場所を拡大`} onClick={() => openZoom({ screen: source, box: leftBox, label: '操作する場所' })}><img ref={leftImg} src={asset(source)} alt={`${section.title}の操作画面`} loading="lazy" onLoad={measure} /></button></figure>
      <figure className="feature-result"><figcaption>{item.result === 'phone-fullscreen' ? '全画面になった編集画面' : section.resultLabel}</figcaption><button aria-label={`${item.label}の表示場所を拡大`} onClick={() => openZoom({ screen: result, box: rightBox, label: item.outcome })}><img ref={rightImg} src={asset(result)} alt={`${item.outcome}の表示先`} loading="lazy" onLoad={measure} /></button></figure>
      {geometry && <svg className="feature-lines" width={geometry.width} height={geometry.height} aria-hidden="true"><defs><marker id={arrow} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 1 1 L 8 5 L 1 9" fill="none" stroke="#ed343c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></marker></defs><path d={scribble(geometry.left)} /><path d={scribble(geometry.right)} /><path d={connector} className="feature-connector" markerEnd={`url(#${arrow})`} />{[geometry.left, geometry.right].map((box, i) => <g key={i}><circle cx={box.x+box.w-2} cy={box.y-12} r="12" fill="#ed343c" stroke="white" strokeWidth="2" /><text x={box.x+box.w-2} y={box.y-8} textAnchor="middle" fill="white" stroke="none" fontSize="12" fontWeight="bold">{number}</text></g>)}</svg>}
    </div>
  </section>;
}

export default function FeaturesGuide() {
  const [query, setQuery] = useState('');
  const [zoom, setZoom] = useState<Zoom | null>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const filter = query.trim();
  const sections = featureSections.filter(section => section.items.some(item => `${section.title} ${item.label} ${item.detail}`.includes(filter)));
  useEffect(() => {
    document.title = '全機能ガイド | みてみてくん';
    const robots = document.createElement('meta'); robots.name = 'robots'; robots.content = 'noindex, nofollow'; document.head.append(robots);
    return () => robots.remove();
  }, []);
  useEffect(() => {
    if (!zoom) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const before = document.body.style.overflow; document.body.style.overflow = 'hidden'; closeButton.current?.focus();
    const onKey = (e: KeyboardEvent) => { if(e.key === 'Escape') setZoom(null); if(e.key === 'Tab') { e.preventDefault(); closeButton.current?.focus(); } };
    document.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = before; document.removeEventListener('keydown', onKey); previousFocus?.focus(); };
  }, [zoom]);
  return <div className="guide-page features-page">
    <header className="guide-header"><InternalLink to="app" className="guide-brand"><Clapperboard size={23} /><span>みてみてくん</span></InternalLink><div className="feature-header-links"><InternalLink to="guide">はじめての使い方</InternalLink><InternalLink className="guide-back" to="app"><ArrowLeft size={16} />アプリへ</InternalLink></div></header>
    <main className="guide-main"><section className="feature-hero"><p className="guide-kicker">みてみてくん / ALL FEATURES</p><h1>この設定は、<br /><span>画面のここ。</span></h1><p>項目を選ぶと、操作する場所と表示先がつながります。</p><label className="feature-search"><Search size={19} /><input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="名前・既読・絵文字などで探す" aria-label="機能を検索" /></label></section>
      <nav className="feature-nav" aria-label="全機能ガイドの目次">{sections.map(section => <a key={section.id} href={`#${section.id}`}>{section.title}</a>)}</nav>
      {sections.length ? sections.map(section => <FeatureBoard key={section.id} section={section} query={filter} openZoom={setZoom} />) : <p className="feature-empty">該当する機能がありません。別の言葉で検索してください。</p>}
      <aside className="feature-save-note"><h2>作り終えたら、動画を書き出して保存。</h2><p>設定の一部はブラウザに保存されます。会話・アップロード素材・背景画像は再読み込みで消えるので、完成動画を保存してから閉じてください。</p><InternalLink to="guide" hash="#samples">5種類の完成動画を見る <ArrowRight size={17} /></InternalLink></aside>
    </main><footer className="guide-footer">みてみてくん 🎬 ・ 画面は最新版のPC表示です。</footer>
    {zoom && <div className="guide-lightbox" role="dialog" aria-modal="true" aria-label={zoom.label} onClick={() => setZoom(null)}><button ref={closeButton} className="guide-close" aria-label="拡大画像を閉じる" onClick={() => setZoom(null)}><X /></button><div className="feature-zoom" style={{ width: `min(calc(100vw - 50px), calc((100dvh - 110px) * ${zoom.screen.width / zoom.screen.height}))`, aspectRatio: `${zoom.screen.width} / ${zoom.screen.height}` }} onClick={e => e.stopPropagation()}><img src={asset(zoom.screen)} alt={zoom.label} /><svg viewBox={`0 0 ${zoom.screen.width} ${zoom.screen.height}`} className="feature-lines" aria-hidden="true"><path d={scribble({ x: zoom.box.x*zoom.screen.width, y: zoom.box.y*zoom.screen.height, w: zoom.box.w*zoom.screen.width, h: zoom.box.h*zoom.screen.height }, 14)} /></svg></div></div>}
  </div>;
}

