"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Wrench, Clock } from "lucide-react";

interface MaintenanceData {
  enabled: boolean;
  estimatedEndAt: string | null;
  message: string | null;
}

function useCountdown(isoDate: string | null) {
  const [remaining, setRemaining] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (!isoDate) return;
    const target = new Date(isoDate).getTime();

    const tick = () => {
      const now = Date.now();
      const diff = Math.max(0, target - now);
      if (diff <= 0) {
        setExpired(true);
        return;
      }
      setRemaining({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      });
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [isoDate]);

  return { remaining, expired };
}

export default function MaintenancePage() {
  const [data, setData] = useState<MaintenanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const { remaining, expired } = useCountdown(data?.estimatedEndAt ?? null);

  useEffect(() => {
    fetch("/api/maintenance-settings")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => setData({ enabled: true, estimatedEndAt: null, message: null }))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4">
        <div className="animate-pulse text-slate-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 px-4">
      <div className="max-w-lg w-full text-center space-y-8">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-100 text-amber-600">
          <Wrench className="w-10 h-10" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Under Maintenance
          </h1>
          <p className="text-slate-600">
            {data?.message ||
              "We're making things better for you. Please check back soon."}
          </p>
        </div>

        {data?.estimatedEndAt && !expired && remaining && (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2 text-slate-600">
              <Clock className="w-5 h-5" />
              <span className="text-sm font-medium">Expected back online</span>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {[
                { value: remaining.days, label: "Days" },
                { value: remaining.hours, label: "Hours" },
                { value: remaining.minutes, label: "Min" },
                { value: remaining.seconds, label: "Sec" },
              ].map(({ value, label }) => (
                <div
                  key={label}
                  className="bg-white rounded-lg shadow-sm border border-slate-200 py-4 px-2"
                >
                  <div className="text-2xl font-bold text-red-600 tabular-nums">
                    {String(value).padStart(2, "0")}
                  </div>
                  <div className="text-xs text-slate-500 uppercase tracking-wide mt-1">
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {expired && (
          <p className="text-sm text-slate-500">
            Maintenance may be running longer than expected. We'll be back soon.
          </p>
        )}

      </div>
    </div>
  );
}
