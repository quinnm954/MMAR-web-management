import { useEffect, useState } from 'react';
import { Share, X } from 'lucide-react';
import AdminPhoneHub from '@/components/admin/AdminPhoneHub';
import { markPhoneApp } from '@/lib/phoneApp';

function setMeta(selector: string, attr: string, value: string) {
  const el = document.querySelector(selector);
  if (!el) return () => {};
  const prev = el.getAttribute(attr) || '';
  el.setAttribute(attr, value);
  return () => el.setAttribute(attr, prev);
}

const isStandalone = () =>
  window.matchMedia?.('(display-mode: standalone)').matches || (navigator as any).standalone === true;

export default function AdminPhoneApp() {
  const [showTip, setShowTip] = useState(false);

  useEffect(() => {
    if (isStandalone()) markPhoneApp();
    const undo = [
      setMeta('link[rel="manifest"]', 'href', '/phone.webmanifest'),
      ...Array.from(document.querySelectorAll('meta[name="apple-mobile-web-app-title"]')).map(() =>
        setMeta('meta[name="apple-mobile-web-app-title"]', 'content', 'MMAR Phone')),
    ];
    document.querySelectorAll('meta[name="apple-mobile-web-app-title"]').forEach(m => m.setAttribute('content', 'MMAR Phone'));
    const prevTitle = document.title;
    document.title = 'MMAR Phone';
    const html = document.documentElement; const body = document.body;
    const prevO = [html.style.overscrollBehavior, body.style.overscrollBehavior, body.style.overflow];
    html.style.overscrollBehavior = 'none'; body.style.overscrollBehavior = 'none'; body.style.overflow = 'hidden';
    if (!isStandalone() && window.innerWidth < 1024 && !localStorage.getItem('mmarPhoneTipDismissed')) setShowTip(true);
    return () => {
      undo.forEach(f => f());
      document.title = prevTitle;
      [html.style.overscrollBehavior, body.style.overscrollBehavior, body.style.overflow] = prevO;
    };
  }, []);

  return (
    <>
      <AdminPhoneHub fullscreen />
      {showTip && (
        <div className="ios fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+84px)] z-[60] rounded-2xl ios-frost border border-[hsl(var(--ios-separator))] p-4 text-[15px] shadow-lg">
          <button aria-label="Close" className="absolute right-2 top-2 p-1 text-[hsl(var(--ios-label-2))]" onClick={() => { localStorage.setItem('mmarPhoneTipDismissed', '1'); setShowTip(false); }}><X className="h-5 w-5" /></button>
          <p className="font-semibold mb-1">Add Phone to Home Screen</p>
          <p className="text-[hsl(var(--ios-label-2))]">In Safari tap <Share className="inline h-4 w-4 -mt-1" /> Share, then <b>Add to Home Screen</b>, then <b>Add</b>. Open "MMAR Phone" for the full-screen app.</p>
        </div>
      )}
    </>
  );
}
