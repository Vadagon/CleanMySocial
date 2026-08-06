import Script from "next/script";
import { GA_MEASUREMENT_ID } from "@/lib/site";

/**
 * Loads gtag.js after the page is interactive. Rendered only in production so
 * local development never writes into the live property.
 */
export default function GoogleAnalytics() {
  if (!GA_MEASUREMENT_ID || process.env.NODE_ENV !== "production") return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_MEASUREMENT_ID}');`}
      </Script>
    </>
  );
}
