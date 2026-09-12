import type { Metadata } from "next";
import { ToastProvider } from "@/components/ToastContext";
import PopularItemsModal from "@/components/PopularItemsModal";
import MaintenanceGuard from "@/components/MaintenanceGuard";
import FloatingNovaButton from "@/components/FloatingNovaButton";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "GBRU Shoption",
  description: "GBRU Industrial-Grade Machinery & Smart Agricultural Solutions",
  icons: {
    icon: "/assets/gbru_green.png",
  },
};

import FetchInterceptor from "@/components/FetchInterceptor";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased overflow-x-hidden"
    >
      <head>
        {/* Meta Pixel Code */}
        {process.env.NEXT_PUBLIC_META_PIXEL_ID && (
          <Script id="meta-pixel-init" strategy="afterInteractive">
            {`
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${process.env.NEXT_PUBLIC_META_PIXEL_ID}');
              fbq('track', 'PageView');
            `}
          </Script>
        )}
        {/* Google Tag (gtag.js) */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=AW-18173250614"
          strategy="afterInteractive"
        />
        <Script id="google-tag-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'AW-18173250614');
          `}
        </Script>

        <Script id="google-translate-sync" strategy="afterInteractive">
          {`
            (function() {
              try {
                var lang = localStorage.getItem("gbru_selected_lang") || "en";
                var cookieVal = "/en/" + lang;
                var host = window.location.hostname;
                var parts = host.split('.');
                var expired = "expires=Thu, 01 Jan 1970 00:00:00 UTC";
                var domains = ["", host, "." + host];
                if (parts.length > 2) {
                  var parent = parts.slice(-2).join('.');
                  domains.push(parent);
                  domains.push("." + parent);
                }
                for (var i = 0; i < domains.length; i++) {
                  var dom = domains[i];
                  document.cookie = "googtrans=; " + expired + "; path=/;" + (dom ? " domain=" + dom + ";" : "");
                }
                document.cookie = "googtrans=" + cookieVal + "; path=/;";
                document.cookie = "googtrans=" + cookieVal + "; path=/; domain=." + host + ";";
                if (parts.length > 2) {
                  var parentDomain = parts.slice(-2).join('.');
                  document.cookie = "googtrans=" + cookieVal + "; path=/; domain=." + parentDomain + ";";
                }
              } catch(e) {}
            })();
          `}
        </Script>
      </head>
      <body className="min-h-full flex flex-col overflow-x-hidden">
        <Script id="google-translate-config" strategy="afterInteractive">
          {`
            function googleTranslateElementInit() {
              new google.translate.TranslateElement({
                pageLanguage: 'en',
                includedLanguages: 'en,hi,mr,bn,te,ta,gu,kn,ml,pa,ur,or,as,mai,gom,ne,sd,doi,mni,brx,sa',
                layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
                autoDisplay: false
              }, 'google_translate_element');
            }
          `}
        </Script>
        <Script
          id="google-translate-loader"
          src="//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
          strategy="afterInteractive"
        />
        <div id="google_translate_element" style={{ display: 'none' }} />
        <ToastProvider>
          <FetchInterceptor />
          <MaintenanceGuard />
          {children}
          <PopularItemsModal />
          <FloatingNovaButton />
        </ToastProvider>
      </body>
    </html>
  );
}
