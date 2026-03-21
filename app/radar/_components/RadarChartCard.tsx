"use client";

import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart } from "recharts";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { getT, type AppLocale } from "@/lib/i18n";
import type { RadarOfficeSeries, RadarSeries, RadarStatistic } from "../_lib/radar";

type RadarChartCardProps = {
  consultantSeries: RadarSeries[];
  officeSeries: RadarOfficeSeries[];
  statistic: RadarStatistic;
  locale: AppLocale;
  mode: "consultants" | "offices";
  onEmptyAddFirst?: () => void;
};

export function RadarChartCard({ consultantSeries, officeSeries, statistic, locale, mode, onEmptyAddFirst }: RadarChartCardProps) {
  void statistic;
  const t = getT(locale);
  const isConsultantMode = mode === "consultants";
  const series = isConsultantMode ? consultantSeries : officeSeries;
  const axisCount = series[0]?.data.length ?? 0;
  const chartData =
    series[0]?.data.map((axis) => {
      const row: Record<string, string | number> = {
        category: axis.category,
        categoryLabel: axis.categoryLabel,
      };

      series.forEach((entry) => {
        const key = isConsultantMode
          ? (entry as RadarSeries).consultantId
          : (entry as RadarOfficeSeries).officeId;
        const matchingAxis = entry.data.find((item) => item.category === axis.category);
        row[key] = matchingAxis?.value ?? 0;
      });

      return row;
    }) ?? [];

  const palette = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];
  const chartConfig = Object.fromEntries(
    series.map((entry, index) => {
      const key = isConsultantMode
        ? (entry as RadarSeries).consultantId
        : (entry as RadarOfficeSeries).officeId;
      const label = isConsultantMode
        ? (entry as RadarSeries).consultantName
        : (entry as RadarOfficeSeries).officeName;

      return [
        key,
        {
          label,
          color: palette[index % palette.length],
        },
      ];
    }),
  ) satisfies ChartConfig;

  return (
    <Card className="flex h-full min-h-0 max-h-full overflow-hidden rounded-xl border border-border bg-card shadow-none ring-0">
      <CardHeader className="border-b border-border px-6 py-3 pb-2">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-base">{isConsultantMode ? t("radar.chart.consultantTitle") : t("radar.chart.officeTitle")}</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 overflow-y-auto px-2 pb-2 pt-2 sm:px-3 sm:pb-2.5 sm:pt-2.5">
        {series.length > 0 ? (
          <ChartContainer config={chartConfig} className="mx-auto h-[min(58vh,680px)] min-h-[320px] w-full max-w-none rounded-[18px] bg-white px-1.5 py-2 text-foreground sm:h-[min(60vh,720px)] sm:min-h-[380px] sm:px-2 sm:py-3 lg:h-[min(64vh,760px)] xl:h-[min(64vh,760px)] [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-[#021e57]/18 [&_.recharts-legend-wrapper]:!text-[#021e57] [&_.recharts-polar-angle-axis-tick_text]:fill-[#021e57] [&_.recharts-polar-radius-axis-tick_value]:fill-[#5c6286] dark:bg-[#082455] dark:text-white dark:[&_.recharts-polar-grid_[stroke='#ccc']]:stroke-white/16 dark:[&_.recharts-legend-wrapper]:!text-white dark:[&_.recharts-polar-angle-axis-tick_text]:fill-white/84 dark:[&_.recharts-polar-radius-axis-tick_value]:fill-white/70">
            <RadarChart data={chartData} outerRadius="74%">
              <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" nameKey="categoryLabel" />} />
              <ChartLegend content={<ChartLegendContent className="flex-wrap gap-x-5 gap-y-2 text-sm" />} />
              <PolarGrid gridType="polygon" radialLines={true} />
              <PolarAngleAxis dataKey="categoryLabel" tick={{ fill: "currentColor", fontSize: 12 }} />
              <PolarRadiusAxis angle={90} domain={[0, 5]} tickCount={6} tick={{ fill: "currentColor", fontSize: 11 }} axisLine={false} />
              {series.map((entry, index) => {
                const key = isConsultantMode
                  ? (entry as RadarSeries).consultantId
                  : (entry as RadarOfficeSeries).officeId;

                return (
                  <Radar
                    key={key}
                    name={chartConfig[key]?.label as string}
                    dataKey={key}
                    stroke={`var(--color-${key})`}
                    fill={`var(--color-${key})`}
                    fillOpacity={0.14 + index * 0.06}
                    strokeOpacity={1}
                    strokeWidth={3}
                    dot={{ r: 3, fill: `var(--color-${key})`, stroke: "#fcfaf7", strokeWidth: 1 }}
                  />
                );
              })}
            </RadarChart>
          </ChartContainer>
        ) : (
          <div className="flex h-[min(58vh,680px)] min-h-[320px] flex-col items-center justify-center gap-3 rounded-[18px] border border-dashed border-border bg-muted/30 px-6 text-center text-sm text-muted-foreground sm:h-[min(60vh,720px)] sm:min-h-[380px] lg:h-[min(64vh,760px)] xl:h-[min(64vh,760px)]">
            <p>{t("radar.chart.empty")}</p>
            {onEmptyAddFirst ? (
              <button
                type="button"
                onClick={onEmptyAddFirst}
                className="rounded-full border border-primary bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-[#021b42] dark:hover:bg-[#f6ff67] dark:hover:text-[#021b42]"
              >
                {t("radar.chart.addFirst")}
              </button>
            ) : null}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex-col items-start gap-1 border-t border-border bg-card px-6 py-2 text-sm text-muted-foreground">
        <p>{t("radar.chart.footerAxes", { count: axisCount })}</p>
      </CardFooter>
    </Card>
  );
}
