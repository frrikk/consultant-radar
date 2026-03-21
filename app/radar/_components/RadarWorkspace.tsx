"use client";

import { useMemo, useSyncExternalStore } from "react";
import { RangeCoverageCard } from "./RangeCoverageCard";
import { RadarChartCard } from "./RadarChartCard";
import { RadarEditorPanel } from "./RadarEditorPanel";
import {
  DEFAULT_RADAR_URL_STATE,
  EMPTY_RADAR_CONSULTANT_FILTERS,
  RADAR_MAX_SELECTED,
  RANGE_MAX_SELECTED,
  buildBestRangeRecommendation,
  buildConsultantRangeSeries,
  buildRangeCoverageSummary,
  buildRadarSeries,
  buildStandardRadarPresets,
  matchesConsultantFilters,
  parseRadarUrlState,
  serializeRadarUrlState,
  type RangeRecommendation,
  type RadarConsultantFilters,
  type RadarStatistic,
  type RadarUrlState,
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
  initialUrlState?: RadarUrlState;
};

const URL_STATE_EVENT = "radar-url-state-change";

function uniqueIds(values: string[], limit: number) {
  return [...new Set(values)].slice(0, limit);
}

function searchParamsToRecord(searchParams: URLSearchParams) {
  const values = new Map<string, string[]>();

  searchParams.forEach((value, key) => {
    const existing = values.get(key) ?? [];
    existing.push(value);
    values.set(key, existing);
  });

  return Object.fromEntries(
    [...values.entries()].map(([key, entries]) => [key, entries.length === 1 ? entries[0] : entries]),
  ) as Record<string, string | string[] | undefined>;
}

function subscribeToUrlChanges(callback: () => void) {
  window.addEventListener("popstate", callback);
  window.addEventListener(URL_STATE_EVENT, callback);

  return () => {
    window.removeEventListener("popstate", callback);
    window.removeEventListener(URL_STATE_EVENT, callback);
  };
}

export function RadarWorkspace({
  consultants,
  consultantOptions,
  cvsByUserId,
  categories,
  initialStatistic,
  initialUrlState = DEFAULT_RADAR_URL_STATE,
}: RadarWorkspaceProps) {
  const standardPresets = useMemo(() => buildStandardRadarPresets(categories), [categories]);
  const statistic: RadarStatistic = initialStatistic;
  const initialSearch = useMemo(() => {
    const query = serializeRadarUrlState(initialUrlState);
    return query ? `?${query}` : "";
  }, [initialUrlState]);
  const currentSearch = useSyncExternalStore(
    subscribeToUrlChanges,
    () => window.location.search,
    () => initialSearch,
  );
  const currentUrlState = useMemo(
    () => parseRadarUrlState(searchParamsToRecord(new URLSearchParams(currentSearch)), consultantOptions),
    [consultantOptions, currentSearch],
  );
  const presetId = currentUrlState.presetId;
  const visualizationMode = currentUrlState.visualizationMode;
  const recommendedTeamSize = currentUrlState.recommendedTeamSize;
  const selectedIds = useMemo(
    () => uniqueIds([...currentUrlState.selectedIds], visualizationMode === "range" ? RANGE_MAX_SELECTED : RADAR_MAX_SELECTED),
    [currentUrlState.selectedIds, visualizationMode],
  );
  const activeFilters = currentUrlState.filters ?? EMPTY_RADAR_CONSULTANT_FILTERS;
  const maxSelected = visualizationMode === "range" ? RANGE_MAX_SELECTED : RADAR_MAX_SELECTED;

  const consultantsById = useMemo(
    () => new Map(consultants.map((consultant) => [consultant.user_id, consultant])),
    [consultants],
  );
  const selectedConsultants = useMemo(
    () => selectedIds.map((selectedId) => consultantsById.get(selectedId)).filter((consultant): consultant is FlowcaseUserSummary => Boolean(consultant)),
    [consultantsById, selectedIds],
  );
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
    updateUrlState({
      ...currentUrlState,
      selectedIds: uniqueIds(nextIds, maxSelected),
    });
  }

  function handleVisualizationModeChange(mode: RadarUrlState["visualizationMode"]) {
    updateUrlState({
      ...currentUrlState,
      visualizationMode: mode,
      selectedIds: uniqueIds(selectedIds, mode === "range" ? RANGE_MAX_SELECTED : RADAR_MAX_SELECTED),
    });
  }

  function handlePresetChange(nextPresetId: RadarUrlState["presetId"]) {
    updateUrlState({
      ...currentUrlState,
      presetId: nextPresetId,
    });
  }

  function handleRecommendedTeamSizeChange(nextRecommendedTeamSize: RadarUrlState["recommendedTeamSize"]) {
    updateUrlState({
      ...currentUrlState,
      recommendedTeamSize: nextRecommendedTeamSize,
    });
  }

  function handleFiltersChange(nextFilters: RadarConsultantFilters) {
    updateUrlState({
      ...currentUrlState,
      filters: nextFilters,
    });
  }

  function handleReset() {
    handleSelectedIdsChange([]);
  }

  function handleAddFirstConsultant() {
    if (consultants[0]) {
      handleSelectedIdsChange([consultants[0].user_id]);
    }
  }

  function updateUrlState(nextState: RadarUrlState) {
    const nextQuery = serializeRadarUrlState(nextState);
    const nextUrl = nextQuery ? `${window.location.pathname}?${nextQuery}` : window.location.pathname;
    const currentUrl = `${window.location.pathname}${window.location.search}`;

    if (nextUrl !== currentUrl) {
      window.history.replaceState(window.history.state, "", nextUrl);
      window.dispatchEvent(new Event(URL_STATE_EVENT));
    }
  }

  return (
    <section className="grid min-h-0 gap-3 overflow-visible lg:h-[calc(100dvh-5rem)] xl:grid-cols-[360px_minmax(0,1fr)] xl:items-stretch 2xl:grid-cols-[380px_minmax(0,1fr)]">
      <aside className="order-1 flex min-h-0 min-w-0 flex-col gap-3 lg:h-full">
        <RadarEditorPanel
          consultants={consultantOptions}
          cvsByUserId={cvsByUserId}
          selectedIds={selectedIds}
          filters={activeFilters}
          onSelectedIdsChange={handleSelectedIdsChange}
          onReset={handleReset}
          presetId={presetId}
          onPresetChange={handlePresetChange}
          presetOptions={standardPresets}
          visualizationMode={visualizationMode}
          onVisualizationModeChange={handleVisualizationModeChange}
          maxSelected={maxSelected}
          onFiltersChange={handleFiltersChange}
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
            onRecommendedTeamSizeChange={handleRecommendedTeamSizeChange}
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
