import type { AnchorHTMLAttributes, MouseEvent } from 'react';

// 他の商品と認証を共有しない。配布キーの平文はアプリに保存しない。
const ACCESS_HASH = '4700b700378e49f305835c5a9e9bb379e43ab8088b6e3231eb90fb49d88c3a48';
const AUTH_STORAGE = 'mitemitekun_access_v1';
const GUIDE_STORAGE = 'mitemitekun_guide_tab_v1';
export type Page = 'app' | 'guide' | 'features';

export async function verifyAccessKey(key: string): Promise<boolean> {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(key));
  const hash = Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, '0')).join('');
  if (hash !== ACCESS_HASH) return false;
  try { localStorage.setItem(AUTH_STORAGE, ACCESS_HASH); } catch { /* 現在の画面では認証を続行できる */ }
  return true;
}

export async function checkAccess(): Promise<boolean> {
  const params = new URLSearchParams(window.location.hash.slice(1));
  const key = params.get('access');
  if (key !== null) {
    // キーをアドレス欄・現在の履歴から取り除く。認証失敗も同様。
    params.delete('access');
    const rest = params.toString();
    history.replaceState(history.state, '', `${location.pathname}${location.search}${rest ? `#${rest}` : ''}`);
    return verifyAccessKey(key);
  }
  try { return localStorage.getItem(AUTH_STORAGE) === ACCESS_HASH; } catch { return false; }
}

export function requestedPage(): Page {
  const params = new URLSearchParams(location.search);
  return params.has('features') ? 'features' : params.has('guide') ? 'guide' : 'app';
}

let tabToken: string | null = null;
function guideToken(): string {
  if (tabToken) return tabToken;
  try { tabToken = sessionStorage.getItem(GUIDE_STORAGE); } catch { /* 保存できない場合はメモリで管理 */ }
  if (!tabToken) {
    tabToken = crypto.randomUUID();
    try { sessionStorage.setItem(GUIDE_STORAGE, tabToken); } catch { /* 再読み込み時はアプリから開き直す */ }
  }
  return tabToken;
}

// URLだけではガイドの閲覧権を渡さない。アプリ内の移動で作った履歴だけを許可。
export function guideEntryAllowed(): boolean {
  return history.state?.mitemiteGuide === guideToken();
}

export function navigateTo(page: Page, hash = '') {
  const url = `${import.meta.env.BASE_URL}${page === 'app' ? '' : `?${page}`}${hash}`;
  history.pushState(page === 'app' ? null : { mitemiteGuide: guideToken() }, '', url);
  window.dispatchEvent(new PopStateEvent('popstate'));
  if (hash) requestAnimationFrame(() => document.getElementById(hash.slice(1))?.scrollIntoView());
  else window.scrollTo(0, 0);
}

export function InternalLink({ to, hash = '', onClick, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { to: Page; hash?: string }) {
  const click = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault(); navigateTo(to, hash);
  };
  return <a {...props} href={`${import.meta.env.BASE_URL}${to === 'app' ? '' : `?${to}`}${hash}`} onClick={click} />;
}
