"use client";

import { useEffect, useState } from "react";

/** Registers the service worker and shows a quiet banner while offline. */
export function PwaRegister({ offlineText }: { offlineText: string }) {
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  if (!offline) return null;
  return (
    <div role="status" className="bg-warn-tint px-4 py-2 text-center text-sm font-medium text-warn">
      {offlineText}
    </div>
  );
}
