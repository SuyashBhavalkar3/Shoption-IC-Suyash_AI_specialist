import type { Metadata } from "next";
import "./globals.css";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { checkMaintenanceMode } from "../lib/firebaseAdmin";

export const metadata: Metadata = {
  title: "Shoption Admin Console",
  description: "Super admin dashboard for call tracking analytics and organisation oversight.",
  icons: {
    icon: "/header_leadlens.png",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Get the current path to avoid redirect loop on /maintenance
  const headersList = await headers();
  const pathname = headersList.get("x-invoke-path") || headersList.get("x-pathname") || "";
  const isMaintenancePage = pathname.startsWith("/maintenance");

  if (pathname && !isMaintenancePage) {
    const isActive = await checkMaintenanceMode();
    if (isActive) {
      redirect("/maintenance");
    }
  }

  return (
    <html lang="en" className="h-full antialiased" data-theme="dark">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme') || 'dark';
                  document.documentElement.setAttribute('data-theme', theme);
                } catch (e) {}
              })()
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
