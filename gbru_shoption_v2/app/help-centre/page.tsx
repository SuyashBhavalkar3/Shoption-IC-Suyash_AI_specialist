import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import HelpCentre from '@/components/HelpCentre';

export const metadata = {
  title: 'Help Centre - Shoption',
  description: 'Find answers to common questions about orders, payments, returns, and your account.',
};

export default function HelpCentrePage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#FDFDFD] pt-8">
        <HelpCentre />
      </main>
      <Footer />
    </>
  );
}
