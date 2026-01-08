// Google Ads conversion tracking utility

declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
  }
}

export const trackConversion = () => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'conversion', {
      'send_to': 'AW-17463969717/WpXhCN-p-t0bELWPvIdB'
    });
  }
};
