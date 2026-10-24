import type { ChartPoint } from "@/components/metric-line-chart";

// Synthetic values belong exclusively to the explicitly labelled component preview.
export const developmentChart: ChartPoint[] = [
  { period: "A", croatia: 10, eu: 12 },
  { period: "B", croatia: 13, eu: 14 },
  { period: "C", croatia: 12, eu: 15 },
  { period: "D", croatia: null, eu: 16 },
  { period: "E", croatia: 18, eu: 17 },
  { period: "F", croatia: 20, eu: 19 },
];
