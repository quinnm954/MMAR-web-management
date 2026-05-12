import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { isNative, nativePlatform } from '@/lib/native';

/**
 * Registers the device for push notifications inside the native Garage Ace app
 * and stores the resulting APNs/FCM token against the signed-in user.
 *
 * Safe to mount inside any portal layout — does nothing on the web.
 */
export const useNativePushRegistration = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!isNative()) return;
    if (!user) return;

    let removeRegistered: (() => void) | undefined;
    let removeError: (() => void) | undefined;
    let removeReceived: (() => void) | undefined;
    let removeAction: (() => void) | undefined;

    (async () => {
      try {
        const { PushNotifications } = await import('@capacitor/push-notifications');

        // Check / request permissions
        let perm = await PushNotifications.checkPermissions();
        if (perm.receive === 'prompt' || perm.receive === 'prompt-with-rationale') {
          perm = await PushNotifications.requestPermissions();
        }
        if (perm.receive !== 'granted') {
          // Mark preference as off so the customer can re-enable manually later
          await supabase.from('notification_preferences').upsert(
            { user_id: user.id, push_enabled: false },
            { onConflict: 'user_id' },
          );
          return;
        }

        const r1 = await PushNotifications.addListener('registration', async (token) => {
          const platform = nativePlatform();
          await supabase
            .from('device_tokens')
            .upsert(
              {
                user_id: user.id,
                token: token.value,
                platform,
                last_seen_at: new Date().toISOString(),
              },
              { onConflict: 'user_id,token' },
            );
        });
        removeRegistered = () => r1.remove();

        const r2 = await PushNotifications.addListener('registrationError', (err) => {
          console.error('Push registration error', err);
        });
        removeError = () => r2.remove();

        const r3 = await PushNotifications.addListener(
          'pushNotificationReceived',
          (notification) => {
            console.log('Push received in foreground', notification);
          },
        );
        removeReceived = () => r3.remove();

        const r4 = await PushNotifications.addListener(
          'pushNotificationActionPerformed',
          (action) => {
            const data = action.notification?.data as { url?: string } | undefined;
            if (data?.url && typeof data.url === 'string') {
              window.location.assign(data.url);
            }
          },
        );
        removeAction = () => r4.remove();

        await PushNotifications.register();
      } catch (err) {
        console.error('Push setup failed', err);
      }
    })();

    return () => {
      removeRegistered?.();
      removeError?.();
      removeReceived?.();
      removeAction?.();
    };
  }, [user]);
};
