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
