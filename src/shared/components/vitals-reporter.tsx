"use client";

import { useEffect } from "react";

/**
 * Reports Core Web Vitals to /api/analytics as web_vital events. Client-side
 * only; server rendering skips it.
 */
export function VitalsReporter() {
  useEffect(() => {
    let cancelled = false;
    void import("web-vitals").then(({ onCLS, onFCP, onINP, onLCP, onTTFB }) => {
      if (cancelled) return;
      const send = (metric: { name: string; value: number; rating: string }) => {
        void fetch("/api/analytics", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event: "web_vital",
            properties: {
              metric: metric.name,
              value: Math.round(metric.value),
              rating: metric.rating,
            },
          }),
        }).catch(() => undefined);
      };
      onCLS(send);
      onFCP(send);
      onINP(send);
      onLCP(send);
      onTTFB(send);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return null;
}
