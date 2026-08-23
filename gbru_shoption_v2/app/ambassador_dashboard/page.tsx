"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import AmbassadorHero from "@/components/AmbassadorHero";
import Categories from "@/components/Categories";
import FeaturedProducts from "@/components/FeaturedProducts";
import ToolsInAction from "@/components/ToolsInAction";
import Testimonials from "@/components/Testimonials";
import HelpSupportBanner from "@/components/HelpSupportBanner";
import Stats from "@/components/Stats";
import AppDownloadBanner from "@/components/AppDownloadBanner";
import Footer from "@/components/Footer";

export default function AmbassadorPage() {
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
        if (!userObj?.brand_ambassador || userObj.brand_ambassador.trim() === "") {
          router.replace("/dashboard");
          return;
        }
      } catch (e) {
        router.replace("/");
        return;
      }
      setAuthChecked(true);
    }
  }, [router]);

  // Don't render anything until auth check is complete
  if (!authChecked) return null;

  return (
    <div className="flex flex-col min-h-screen bg-white overflow-x-hidden">
      <Navbar />
      <main className="flex-1">
        <AmbassadorHero />
        <Categories />
        <FeaturedProducts />
        <ToolsInAction />
        <Testimonials />
        <HelpSupportBanner />
        <div className="block xl:hidden">
          <Stats />
        </div>
        <AppDownloadBanner />
      </main>
      <Footer />
    </div>
  );
}
