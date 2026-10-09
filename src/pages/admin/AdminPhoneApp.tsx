import { useEffect, useState } from 'react';
import { Share, X } from 'lucide-react';
import AdminPhoneHub from '@/components/admin/AdminPhoneHub';
import { markPhoneApp } from '@/lib/phoneApp';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { ensureNotificationPermission, isRegistrationAllowed, subscribeUser } from '@/hooks/useWebPushRegistration';

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
  const { user } = useAuth();
  const [askPush, setAskPush] = useState(false);
  useEffect(() => {
    if (isStandalone() && isRegistrationAllowed() && (window as any).Notification?.permission !== 'granted' && (window as any).Notification?.permission !== 'denied') setAskPush(true);
  }, []);
  useEffect(() => {
    if (!user) return;
    const markRead = () => {
      if (document.visibilityState !== 'visible') return;
      void supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('user_id', user.id).eq('category', 'message_updates').is('read_at', null);
    };
    markRead();
    document.addEventListener('visibilitychange', markRead);
    return () => document.removeEventListener('visibilitychange', markRead);
  }, [user]);
  const enablePush = async () => {
    const perm = await ensureNotificationPermission();
    if (perm === 'granted' && user) { try { await subscribeUser(user.id); } catch {} }
    setAskPush(false);
  };

  useEffect(() => {
    if (isStandalone()) markPhoneApp();
    const undo = [
      setMeta('link[rel="manifest"]', 'href', '/phone.webmanifest'),
      setMeta('link[rel="apple-touch-icon"]', 'href', '/icons/phone-icon-180.png'),
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
      {askPush && (
        <div className="ios fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+84px)] z-[60] rounded-2xl ios-frost border border-[hsl(var(--ios-separator))] p-4 text-[15px] shadow-lg">
          <p className="font-semibold mb-1">Get call and text alerts here</p>
          <p className="text-[hsl(var(--ios-label-2))] mb-3">Calls, texts, chat and email alerts will show up in MMAR Phone.</p>
          <div className="flex gap-2">
            <button onClick={enablePush} className="flex-1 rounded-xl bg-[hsl(var(--ios-blue))] py-2.5 font-semibold text-[hsl(var(--ios-label))]">Allow notifications</button>
            <button onClick={() => setAskPush(false)} className="rounded-xl px-4 py-2.5 text-[hsl(var(--ios-label-2))]">Later</button>
          </div>
        </div>
      )}
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
