"use client";

import { useMemo, useState } from "react";
import { RangeCoverageCard } from "./RangeCoverageCard";
import { RadarChartCard } from "./RadarChartCard";
import { RadarEditorPanel } from "./RadarEditorPanel";
import {
  EMPTY_RADAR_CONSULTANT_FILTERS,
  buildBestRangeRecommendation,
  buildConsultantRangeSeries,
  buildRangeCoverageSummary,
  buildRadarSeries,
  buildStandardRadarPresets,
  matchesConsultantFilters,
  type RangeRecommendation,
  type RangeTeamSize,
  type RadarConsultantFilters,
  type RadarPresetId,
  type RadarStatistic,
  type RadarVisualizationMode,
} from "../_lib/radar";
import type { FlowcaseCv, FlowcaseTechnologyCategory, FlowcaseUserSummary } from "@/lib/flowcase";

type ConsultantOption = {
  value: string;
  label: string;
  hint: string;
  city: string;
  department: string;
  roleTags: string[];
  inProject: boolean;
  searchValue: string;
};

type RadarWorkspaceProps = {
  consultants: FlowcaseUserSummary[];
  consultantOptions: ConsultantOption[];
  cvsByUserId: Record<string, FlowcaseCv>;
  categories: FlowcaseTechnologyCategory[];
  initialStatistic: RadarStatistic;
  initialSelectedIds: string[];
};

const RADAR_MAX_SELECTED = 5;
const RANGE_MAX_SELECTED = 4;

function uniqueIds(values: string[], limit: number) {
  return [...new Set(values)].slice(0, limit);
}

export function RadarWorkspace({
  consultants,
  consultantOptions,
  cvsByUserId,
  categories,
  initialStatistic,
  initialSelectedIds,
}: RadarWorkspaceProps) {
  const standardPresets = useMemo(() => buildStandardRadarPresets(categories), [categories]);
  const [presetId, setPresetId] = useState<RadarPresetId>("frontend-core");
  const [statistic] = useState<RadarStatistic>(initialStatistic);
  const [visualizationMode, setVisualizationMode] = useState<RadarVisualizationMode>("radar");
  const [recommendedTeamSize, setRecommendedTeamSize] = useState<RangeTeamSize>(3);
  const [selectedIds, setSelectedIds] = useState<string[]>(uniqueIds([...initialSelectedIds], RADAR_MAX_SELECTED));
  const [activeFilters, setActiveFilters] = useState<RadarConsultantFilters>(EMPTY_RADAR_CONSULTANT_FILTERS);
  const maxSelected = visualizationMode === "range" ? RANGE_MAX_SELECTED : RADAR_MAX_SELECTED;

  const selectedConsultants = consultants.filter((consultant) => selectedIds.includes(consultant.user_id));
  const activeFields = useMemo(() => {
    const preset = standardPresets.find((item) => item.id === presetId) ?? standardPresets[0];
    return preset?.fields ?? [];
  }, [presetId, standardPresets]);

  const consultantSeries = useMemo(
    () =>
      selectedConsultants.map((consultant) =>
        buildRadarSeries(statistic, consultant, cvsByUserId[consultant.user_id], activeFields),
      ),
    [activeFields, cvsByUserId, selectedConsultants, statistic],
  );
  const rangeSeries = useMemo(
    () => selectedConsultants.map((consultant) => buildConsultantRangeSeries(consultant, cvsByUserId[consultant.user_id])),
    [cvsByUserId, selectedConsultants],
  );
  const coverageSummary = useMemo(() => buildRangeCoverageSummary(rangeSeries, recommendedTeamSize), [rangeSeries, recommendedTeamSize]);
  const filteredConsultantIds = useMemo(
    () =>
      new Set(
        consultantOptions
          .filter((consultant) => matchesConsultantFilters(consultant, activeFilters))
          .map((consultant) => consultant.value),
      ),
    [activeFilters, consultantOptions],
  );
  const recommendedConsultants = useMemo(
    () => consultants.filter((consultant) => filteredConsultantIds.has(consultant.user_id)),
    [consultants, filteredConsultantIds],
  );
  const allRangeSeries = useMemo(
    () => recommendedConsultants.map((consultant) => buildConsultantRangeSeries(consultant, cvsByUserId[consultant.user_id])),
    [recommendedConsultants, cvsByUserId],
  );
  const bestRecommendation = useMemo<RangeRecommendation | null>(
    () => buildBestRangeRecommendation(allRangeSeries, recommendedTeamSize),
    [allRangeSeries, recommendedTeamSize],
  );

  function handleSelectedIdsChange(nextIds: string[]) {
    setSelectedIds(uniqueIds(nextIds, maxSelected));
  }

  function handleVisualizationModeChange(mode: RadarVisualizationMode) {
    setVisualizationMode(mode);
    setSelectedIds((current) => uniqueIds(current, mode === "range" ? RANGE_MAX_SELECTED : RADAR_MAX_SELECTED));
  }

  function handleReset() {
    setSelectedIds([]);
  }

  function handleAddFirstConsultant() {
    if (consultants[0]) {
      setSelectedIds(uniqueIds([consultants[0].user_id], maxSelected));
    }
  }

  return (
    <section className="grid min-h-0 gap-3 overflow-visible lg:h-[calc(100dvh-5rem)] xl:grid-cols-[360px_minmax(0,1fr)] xl:items-stretch 2xl:grid-cols-[380px_minmax(0,1fr)]">
      <aside className="order-1 flex min-h-0 min-w-0 flex-col gap-3 lg:h-full">
        <RadarEditorPanel
          consultants={consultantOptions}
          cvsByUserId={cvsByUserId}
          selectedIds={selectedIds}
          onSelectedIdsChange={handleSelectedIdsChange}
          onReset={handleReset}
          presetId={presetId}
          onPresetChange={setPresetId}
          presetOptions={standardPresets}
          visualizationMode={visualizationMode}
          onVisualizationModeChange={handleVisualizationModeChange}
          maxSelected={maxSelected}
          onFiltersChange={setActiveFilters}
        />
      </aside>

      <div className="order-2 min-h-0 min-w-0 lg:h-full xl:max-h-full xl:self-stretch">
        {visualizationMode === "radar" ? (
          <RadarChartCard
            consultantSeries={consultantSeries}
            officeSeries={[]}
            statistic={statistic}
            mode="consultants"
            onEmptyAddFirst={handleAddFirstConsultant}
          />
        ) : (
          <RangeCoverageCard
            series={rangeSeries}
            coverage={coverageSummary}
            recommendation={bestRecommendation}
            recommendedTeamSize={recommendedTeamSize}
            onRecommendedTeamSizeChange={setRecommendedTeamSize}
            onApplyRecommendation={
              bestRecommendation ? () => handleSelectedIdsChange(bestRecommendation.consultantIds) : undefined
            }
            onEmptyAddFirst={handleAddFirstConsultant}
          />
        )}
      </div>
    </section>
  );
}
