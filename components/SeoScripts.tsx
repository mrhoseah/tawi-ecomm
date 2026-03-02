"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

interface SeoSettings {
  googleTagId: string | null;
  facebookPixelId: string | null;
}

export default function SeoScripts() {
  const [settings, setSettings] = useState<SeoSettings | null>(null);

  useEffect(() => {
    fetch("/api/seo-settings")
      .then((r) => r.json())
      .then((data) =>
        setSettings({
          googleTagId: data.googleTagId || null,
          facebookPixelId: data.facebookPixelId || null,
        })
      )
      .catch(() => {});
  }, []);

  if (!settings) return null;

  return (
    <>
      {settings.googleTagId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${settings.googleTagId}`}
            strategy="afterInteractive"
          />
          <Script id="gtag" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${settings.googleTagId}');
            `}
          </Script>
        </>
      )}
      {settings.facebookPixelId && (
        <Script id="fb-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
            n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
            document,'script','https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${settings.facebookPixelId}');
            fbq('track', 'PageView');
          `}
        </Script>
      )}
    </>
  );
}
