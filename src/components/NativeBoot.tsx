import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { isNative } from '@/lib/native';

/**
 * Mounted once (inside <AuthProvider>) to handle launch-time routing
 * for the native Garage Ace app (used by MMAR Care customers and staff).
 *
 * - On a fresh native launch from `/`, send the user to the right place:
 *     signed-in admin/manager → /admin/dashboard
 *     signed-in staff (tech, advisor, parts) → /tech
 *     signed-in customer → /portal/dashboard
 *     signed-out → /login
 *
 * - Browser/web visitors are never redirected — they see the marketing site as usual.
 *
 * - Also wires Android hardware-back: pop history, or exit app if at root.
 *   Splash screen is hidden once auth has finished resolving.
 */
const NativeBoot = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, roles, isLoading } = useAuth();
  const didBootRedirect = useRef(false);
  const splashHidden = useRef(false);

  // Initial launch redirect (native only, runs once)
  useEffect(() => {
    if (!isNative()) return;
    if (isLoading) return;
    if (didBootRedirect.current) return;

    // Only redirect from "neutral" entry paths so we don't yank a user mid-flow
    // (deep links from push notifications etc. should win).
    const entryPath = location.pathname;
    const neutral = entryPath === '/' || entryPath === '' || entryPath === '/index.html';
    if (!neutral) {
      didBootRedirect.current = true;
      return;
    }

    let target = '/login';
    if (user) {
      if (roles.includes('owner') || roles.includes('admin') || roles.includes('manager')) {
        target = '/admin/dashboard';
      } else if (
        roles.includes('technician') ||
        roles.includes('service_advisor') ||
        roles.includes('parts')
      ) {
        target = '/tech';
      } else {
        target = '/portal/dashboard';
      }
    }

    didBootRedirect.current = true;
    navigate(target, { replace: true });
  }, [isLoading, user, roles, location.pathname, navigate]);

  // Hide splash + configure status bar once we know what we're rendering
  useEffect(() => {
    if (!isNative()) return;
    if (isLoading) return;
    if (splashHidden.current) return;
    splashHidden.current = true;

    (async () => {
      try {
        const { SplashScreen } = await import('@capacitor/splash-screen');
        await SplashScreen.hide();
      } catch {}
      try {
        const { StatusBar, Style } = await import('@capacitor/status-bar');
        await StatusBar.setStyle({ style: Style.Dark });
      } catch {}
    })();
  }, [isLoading]);

  // Android hardware back button: pop history, or exit app at root
  useEffect(() => {
    if (!isNative()) return;
    let remove: (() => void) | undefined;
    (async () => {
      try {
        const { App } = await import('@capacitor/app');
        const handle = await App.addListener('backButton', ({ canGoBack }) => {
          if (canGoBack) {
            window.history.back();
          } else {
            App.exitApp();
          }
        });
        remove = () => handle.remove();
      } catch {}
    })();
    return () => remove?.();
  }, []);

  // Universal Links (iOS) / App Links (Android): when the OS opens the app
  // via an https://... link, route the in-app navigator to the matching path
  // instead of letting the system browser take over.
  useEffect(() => {
    if (!isNative()) return;
    let remove: (() => void) | undefined;
    (async () => {
      try {
        const { App } = await import('@capacitor/app');
        const handle = await App.addListener('appUrlOpen', ({ url }) => {
          try {
            const parsed = new URL(url);
            const path = `${parsed.pathname}${parsed.search}${parsed.hash}` || '/';
            // Mark as resolved so the boot redirect doesn't override the deep link
            didBootRedirect.current = true;
            navigate(path, { replace: false });
          } catch {
            // Not a parseable URL — ignore
          }
        });
        remove = () => handle.remove();
      } catch {}
    })();
    return () => remove?.();
  }, [navigate]);

  return null;
};

export default NativeBoot;
