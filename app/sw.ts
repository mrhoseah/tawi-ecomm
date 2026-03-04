// Service Worker registration script
"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator
    ) {
      navigator.serviceWorker
        .getRegistrations()
        .then((registrations) => {
          registrations.forEach((registration) => {
            registration.unregister().catch((error) => {
              console.error("[PWA] Service Worker unregister failed:", error);
            });
          });
        })
        .catch((error) => {
          console.error("[PWA] Error fetching service worker registrations:", error);
        });
    }
  }, []);

  return null;
}

