import Login from '@/components/Login';
import React from 'react';

export const metadata = {
  title: 'Login - GBRU',
  description: 'Login to your GBRU account',
};

export default function LoginPage() {
  return (
    <main style={{ zoom: "0.909" }}>
      <Login />
    </main>
  );
}
