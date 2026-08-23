"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Stats from "@/components/Stats";
import Categories from "@/components/Categories";
import FieldExperiences from "@/components/FieldExperiences";
import BestSellingTools from "@/components/BestSellingTools";
import AppDownload from "@/components/AppDownload";
import GbRUOnField from "@/components/GbRUOnField";
import WhyGBRU from "@/components/WhyGBRU";
import BoostBusinessWithNova from "@/components/BoostBusinessWithNova";
import Testimonials from "@/components/Testimonials";
import ToolsInAction from "@/components/ToolsInAction";
import HelpSupportBanner from "@/components/HelpSupportBanner";
import AppDownloadBanner from "@/components/AppDownloadBanner";
import Footer from "@/components/Footer";

export default function Home() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const userStr = localStorage.getItem("gbru_user");
      if (userStr) {
        try {
          const userObj = JSON.parse(userStr);
          if (userObj?.brand_ambassador && userObj.brand_ambassador.trim() !== "") {
            router.replace("/ambassador_dashboard");
            return;
          } else if (userObj?.role?.toLowerCase() === 'dealer') {
            router.replace("/dealer_profile");
            return;
          }
        } catch (e) {}
        // Default logged in user redirect
        router.replace("/dashboard");
        return;
      }
      setIsLoggedIn(false);
      setAuthChecked(true);
    }
  }, [router]);

  // Don't render anything until auth check is complete (avoids flash of guest content)
  if (!authChecked) return null;

  return (
    <div className="flex flex-col min-h-screen bg-white overflow-x-hidden">
      <Navbar />
      <main className="flex-1">
        <Hero />

        {/* ── DESKTOP ONLY: Stats at top ── */}
        <div className="hidden xl:block">
          <Stats />
        </div>

        {/* ── DESKTOP ONLY: BestSellingTools ── */}
        <div className="hidden xl:block">
          <BestSellingTools />
        </div>

        {/* ── FieldExperiences (guest only) — self-guards mobile/desktop internally ── */}
        {!isLoggedIn && <FieldExperiences />}

        {/* ── MOBILE ONLY: BestSellingTools (after FieldExperiences on mobile) ── */}
        <div className="block xl:hidden">
          <BestSellingTools />
        </div>

        {/* ── Categories — self-guards mobile/desktop internally ── */}
        <Categories />

        {/* ── DESKTOP ONLY: ToolsInAction ── */}
        <div className="hidden xl:block">
          <ToolsInAction />
        </div>

        {/* ── MOBILE ONLY: ToolsInAction (only when logged in) ── */}
        {isLoggedIn && (
          <div className="block xl:hidden">
            <ToolsInAction />
          </div>
        )}

        {/* ── DESKTOP ONLY: AppDownload, GbRUOnField, BoostBusinessWithNova, WhyGBRU (guest only) ── */}
        <div className="hidden xl:block">
          {!isLoggedIn && <AppDownload />}
          {!isLoggedIn && <GbRUOnField />}
          {!isLoggedIn && <BoostBusinessWithNova />}
          {!isLoggedIn && <WhyGBRU />}
        </div>

        {/* ── MOBILE ONLY: BoostBusinessWithNova + WhyGBRU + GbRUOnField (guest only) ── */}
        {!isLoggedIn && (
          <div className="block xl:hidden">
            <BoostBusinessWithNova />
            <WhyGBRU />
            <GbRUOnField />
          </div>
        )}

        {/* ── Testimonials — self-guards mobile/desktop internally ── */}
        <Testimonials />

        {/* ── MOBILE ONLY: HelpSupportBanner + Stats + AppDownloadBanner (logged in only) ── */}
        {isLoggedIn && (
          <div className="block xl:hidden">
            <HelpSupportBanner />
            <Stats />
            <AppDownloadBanner />
          </div>
        )}

        {/* ── DESKTOP ONLY: HelpSupportBanner + AppDownloadBanner ── */}
        <div className="hidden xl:block">
          <HelpSupportBanner />
          <AppDownloadBanner />
        </div>
      </main>
      <Footer />
    </div>
  );
}
