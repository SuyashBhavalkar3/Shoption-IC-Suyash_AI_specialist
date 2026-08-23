import React from 'react';
import DealerProfile from '@/components/DealerProfile';

export const metadata = {
  title: 'Dealer Account Detected - GBRU',
  description: 'Welcome to GBRU. Dealers can continue through the dedicated Dealer Portal.',
};

export default function DealerProfilePage() {
  return (
    <main>
      <DealerProfile />
    </main>
  );
}
