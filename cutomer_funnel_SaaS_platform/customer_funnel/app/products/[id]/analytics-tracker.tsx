'use client';

import { useEffect } from 'react';
import { Product } from '@/lib/types';
import { trackProductView } from '@/lib/analytics';

interface AnalyticsTrackerProps {
  product: Product;
}

export default function AnalyticsTracker({ product }: AnalyticsTrackerProps) {
  useEffect(() => {
    trackProductView(product);
  }, [product.id]); // trigger again if product changes

  return null;
}
