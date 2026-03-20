"use client";

import { useMemo, useState } from "react";
import { RadarChartCard } from "./RadarChartCard";
import { RadarEditorPanel } from "./RadarEditorPanel";
import {
  buildRadarSeries,
  buildStandardRadarPresets,
  resolveRadarFields,
  type RadarConfigMode,
  type RadarFieldOption,
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
  fieldCatalog: RadarFieldOption[];
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
  fieldCatalog,
  initialStatistic,
  initialSelectedIds,
}: RadarWorkspaceProps) {
  const standardPresets = useMemo(() => buildStandardRadarPresets(categories), [categories]);
  const [mode, setMode] = useState<RadarConfigMode>("standard");
  const [presetId, setPresetId] = useState<RadarPresetId>("default");
  const [customFieldIds, setCustomFieldIds] = useState<string[]>([]);
  const [statistic, setStatistic] = useState<RadarStatistic>(initialStatistic);
  const [selectedIds, setSelectedIds] = useState<string[]>(uniqueIds([...initialSelectedIds]));

  const selectedConsultants = consultants.filter((consultant) => selectedIds.includes(consultant.user_id));
  const activeFields = useMemo(
    () => resolveRadarFields(mode, presetId, customFieldIds, fieldCatalog, standardPresets),
    [customFieldIds, fieldCatalog, mode, presetId, standardPresets],
  );

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
    setMode("standard");
    setPresetId("default");
    setCustomFieldIds([]);
  }

  function handleAddFirstConsultant() {
    if (consultants[0]) {
      setSelectedIds([consultants[0].user_id]);
    }
  }

  return (
    <section className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)] xl:items-start">
      <aside className="order-1 flex flex-col gap-4">
        <RadarEditorPanel
          consultants={consultantOptions}
          cvsByUserId={cvsByUserId}
          selectedIds={selectedIds}
          onSelectedIdsChange={setSelectedIds}
          onReset={handleReset}
          mode={mode}
          onModeChange={setMode}
          presetId={presetId}
          onPresetChange={setPresetId}
          presetOptions={standardPresets}
          fieldCatalog={fieldCatalog}
          customFieldIds={customFieldIds}
          onCustomFieldIdsChange={setCustomFieldIds}
        />
      </aside>

      <div className="order-2 xl:sticky xl:top-6 xl:self-start">
        <RadarChartCard
          consultantSeries={consultantSeries}
          officeSeries={[]}
          statistic={statistic}
          mode="consultants"
          onEmptyAddFirst={handleAddFirstConsultant}
          isCustomEmpty={mode === "custom" && activeFields.length === 0}
        />
      </div>
    </section>
  );
}
