import Otp from '@/components/Otp';
import React from 'react';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Verify OTP - GBRU',
  description: 'Verify your phone number with OTP',
};

export default async function OtpPage({
  searchParams,
}: {
  searchParams?: Promise<{ mobile_no?: string; txn_id?: string }>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  if (!resolvedSearchParams?.mobile_no) {
    redirect('/signup');
  }

  return (
    <main style={{ zoom: "0.909" }}>
      <Otp />
    </main>
  );
}
