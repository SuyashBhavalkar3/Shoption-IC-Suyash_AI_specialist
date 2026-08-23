import React from 'react';
import VideoHub from '@/components/VideoHub';

export const metadata = {
  title: 'Video Hub (Dashboard) - GBRU',
  description: 'See how GBRU products, events and services are making a difference.',
};

export default function DashboardVideoHubPage() {
  // Authentication checking can be added here
  return <VideoHub />;
}
