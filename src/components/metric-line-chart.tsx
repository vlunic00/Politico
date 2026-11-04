"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

import { EmptyState } from "./empty-state";
import { formatDate, formatNumber } from "@/lib/statistics/series";

const MetricPlot = dynamic(() => import("./metric-plot"));

export type ChartPoint = {
  period: string;
  periodStart?: string;
  croatia: number | null;
  eu: number | null;
  flags?: string;
};

export function MetricLineChart({
  points = [],
  unit,
  title,
  development = false,
  transitions = [],
  labels = ["Hrvatska", "EU-27"],
}: {
  points?: ChartPoint[];
  unit: string;
  title: string;
  development?: boolean;
  transitions?: { date: string; label: string }[];
  labels?: [string, string];
}) {
  const plot = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!plot.current) return;
    if (!("IntersectionObserver" in window)) {
      const frame = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(frame);
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); observer.disconnect(); }
    }, { rootMargin: "300px" });
    observer.observe(plot.current);
    return () => observer.disconnect();
  }, [points.length]);
  if (!points.length)
    return (
      <div className="flex min-h-72 items-center justify-center rounded-xl bg-[linear-gradient(#e6e9ec55_1px,transparent_1px)] bg-size-[100%_48px]">
        <EmptyState
          title="Nema usporedivih podataka"
          description="Graf će biti dostupan nakon provjere istih razdoblja, definicija i jedinica za Hrvatsku i EU."
        />
      </div>
    );
  const dated = transitions.length > 0 && points.every((point) => point.periodStart);
  const data = points.map((point) => ({ ...point, timestamp: point.periodStart ? Date.parse(point.periodStart) : undefined }));
  const visibleTransitions = dated ? transitions.filter((transition) => transition.date >= points[0].periodStart! && transition.date <= points[points.length - 1].periodStart!) : [];
  return (
    <figure aria-label={title}>
      {development && (
        <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs font-medium text-amber-900">
          Razvojni primjer · sintetički podaci. Ovo nisu statistike Hrvatske ili
          EU-a.
        </p>
      )}
      <div ref={plot} className="h-72 w-full min-w-0">
        {visible && <MetricPlot data={data} title={title} unit={unit} dated={dated} visibleTransitions={visibleTransitions} labels={labels} />}
      </div>
      <figcaption className="mt-4 text-xs text-muted-foreground">
        {title} · Jedinica: {unit}
        {visibleTransitions.length > 0 && <div className="mt-3 space-y-1">
          <p>Isprekidane crte označavaju točne datume početka administracija, bez pripisivanja uzroka promjena.</p>
          <ul aria-label="Prijelazi administracija">{visibleTransitions.map((transition) => <li key={transition.date}>{formatDate(transition.date)} · {transition.label}</li>)}</ul>
        </div>}
      </figcaption>
      <details className="mt-3 text-xs text-muted-foreground">
        <summary className="min-h-6 w-fit py-1 underline underline-offset-4">
          Tablični prikaz podataka
        </summary>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left">
            <caption className="sr-only">{title}</caption>
            <thead>
              <tr>
                <th scope="col" className="p-2">
                  Razdoblje
                </th>
                <th scope="col" className="p-2">
                  {labels[0]} ({unit})
                </th>
                <th scope="col" className="p-2">
                  {labels[1]} ({unit})
                </th>
                <th scope="col" className="p-2">Oznake izvora</th>
              </tr>
            </thead>
            <tbody>
              {points.map((point) => (
                <tr key={point.period} className="border-t">
                  <th scope="row" className="p-2 font-normal">
                    {point.period}
                  </th>
                  <td className="p-2">{point.croatia === null ? "Nije dostupno" : formatNumber(point.croatia)}</td>
                  <td className="p-2">{point.eu === null ? "Nije dostupno" : formatNumber(point.eu)}</td>
                  <td className="p-2">{point.flags ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
