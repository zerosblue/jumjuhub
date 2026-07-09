"use client";

import { useEffect } from "react";

export default function VisitTracker() {
  useEffect(() => {
    try {
      if (sessionStorage.getItem("jj_tracked")) return;
      sessionStorage.setItem("jj_tracked", "1");
    } catch {}
    fetch("/api/track", {
      method: "POST",
      keepalive: true,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ref: document.referrer || "" }),
    }).catch(() => {});
  }, []);
  return null;
}
