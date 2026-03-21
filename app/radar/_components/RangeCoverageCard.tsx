"use client";

import { InfoIcon } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTitle, TooltipTrigger } from "@/components/ui/tooltip";
import { getT, type AppLocale } from "@/lib/i18n";
import {
  RANGE_STAGE_IDS,
  type RangeRecommendation,
  type RangeTeamSize,
  type ConsultantRangeSeries,
  type RangeCoverageSummary,
  type RangeStageId,
} from "../_lib/radar";

type RangeCoverageCardProps = {
  series: ConsultantRangeSeries[];
  coverage: RangeCoverageSummary;
  recommendation: RangeRecommendation | null;
  recommendedTeamSize: RangeTeamSize;
  locale: AppLocale;
  onRecommendedTeamSizeChange: (size: RangeTeamSize) => void;
  onApplyRecommendation?: () => void;
  onEmptyAddFirst?: () => void;
};

const palette = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

function stageLabel(stageId: RangeStageId, t: ReturnType<typeof getT>) {
  return t(`radar.range.stages.${stageId}`);
}

function ConsultantSkillsTooltip({
  consultant,
  t,
  inverted,
}: {
  consultant: ConsultantRangeSeries;
  t: ReturnType<typeof getT>;
  inverted: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        type="button"
        className={`rounded-[8px] p-1 transition-all hover:scale-105 ${
          inverted ? "text-white hover:text-white" : "text-[#021e57] hover:text-[#021e57]"
        }`}
        aria-label={t("radar.range.skillsPopover.ariaLabel", { name: consultant.consultantName })}
      >
        <InfoIcon
          className={`size-4.5 ${inverted ? "drop-shadow-none" : "drop-shadow-[0_1px_1px_rgba(2,30,87,0.18)]"}`}
          strokeWidth={1.8}
        />
      </TooltipTrigger>
      <TooltipContent className="max-w-96 px-4 py-3">
        <TooltipTitle>{consultant.consultantName}</TooltipTitle>
        <p className="mt-1 text-xs normal-case tracking-normal text-muted-foreground">
          {t("radar.range.skillsPopover.description")}
        </p>
        <p className="mt-1 text-xs normal-case tracking-normal text-muted-foreground">
          {t("radar.range.skillsPopover.thresholdNote")}
        </p>
        <div className="mt-3 space-y-3">
          {RANGE_STAGE_IDS.map((stageId) => {
            const skills = consultant.stageSkills[stageId] ?? [];

            return (
              <div key={`${consultant.consultantId}-${stageId}`} className="space-y-1.5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground">
                  {stageLabel(stageId, t)}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {skills.length > 0 ? (
                    skills.map((skill) => (
                      <span
                        key={`${stageId}-${skill}`}
                        className="rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] font-medium normal-case tracking-normal text-foreground"
                      >
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs normal-case tracking-normal text-muted-foreground">
                      {t("radar.range.skillsPopover.empty")}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

export function RangeCoverageCard({
  series,
  coverage,
  recommendation,
  recommendedTeamSize,
  locale,
  onRecommendedTeamSizeChange,
  onApplyRecommendation,
  onEmptyAddFirst,
}: RangeCoverageCardProps) {
  const t = getT(locale);
  const isCoverageComplete = coverage.isFullyCovered;

  return (
    <Card className="flex h-full min-h-0 max-h-full overflow-hidden rounded-xl border border-border bg-card shadow-none ring-0 lg:max-h-full">
      <CardHeader className="border-b border-border px-6 py-3 pb-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="text-base">{t("radar.range.title")}</CardTitle>
            <p className="text-sm text-muted-foreground">{t("radar.range.description")}</p>
          </div>
          <div
            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
              coverage.isFullyCovered
                ? "bg-emerald-500/14 text-emerald-700 dark:text-emerald-300"
                : "bg-amber-500/14 text-amber-700 dark:text-amber-300"
            }`}
          >
            {coverage.isFullyCovered ? t("radar.range.coverage.complete") : t("radar.range.coverage.incomplete")}
          </div>
        </div>
      </CardHeader>

      <CardContent className="min-h-0 space-y-5 overflow-y-auto px-4 pb-2 pt-3 sm:px-5 sm:pb-2.5 lg:h-full">
        <div className="rounded-[20px] border border-border/80 bg-background p-4">
          <div className="space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">{t("radar.range.recommendation.title")}</p>
                <p className="text-sm text-muted-foreground">
                  {recommendation
                    ? t("radar.range.recommendation.description", {
                        names: recommendation.consultantNames.join(", "),
                        count: recommendation.teamSize,
                      })
                    : t("radar.range.recommendation.unavailable", { count: recommendedTeamSize })}
                </p>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {[1, 2, 3, 4].map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => onRecommendedTeamSizeChange(size as RangeTeamSize)}
                    className={`rounded-[12px] border px-3 py-1.5 text-xs font-medium transition-colors ${
                      recommendedTeamSize === size
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-foreground hover:border-accent"
                    }`}
                  >
                    {t("radar.range.recommendation.size", { count: size })}
                  </button>
                ))}
              </div>
            </div>

            {onApplyRecommendation ? (
              <div className="flex justify-start">
                <button
                  type="button"
                  onClick={onApplyRecommendation}
                  className="rounded-[12px] border border-primary bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-[#021b42] dark:hover:bg-[#f6ff67] dark:hover:text-[#021b42]"
                >
                  {t("radar.range.recommendation.apply")}
                </button>
              </div>
            ) : null}
          </div>
        </div>

        {series.length > 0 ? (
          <>
            <div
              className={`rounded-[20px] p-4 ${
                isCoverageComplete
                  ? "border border-emerald-400/60 bg-emerald-500/12"
                  : "border border-dashed border-border/80 bg-[repeating-linear-gradient(-45deg,rgba(148,163,184,0.12)_0px,rgba(148,163,184,0.12)_10px,transparent_10px,transparent_20px)]"
              }`}
            >
              <div className="grid grid-cols-4 gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {RANGE_STAGE_IDS.map((stageId) => (
                  <div key={stageId} className="text-center">
                    {stageLabel(stageId, t)}
                  </div>
                ))}
              </div>

              <div className="mt-3 grid grid-cols-4 gap-2">
                {RANGE_STAGE_IDS.map((stageId) => {
                  const covered = coverage.coveredStageIds.includes(stageId);

                  return (
                    <div
                      key={stageId}
                      className={`h-3 rounded-full ${
                        covered
                          ? isCoverageComplete
                            ? "bg-emerald-600 dark:bg-emerald-400"
                            : "bg-foreground"
                          : "bg-border/80"
                      }`}
                      aria-hidden="true"
                    />
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              {series.map((consultant, index) => {
                const left = `${consultant.startIndex * 25}%`;
                const width = `${(consultant.endIndex - consultant.startIndex + 1) * 25}%`;

                return (
                  <div key={consultant.consultantId} className="rounded-[18px] border border-border/80 bg-background px-4 py-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-semibold text-foreground">{consultant.consultantName}</p>
                          <ConsultantSkillsTooltip consultant={consultant} t={t} inverted={false} />
                        </div>
                        <p className="text-xs text-muted-foreground">{`${consultant.title} - ${consultant.office}`}</p>
                      </div>
                      <div className="text-xs font-medium text-muted-foreground">
                        {t("radar.range.strongestStage", {
                          stage: stageLabel(consultant.strongestStageId, t),
                        })}
                      </div>
                    </div>

                    <div className="mt-3 space-y-2.5">
                      <div className="grid grid-cols-4 gap-2 text-[10px] font-medium text-muted-foreground">
                        {consultant.stages.map((stage) => (
                          <div key={stage.id} className="text-center">
                            {stage.value.toFixed(1)}
                          </div>
                        ))}
                      </div>

                      <div className="relative h-9 rounded-[14px] bg-muted/45">
                        <div className="absolute inset-0 grid grid-cols-4 gap-2 p-1.5">
                          {consultant.stages.map((stage) => (
                            <div
                              key={stage.id}
                              className={`rounded-[10px] border ${stage.active ? "border-transparent bg-transparent" : "border-border/70 bg-background/55"}`}
                              aria-hidden="true"
                            />
                          ))}
                        </div>
                        <div
                          className="absolute bottom-1.5 top-1.5 rounded-[10px] shadow-[inset_0_-1px_0_rgba(255,255,255,0.22)]"
                          style={{ left, width, backgroundColor: palette[index % palette.length] }}
                        />
                      </div>

                      <div className="grid grid-cols-4 gap-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                        {RANGE_STAGE_IDS.map((stageId) => (
                          <div key={stageId} className="text-center">
                            {stageLabel(stageId, t)}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="flex h-[min(58vh,680px)] min-h-[320px] flex-col items-center justify-center gap-3 rounded-[18px] border border-dashed border-border bg-muted/30 px-6 text-center text-sm text-muted-foreground sm:h-[min(60vh,720px)] sm:min-h-[380px] lg:h-[min(64vh,760px)] xl:h-[min(64vh,760px)]">
            <p>{t("radar.range.empty")}</p>
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
        {coverage.missingStageIds.length > 0 ? (
          <p>
            {t("radar.range.coverage.missing", {
              stages: coverage.missingStageIds.map((stageId) => stageLabel(stageId, t)).join(", "),
            })}
          </p>
        ) : (
          <p>{t("radar.range.coverage.fullSpectrum")}</p>
        )}
        <p>{t("radar.range.coverage.teamSize", { count: series.length })}</p>
      </CardFooter>
    </Card>
  );
}
