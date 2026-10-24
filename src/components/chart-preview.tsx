"use client";

import { useState } from "react";
import { MetricLineChart } from "./metric-line-chart";
import { developmentChart } from "@/fixtures/chart-preview";
import { Button } from "./ui/button";

export function ChartPreview() {
  const [recent, setRecent] = useState(false);
  return (
    <section className="surface min-w-0 p-5 sm:p-7">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <h2 className="section-title">Hrvatska i EU · predložak grafa</h2>
        <div className="flex gap-2" aria-label="Raspon razvojnih točaka">
          <Button
            size="sm"
            variant={recent ? "outline" : "default"}
            aria-pressed={!recent}
            onClick={() => setRecent(false)}
          >
            Sve točke
          </Button>
          <Button
            size="sm"
            variant={recent ? "default" : "outline"}
            aria-pressed={recent}
            onClick={() => setRecent(true)}
          >
            Zadnje 3 točke
          </Button>
        </div>
      </div>
      <MetricLineChart
        points={recent ? developmentChart.slice(-3) : developmentChart}
        unit="primjer"
        title="Sintetički primjer usporednog grafa; razdoblja A–F nisu kalendarske godine"
        development
      />
    </section>
  );
}
