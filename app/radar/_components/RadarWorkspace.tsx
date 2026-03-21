"use client";

import { useMemo, useState } from "react";
import { RadarChartCard } from "./RadarChartCard";
import { RadarEditorPanel } from "./RadarEditorPanel";
import {
  buildRadarSeries,
  buildStandardRadarPresets,
  type RadarPresetId,
  type RadarStatistic,
} from "../_lib/radar";
import type { FlowcaseCv, FlowcaseTechnologyCategory, FlowcaseUserSummary } from "@/lib/flowcase";

type ConsultantOption = {
  value: string;
  label: string;
  hint: string;
  city: string;
  department: string;
  roleTags: string[];
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

function uniqueIds(values: string[]) {
  return [...new Set(values)].slice(0, 5);
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
  const [presetId, setPresetId] = useState<RadarPresetId>("default");
  const [statistic, setStatistic] = useState<RadarStatistic>(initialStatistic);
  const [selectedIds, setSelectedIds] = useState<string[]>(uniqueIds([...initialSelectedIds]));

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

  function handleReset() {
    setStatistic(initialStatistic);
    setSelectedIds([]);
    setPresetId("default");
  }

  function handleAddFirstConsultant() {
    if (consultants[0]) {
      setSelectedIds([consultants[0].user_id]);
    }
  }

  return (
    <section className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)] xl:items-start 2xl:grid-cols-[380px_minmax(0,1fr)]">
      <aside className="order-1 flex min-w-0 flex-col gap-3">
        <RadarEditorPanel
          consultants={consultantOptions}
          cvsByUserId={cvsByUserId}
          selectedIds={selectedIds}
          onSelectedIdsChange={setSelectedIds}
          onReset={handleReset}
          presetId={presetId}
          onPresetChange={setPresetId}
          presetOptions={standardPresets}
        />
      </aside>

      <div className="order-2 min-w-0 xl:sticky xl:top-4 xl:self-start">
        <RadarChartCard
          consultantSeries={consultantSeries}
          officeSeries={[]}
          statistic={statistic}
          mode="consultants"
          onEmptyAddFirst={handleAddFirstConsultant}
        />
      </div>
    </section>
  );
}
