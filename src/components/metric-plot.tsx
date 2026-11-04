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
import type { ChartPoint } from "./metric-line-chart";

export default function MetricPlot({ data, title, unit, dated, visibleTransitions, labels }: {
  data: (ChartPoint & { timestamp?: number })[];
  title: string;
  unit: string;
  dated: boolean;
  visibleTransitions: { date: string; label: string }[];
  labels: [string, string];
}) {
  return (
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
              name={labels[0]}
              dataKey="croatia"
              stroke="#263e49"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4 }}
              connectNulls={false}
              isAnimationActive={false}
            />
            <Line
              name={labels[1]}
              dataKey="eu"
              stroke="#7d97aa"
              strokeWidth={2}
              dot={false}
              connectNulls={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
  );
}
