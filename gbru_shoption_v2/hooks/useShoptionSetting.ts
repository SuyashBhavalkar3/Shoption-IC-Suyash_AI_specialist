import { useState, useEffect } from 'react';

export function useShoptionSetting() {
  // Use public env variables directly with safe fallbacks
  const defaultLink = process.env.NEXT_PUBLIC_WHATSAPP_LINK;
  const defaultEnabled = process.env.NEXT_PUBLIC_WHATSAPP_ENABLED !== undefined
    ? Number(process.env.NEXT_PUBLIC_WHATSAPP_ENABLED)
    : 1;

  const [whatsappLink] = useState(defaultLink);
  const [whatsappEnabled] = useState(defaultEnabled);
  const [loading] = useState(false);

  return { whatsappLink, whatsappEnabled, loading };
}
