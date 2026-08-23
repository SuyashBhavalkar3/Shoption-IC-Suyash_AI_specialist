"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function MaintenanceGuard() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Avoid running on API routes or maintenance page itself to avoid redirect loops
    if (pathname.startsWith("/api")) return;

    // Reference to the maintenance/mode document
    const maintenanceDocRef = doc(db, "maintenance", "mode");

    // Subscribe to real-time updates directly on client-side (no server-side reads polling!)
    const unsubscribe = onSnapshot(
      maintenanceDocRef,
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          // Check both keys
          const isMaintenance = !!(data?.["prod_gbru_shoption"] || data?.prod_gbru_shoption);

          if (isMaintenance) {
            if (pathname !== "/maintenance") {
              router.replace("/maintenance");
            }
          } else {
            if (pathname === "/maintenance") {
              router.replace("/");
            }
          }
        } else {
          // Document doesn't exist, assume not in maintenance mode
          if (pathname === "/maintenance") {
            router.replace("/");
          }
        }
      },
      (error) => {
        // On error, assume not in maintenance mode
        if (pathname === "/maintenance") {
          router.replace("/");
        }
      }
    );

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [pathname, router]);

  return null;
}