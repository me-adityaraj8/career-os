/**
 * Umami page-view tracking. No-ops unless both env vars are set, so local
 * dev and forks stay untracked by default. Umami is cookieless and
 * privacy-friendly — no consent banner required.
 */
export function initAnalytics(): void {
  const { VITE_UMAMI_SRC: src, VITE_UMAMI_WEBSITE_ID: websiteId } = import.meta.env;
  if (!src || !websiteId) return;

  const script = document.createElement('script');
  script.defer = true;
  script.src = src;
  script.setAttribute('data-website-id', websiteId);
  document.head.appendChild(script);
}
