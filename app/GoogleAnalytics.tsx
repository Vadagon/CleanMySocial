import Script from "next/script";
import { GA_MEASUREMENT_ID } from "@/lib/site";

/**
 * Keeps the 160+ KiB analytics payload out of the critical rendering path. The
 * tag loads on the visitor's first interaction, or after an eight-second
 * fallback for visitors who only read. Rendered only in production so local
 * development never writes into the live property.
 */
export default function GoogleAnalytics() {
  if (!GA_MEASUREMENT_ID || process.env.NODE_ENV !== "production") return null;

  return (
    <Script id="ga-loader" strategy="afterInteractive">
      {`window.dataLayer = window.dataLayer || [];
window.gtag = window.gtag || function gtag(){dataLayer.push(arguments);};
(function () {
  var loaded = false;
  function loadAnalytics() {
    if (loaded) return;
    loaded = true;
    var script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}';
    document.head.appendChild(script);
    window.gtag('js', new Date());
    window.gtag('config', '${GA_MEASUREMENT_ID}');
  }
  ['pointerdown', 'keydown', 'touchstart'].forEach(function (eventName) {
    window.addEventListener(eventName, loadAnalytics, { once: true, passive: true });
  });
  window.setTimeout(loadAnalytics, 8000);
})();`}
    </Script>
  );
}
