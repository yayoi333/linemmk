import { lazy, Suspense, useEffect, useState } from 'react';
import { Clapperboard, LockKeyhole } from 'lucide-react';
import { checkAccess, guideEntryAllowed, InternalLink, requestedPage, verifyAccessKey } from './access';

const App = lazy(() => import('./App'));
const Guide = lazy(() => import('./Guide'));
const FeaturesGuide = lazy(() => import('./FeaturesGuide'));

export default function AccessRoot() {
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [page, setPage] = useState(requestedPage);
  const [allowed, setAllowed] = useState(guideEntryAllowed);
  const [key, setKey] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let live = true;
    // StrictModeでも、同一の認証処理を共有してURLのキー消去と競合させない。
    initialAccess ??= checkAccess();
    void initialAccess.then(result => { if(live) setAuthorized(result); }).catch(() => { if(live) setAuthorized(false); });
    return () => { live = false; };
  }, []);
  useEffect(() => {
    const update = () => { setPage(requestedPage()); setAllowed(guideEntryAllowed()); };
    window.addEventListener('popstate', update);
    return () => window.removeEventListener('popstate', update);
  }, []);
  useEffect(() => { if(authorized && page === 'app') document.title = 'みてみてくん | LINEトーク動画メーカー'; }, [authorized, page]);
  if (authorized === null) return <div className="min-h-screen grid place-items-center bg-gray-50 text-sm text-gray-500">読み込み中…</div>;
  if (!authorized) return <div className="min-h-screen flex items-center justify-center bg-gray-50 px-5"><div className="w-full max-w-sm rounded-3xl border border-gray-100 bg-white p-8 shadow-sm"><div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50 text-green-600"><Clapperboard size={28} /></div><h1 className="text-center text-xl font-bold text-gray-800">みてみてくん</h1><p className="mt-3 text-center text-sm leading-7 text-gray-500">ご購入時に案内されたリンクから開くか、<br />アクセスキーを入力してください。</p><form className="mt-6" onSubmit={async event => { event.preventDefault(); if(busy) return; setBusy(true); setError(''); try { if(await verifyAccessKey(key.trim())) { setKey(''); setAuthorized(true); } else setError('アクセスキーが違います。もう一度ご確認ください。'); } catch { setError('確認できませんでした。ページを開き直してください。'); } finally { setBusy(false); } }}><label htmlFor="access-key" className="mb-2 flex items-center gap-2 text-xs font-bold text-gray-600"><LockKeyhole size={15} />アクセスキー</label><input id="access-key" type="password" value={key} onChange={event => setKey(event.target.value)} autoComplete="off" autoCapitalize="none" spellCheck={false} required className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-green-500" aria-describedby={error ? 'access-error' : undefined} /><button disabled={busy} className="mt-4 w-full rounded-xl bg-[#06C755] py-3 text-sm font-bold text-white disabled:opacity-50">{busy ? '確認中…' : 'みてみてくんを開く'}</button>{error && <p id="access-error" role="alert" className="mt-3 text-xs leading-6 text-red-600">{error}</p>}</form></div></div>;
  if (page !== 'app' && !allowed) return <div className="min-h-screen grid place-items-center bg-gray-50 px-5"><div className="max-w-sm rounded-3xl bg-white p-8 text-center shadow-sm"><h1 className="text-lg font-bold text-gray-800">使い方はアプリから開けます</h1><p className="mt-3 text-sm leading-7 text-gray-500">みてみてくんの「使い方」から<br />このページを開いてください。</p><InternalLink to="app" className="mt-6 inline-block rounded-xl bg-[#06C755] px-6 py-3 text-sm font-bold text-white">みてみてくんへ</InternalLink></div></div>;
  return <Suspense fallback={<div className="p-8 text-center text-sm text-gray-500">読み込み中…</div>}><div hidden={page !== 'app'}><App /></div>{page === 'guide' && <Guide />}{page === 'features' && <FeaturesGuide />}</Suspense>;
}

let initialAccess: Promise<boolean> | undefined;
