"use client";

import { useEffect, useState } from "react";
import { riskBucket } from "@/lib/normalize";
import { Badge, Card, Eyebrow } from "./ui";

export function RiskScoreCard({
  score,
  label = "Risk score",
  note,
}: {
  score: number;
  label?: string;
  note?: string;
}) {
  const bucket = riskBucket(score);
  const toneColor =
    bucket.tone === "red"
      ? "var(--color-risk-red)"
      : bucket.tone === "orange"
        ? "var(--color-risk-orange)"
        : bucket.tone === "yellow"
          ? "var(--color-risk-yellow)"
          : "var(--color-risk-green)";

  const [displayed, setDisplayed] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const duration = 600;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplayed(Math.round(score * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [score]);

  return (
    <Card>
      <Eyebrow>{label}</Eyebrow>
      <div
        className="font-serif font-bold leading-none tabular-nums mt-2"
        style={{
          fontSize: 52,
          letterSpacing: "-0.02em",
          color: toneColor,
        }}
      >
        {displayed}
      </div>
      <div className="mt-3">
        <Badge tone={bucket.tone}>{bucket.label}</Badge>
      </div>
      {note && <div className="text-[11px] text-ash mt-3 leading-relaxed">{note}</div>}
    </Card>
  );
}
