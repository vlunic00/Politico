"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { EmptyState } from "./empty-state";
import { formatDate, formatNumber } from "@/lib/statistics/series";

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
}: {
  points?: ChartPoint[];
  unit: string;
  title: string;
  development?: boolean;
  transitions?: { date: string; label: string }[];
}) {
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
      <div className="h-72 w-full min-w-0">
        <ResponsiveContainer
          width="100%"
          height="100%"
          initialDimension={{ width: 600, height: 288 }}
        >
          <LineChart
            data={data}
            aria-label={title}
            margin={{ top: 8, right: 10, bottom: 0, left: 0 }}
          >
            <CartesianGrid stroke="#e6e9ec" vertical={false} />
            <XAxis
              dataKey={dated ? "timestamp" : "period"}
              type={dated ? "number" : "category"}
              scale={dated ? "time" : "auto"}
              domain={dated ? ["dataMin", "dataMax"] : undefined}
              tickFormatter={dated ? (value) => String(new Date(value).getUTCFullYear()) : undefined}
              ticks={dated ? data.filter((point) => point.periodStart?.endsWith("-01-01")).map((point) => point.timestamp!) : undefined}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: "#626b77" }}
              dy={8}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 10, fill: "#626b77" }}
              width={60}
            />
            <Tooltip
              labelFormatter={dated ? (value) => data.find((point) => point.timestamp === Number(value))?.period ?? "" : undefined}
              formatter={(value, name) => [
                `${new Intl.NumberFormat("hr-HR", { maximumFractionDigits: 2 }).format(Number(value))} ${unit}`,
                name,
              ]}
              contentStyle={{
                borderRadius: 12,
                borderColor: "#e6e9ec",
                fontSize: 12,
              }}
            />
            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 20 }} />
            {visibleTransitions.map((transition) => <ReferenceLine key={transition.date} x={Date.parse(transition.date)} stroke="#8c949c" strokeDasharray="4 4" />)}
            <Line
              name="Hrvatska"
              dataKey="croatia"
              stroke="#263e49"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4 }}
              connectNulls={false}
              isAnimationActive={false}
            />
            <Line
              name="EU-27"
              dataKey="eu"
              stroke="#7d97aa"
              strokeWidth={2}
              dot={false}
              connectNulls={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
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
                  Hrvatska ({unit})
                </th>
                <th scope="col" className="p-2">
                  EU-27 ({unit})
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
