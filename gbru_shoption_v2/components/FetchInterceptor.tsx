"use client";

import { useEffect } from "react";
import { decryptJSON } from "@/utils/apiCrypto.client";

export default function FetchInterceptor() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const originalFetch = window.fetch;

    window.fetch = async function (...args) {
      const response = await originalFetch(...args);

      // We only intercept successful JSON responses from our own APIs
      const contentType = response.headers.get("content-type");
      const isJson = contentType && contentType.includes("application/json");
      
      let isLocalApi = false;
      if (typeof args[0] === "string") {
        isLocalApi = args[0].startsWith("/api/") || args[0].startsWith("api/");
      }

      if (response.ok && isJson && isLocalApi) {
        try {
          const clonedRes = response.clone();
          const json = await clonedRes.json();

          // Check if response contains our encrypted property "_e"
          if (json && typeof json === "object" && "_e" in json && typeof json._e === "string") {
            const decryptedData = await decryptJSON(json._e);

            // Construct a new Response object that resolves with the decrypted data
            const newResponse = new Response(JSON.stringify(decryptedData), {
              status: response.status,
              statusText: response.statusText,
              headers: response.headers,
            });

            // Define getters to mimic properties correctly
            Object.defineProperty(newResponse, "url", { value: response.url });
            return newResponse;
          }
        } catch (err) {
          // ignore decryption failure
        }
      }

      return response;
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  return null;
}
