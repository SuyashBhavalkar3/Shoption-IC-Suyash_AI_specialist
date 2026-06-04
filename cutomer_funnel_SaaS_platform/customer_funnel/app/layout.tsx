import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import React, { Suspense } from "react";
import { AppProvider } from "@/lib/context/app-context";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import ToastContainer from "@/components/toast-container";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TECHSTORE - Premium Gadgets & Electronics",
  description: "A production-ready demo ecommerce store for customer analytics testing, offering premium mobiles, laptops, audio gear, and smart home appliances.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">
        <AppProvider>
          <Suspense fallback={<div className="h-16 bg-slate-900 border-b border-slate-800" />}>
            <Navbar />
          </Suspense>
          <ToastContainer />
          <main className="flex-grow">
            {children}
          </main>
          <Footer />
        </AppProvider>
      </body>
    </html>
  );
}
