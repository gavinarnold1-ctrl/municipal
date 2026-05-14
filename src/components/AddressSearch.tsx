"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Result = {
  id: number;
  legalAddress: string;
  ownerName: string | null;
  propertyClass: string | null;
};

export function AddressSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    const ctrl = new AbortController();
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, {
          signal: ctrl.signal,
        });
        const data: { results: Result[] } = await res.json();
        setResults(data.results);
        setOpen(true);
      } catch {
        // aborted or network
      } finally {
        setLoading(false);
      }
    }, 150);
    return () => {
      ctrl.abort();
      clearTimeout(t);
    };
  }, [q]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, []);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (results.length > 0) {
      router.push(`/address/${results[0].id}`);
    }
  }

  return (
    <div ref={wrapRef} className="relative w-full">
      <form onSubmit={onSubmit}>
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="e.g. 165 Church St"
          autoComplete="off"
          className="w-full bg-slate border border-steel text-paper placeholder-ash rounded-[var(--radius-button)] px-4 py-3 text-base outline-none focus:border-copper transition-colors"
        />
      </form>
      {open && (loading || results.length > 0) && (
        <div className="absolute left-0 right-0 mt-2 bg-slate border border-steel rounded-[var(--radius-card)] shadow-[var(--shadow-card)] max-h-80 overflow-y-auto z-10">
          {loading && results.length === 0 && (
            <div className="px-4 py-3 text-sm text-ash">Searching…</div>
          )}
          {results.map((r) => (
            <a
              key={r.id}
              href={`/address/${r.id}`}
              className="block px-4 py-3 border-b border-steel last:border-b-0 hover:bg-ink no-underline"
            >
              <div className="text-paper text-sm font-medium">{r.legalAddress}</div>
              <div className="text-xs text-fog mt-0.5">
                {r.ownerName ?? "Owner unknown"}
                {r.propertyClass ? ` · ${r.propertyClass}` : ""}
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
