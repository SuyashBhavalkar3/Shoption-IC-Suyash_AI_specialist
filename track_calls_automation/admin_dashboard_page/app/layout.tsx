import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Shoption Admin Console",
  description: "Super admin dashboard for call tracking analytics and organisation oversight.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
