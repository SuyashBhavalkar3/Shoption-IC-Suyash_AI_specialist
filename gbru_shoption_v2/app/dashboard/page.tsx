"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Categories from "@/components/Categories";
import FeaturedProducts from "@/components/FeaturedProducts";
import ToolsInAction from "@/components/ToolsInAction";
import Testimonials from "@/components/Testimonials";
import HelpSupportBanner from "@/components/HelpSupportBanner";
import Stats from "@/components/Stats";
import AppDownloadBanner from "@/components/AppDownloadBanner";
import Footer from "@/components/Footer";

export default function DashboardPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const userStr = localStorage.getItem("gbru_user");
      if (!userStr) {
        // Not logged in — redirect to guest homepage
        router.replace("/");
        return;
      }
      
      try {
        const userObj = JSON.parse(userStr);
        if (userObj?.brand_ambassador && userObj.brand_ambassador.trim() !== "") {
          router.replace("/ambassador_dashboard");
          return;
        }
      } catch (e) {}

      setAuthChecked(true);
    }
  }, [router]);

  // Don't render anything until auth check is complete (avoids flash of dashboard before redirect)
  if (!authChecked) return null;

  return (
    <div className="flex flex-col min-h-screen bg-white overflow-x-hidden">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <Categories />
        <FeaturedProducts />
        <ToolsInAction />
        <Testimonials />
        <HelpSupportBanner />

        {/* ── MOBILE ONLY: Stats (Our Impact In Numbers) — logged-in users only ── */}
        {/* Stats already self-guards desktop with hidden lg:flex, wrapping in block lg:hidden ensures only mobile renders */}
        <div className="block lg:hidden">
          <Stats />
        </div>

        <AppDownloadBanner />
      </main>
      <Footer />
    </div>
  );
}
