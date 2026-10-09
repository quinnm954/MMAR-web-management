// Remembers that this home-screen install is the MMAR Phone app.
// iOS gives each home-screen app its own storage, so this flag stays with the Phone app.
const KEY = 'mmarPhoneApp';
export const isStandalone = () =>
  typeof window !== 'undefined' &&
  (window.matchMedia?.('(display-mode: standalone)').matches || (navigator as any).standalone === true);
export const markPhoneApp = () => { try { localStorage.setItem(KEY, '1'); } catch {} };
export const isPhoneApp = () => {
  try { return isStandalone() && localStorage.getItem(KEY) === '1'; } catch { return false; }
};
