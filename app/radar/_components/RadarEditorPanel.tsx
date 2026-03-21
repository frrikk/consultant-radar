"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  BriefcaseBusinessIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  FileTextIcon,
  FunnelIcon,
  MapPinIcon,
  OrbitIcon,
  PanelTopIcon,
  SearchIcon,
  StretchHorizontalIcon,
  XIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTitle, TooltipTrigger } from "@/components/ui/tooltip";
import { formatLocaleShortDate, getT } from "@/lib/i18n";
import { type RadarPresetId, type RadarVisualizationMode } from "../_lib/radar";
import type { FlowcaseCv } from "@/lib/flowcase";

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

type RadarPresetOption = {
  id: RadarPresetId;
  fields: Array<{ id: string }>;
};

type RadarEditorPanelProps = {
  consultants: ConsultantOption[];
  cvsByUserId: Record<string, FlowcaseCv>;
  selectedIds: string[];
  onSelectedIdsChange: (ids: string[]) => void;
  onReset: () => void;
  presetId: RadarPresetId;
  onPresetChange: (presetId: RadarPresetId) => void;
  presetOptions: RadarPresetOption[];
  visualizationMode: RadarVisualizationMode;
  onVisualizationModeChange: (mode: RadarVisualizationMode) => void;
  maxSelected: number;
};

const DEFAULT_DEPARTMENTS = ["Digital Experience", "Software Engineering"] as const;
const ROLE_OPTIONS = ["developer", "designer"] as const;
const PROJECT_STATUS_OPTIONS = ["in-project", "available"] as const;

type ProjectStatusFilter = (typeof PROJECT_STATUS_OPTIONS)[number];

function getDepartmentAbbreviation(department: string) {
  const normalizedDepartment = department.trim().toLowerCase();

  if (normalizedDepartment === "digital experience") {
    return "DX";
  }

  if (normalizedDepartment === "software engineering") {
    return "SWE";
  }

  return department;
}

function uniqueIds(values: string[], limit: number) {
  return [...new Set(values)].slice(0, limit);
}

function sameIds(left: string[], right: string[]) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function getUpdateTone(updatedAt: string) {
  const updated = new Date(updatedAt).getTime();
  const ageInDays = (Date.now() - updated) / (1000 * 60 * 60 * 24);

  if (ageInDays < 30) {
    return {
      dot: "bg-emerald-500 dark:bg-emerald-400",
      icon: "text-emerald-600 dark:text-emerald-300",
      pill: "text-emerald-700 dark:text-emerald-300",
    };
  }

  if (ageInDays < 90) {
    return {
      dot: "bg-amber-500 dark:bg-amber-400",
      icon: "text-amber-600 dark:text-amber-300",
      pill: "text-amber-700 dark:text-amber-300",
    };
  }

  return {
    dot: "bg-red-500 dark:bg-red-400",
    icon: "text-red-600 dark:text-red-300",
    pill: "text-red-700 dark:text-red-300",
  };
}

function UpdateDatePill({ updatedAt }: { updatedAt: string }) {
  const tone = getUpdateTone(updatedAt);
  const t = getT();

  return (
    <Tooltip>
      <TooltipTrigger
        type="button"
        className={`inline-flex items-center gap-1.5 rounded-full bg-muted px-2 py-0.5 text-[11px] ${tone.pill}`}
      >
        <FileTextIcon className={`size-3 ${tone.icon}`} strokeWidth={2.35} />
        {formatLocaleShortDate(updatedAt)}
      </TooltipTrigger>
      <TooltipContent>
        <TooltipTitle>{t("radar.compare.updatedAtHelp")}</TooltipTitle>
      </TooltipContent>
    </Tooltip>
  );
}

function MetaPill({ icon, label }: { icon?: ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2 py-0.5 text-[11px] text-foreground">
      {icon}
      {label}
    </span>
  );
}

function ProjectStatusPill({ inProject, label }: { inProject: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] ${
        inProject
          ? "bg-amber-500/12 text-amber-700 dark:bg-amber-400/16 dark:text-amber-200"
          : "bg-emerald-500/12 text-emerald-700 dark:bg-emerald-400/16 dark:text-emerald-200"
      }`}
    >
      <span
        aria-hidden="true"
        className={`size-1.5 rounded-full ${inProject ? "bg-amber-500 dark:bg-amber-300" : "bg-emerald-500 dark:bg-emerald-300"}`}
      />
      {label}
    </span>
  );
}

function FilterPill({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex w-fit items-center rounded-full border px-2 py-1 text-xs transition-colors ${
        active ? "border-primary bg-primary/10 text-foreground" : "border-border bg-background text-foreground hover:border-accent"
      }`}
    >
      {label}
    </button>
  );
}

function SearchInput({
  id,
  value,
  onChange,
  placeholder,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative">
      <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-11 rounded-[12px] border-border/70 bg-muted/15 pl-9 text-sm"
      />
      </div>
    );
}

function activeFilterCount(selectedCities: string[], selectedDepartments: string[], selectedRoles: string[]) {
  return selectedCities.length + selectedDepartments.length + selectedRoles.length;
}

function matchesActiveFilters(
  consultant: ConsultantOption,
  selectedCities: string[],
  selectedDepartments: string[],
  selectedRoles: string[],
  selectedProjectStatuses: ProjectStatusFilter[],
) {
  if (selectedCities.length > 0 && !selectedCities.includes(consultant.city)) {
    return false;
  }

  if (selectedDepartments.length > 0 && !selectedDepartments.includes(consultant.department)) {
    return false;
  }

  if (selectedRoles.length > 0 && !selectedRoles.every((role) => consultant.roleTags.includes(role))) {
    return false;
  }

  if (selectedProjectStatuses.length > 0) {
    const projectStatus = consultant.inProject ? "in-project" : "available";

    if (!selectedProjectStatuses.includes(projectStatus)) {
      return false;
    }
  }

  return true;
}

export function RadarEditorPanel({
  consultants,
  cvsByUserId,
  selectedIds,
  onSelectedIdsChange,
  onReset,
  presetId,
  onPresetChange,
  presetOptions,
  visualizationMode,
  onVisualizationModeChange,
  maxSelected,
}: RadarEditorPanelProps) {
  const t = getT();
  const [addQuery, setAddQuery] = useState("");
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedProjectStatuses, setSelectedProjectStatuses] = useState<ProjectStatusFilter[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const cityOptions = useMemo(
    () => [...new Set(consultants.map((consultant) => consultant.city))].sort((left, right) => left.localeCompare(right)),
    [consultants],
  );
  const departmentOptions = useMemo(() => {
    const values = [...new Set(consultants.map((consultant) => consultant.department).filter(Boolean))];
    return (values.length > 0 ? values : [...DEFAULT_DEPARTMENTS]).sort((left, right) => left.localeCompare(right));
  }, [consultants]);

  const filteredCandidates = useMemo(() => {
    const query = addQuery.trim().toLowerCase();
    const pool = consultants.filter((consultant) => {
      if (!matchesActiveFilters(consultant, selectedCities, selectedDepartments, selectedRoles, selectedProjectStatuses)) {
        return false;
      }

      return true;
    });

    if (!query) {
      return pool;
    }

    return pool.filter((consultant) => consultant.searchValue.toLowerCase().includes(query));
  }, [consultants, addQuery, selectedCities, selectedDepartments, selectedProjectStatuses, selectedRoles]);
  const visibleCandidates = filteredCandidates;
  const totalActiveFilters = activeFilterCount(selectedCities, selectedDepartments, selectedRoles) + selectedProjectStatuses.length;
  const presetLabel = t(`radar.config.presets.${presetId}`);

  function toggleCity(city: string) {
    setSelectedCities((current) =>
      current.includes(city) ? current.filter((item) => item !== city) : [...current, city],
    );
  }

  function toggleDepartment(department: string) {
    setSelectedDepartments((current) =>
      current.includes(department) ? current.filter((item) => item !== department) : [...current, department],
    );
  }

  function toggleRole(role: string) {
    setSelectedRoles((current) =>
      current.includes(role) ? current.filter((item) => item !== role) : [...current, role],
    );
  }

  function toggleProjectStatus(status: ProjectStatusFilter) {
    setSelectedProjectStatuses((current) =>
      current.includes(status) ? current.filter((item) => item !== status) : [...current, status],
    );
  }

  function clearFilters() {
    setSelectedCities([]);
    setSelectedDepartments([]);
    setSelectedRoles([]);
    setSelectedProjectStatuses([]);
  }

  useEffect(() => {
    const filteredSelectedIds = selectedIds.filter((selectedId) => {
      const consultant = consultants.find((item) => item.value === selectedId);
      if (!consultant) {
        return false;
      }

      return matchesActiveFilters(consultant, selectedCities, selectedDepartments, selectedRoles, selectedProjectStatuses);
    });

    if (!sameIds(filteredSelectedIds, selectedIds)) {
      onSelectedIdsChange(filteredSelectedIds);
    }
  }, [consultants, onSelectedIdsChange, selectedCities, selectedDepartments, selectedIds, selectedProjectStatuses, selectedRoles]);

  function handleAddSelected(id: string) {
    onSelectedIdsChange(uniqueIds([...selectedIds, id], maxSelected));
    setAddQuery("");
  }

  function handleRemoveSelected(id: string) {
    const next = selectedIds.filter((value) => value !== id);
    onSelectedIdsChange(next);
  }

  function handleToggleSelected(id: string) {
    if (selectedSet.has(id)) {
      handleRemoveSelected(id);
      return;
    }

    handleAddSelected(id);
  }

  return (
    <Card className="flex h-full min-h-0 max-h-full rounded-xl border border-border bg-card py-0 shadow-none ring-0 overflow-hidden">
      <CardContent className="flex min-h-0 flex-1 flex-col space-y-4 overflow-hidden px-0 pt-0">
        <div className="sticky top-0 z-10 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/85 lg:static lg:bg-transparent lg:backdrop-blur-0">
          <section className="space-y-2.5 border-b border-border/70 px-3 pt-3 pb-3">
            <p className="text-sm font-semibold text-foreground">{t("radar.config.modeTitle")}</p>

            <div className="flex items-center gap-2">
              <div className="inline-flex h-8 items-center rounded-[12px] border border-border bg-muted/30 p-0.5">
                {([
                  { id: "radar", icon: OrbitIcon },
                  { id: "range", icon: StretchHorizontalIcon },
                ] as const).map(({ id, icon: Icon }) => (
                  <Tooltip key={id}>
                    <TooltipTrigger
                      type="button"
                      aria-label={t(`radar.config.visualizations.${id}`)}
                      onClick={() => onVisualizationModeChange(id)}
                      className={`flex h-7 w-7 items-center justify-center rounded-[12px] transition-colors ${
                        visualizationMode === id
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-background hover:text-foreground"
                      }`}
                    >
                      <Icon className="size-3.5" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <TooltipTitle>{t(`radar.config.visualizations.${id}`)}:</TooltipTitle>{" "}
                      {t(`radar.config.visualizationHelp.${id}`)}
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>

              {visualizationMode === "radar" ? (
                <Select value={presetId} onValueChange={(value) => onPresetChange(value as RadarPresetId)}>
                  <SelectTrigger size="sm" className="min-w-0 flex-1 rounded-[12px] bg-background">
                    <PanelTopIcon className="size-3.5 text-muted-foreground" />
                    <SelectValue>{presetLabel}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {presetOptions.map((preset) => (
                      <SelectItem key={preset.id} value={preset.id}>
                        {t(`radar.config.presets.${preset.id}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="line-clamp-2 text-xs text-muted-foreground">{t("radar.range.selectionHint")}</p>
              )}
            </div>
          </section>

          <section className="space-y-3 px-3 pb-3 pt-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-foreground">{t("radar.compare.consultantsTitle")}</p>
            <div className="flex flex-1 items-center justify-end gap-2">
              <Badge className="border-border bg-muted/50 text-foreground hover:bg-muted/50">
                {t("radar.compare.selectedCount", { count: selectedIds.length, max: maxSelected })}
              </Badge>
              {totalActiveFilters > 0 ? (
                <button
                  type="button"
                  onClick={() => setFiltersOpen(true)}
                  className="inline-flex h-5 items-center justify-center gap-1 rounded-full border border-border bg-muted/50 px-2 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                >
                  <FunnelIcon className="size-3" />
                  {totalActiveFilters}
                </button>
              ) : null}
            </div>
          </div>

          <details
            className="rounded-[12px] border border-border/70 bg-muted/15"
            open={filtersOpen}
            onToggle={(event) => setFiltersOpen((event.currentTarget as HTMLDetailsElement).open)}
          >
            <summary className="flex h-11 cursor-pointer list-none items-center justify-between gap-2 px-3 text-sm font-medium text-foreground">
              <span className="inline-flex items-center gap-2">
                <FunnelIcon className="size-3.5 text-muted-foreground" />
                {t("radar.compare.filtersTitle")}
              </span>
              <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                <span>
                  {filtersOpen
                    ? t("radar.compare.hideFilters")
                    : totalActiveFilters > 0
                      ? t("radar.compare.activeFilters", { count: totalActiveFilters })
                      : t("radar.compare.showFilters")}
                </span>
                {filtersOpen ? <ChevronUpIcon className="size-3.5" /> : <ChevronDownIcon className="size-3.5" />}
              </span>
            </summary>

            <div className="grid gap-3 px-3 pb-3">
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={clearFilters}
                  disabled={totalActiveFilters === 0}
                  className="text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground disabled:cursor-default disabled:opacity-40 disabled:hover:text-muted-foreground"
                >
                  {t("radar.compare.clearFilters")}
                </button>
              </div>

              <div className="space-y-1.5">
                <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  {t("radar.compare.projectStatusTitle")}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {PROJECT_STATUS_OPTIONS.map((status) => {
                    return (
                      <FilterPill
                        key={status}
                        active={selectedProjectStatuses.includes(status)}
                        label={t(`radar.compare.projectStatus.${status}`)}
                        onClick={() => toggleProjectStatus(status)}
                      />
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1.5">
                <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  {t("radar.compare.roleTitle")}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {ROLE_OPTIONS.map((role) => {
                    return (
                      <FilterPill
                        key={role}
                        active={selectedRoles.includes(role)}
                        label={t(`radar.compare.roles.${role}`)}
                        onClick={() => toggleRole(role)}
                      />
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1.5">
                <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  {t("radar.compare.departmentTitle")}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {departmentOptions.map((department) => {
                    return (
                      <FilterPill
                        key={department}
                        active={selectedDepartments.includes(department)}
                        label={department}
                        onClick={() => toggleDepartment(department)}
                      />
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1.5">
                <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  {t("radar.compare.locationTitle")}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {cityOptions.map((city) => {
                    return (
                      <FilterPill
                        key={city}
                        active={selectedCities.includes(city)}
                        label={city}
                        onClick={() => toggleCity(city)}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          </details>

          </section>
        </div>

        <section className="flex min-h-0 flex-1 flex-col space-y-3 px-3 pb-4">

          <SearchInput
            id="add-consultant"
            value={addQuery}
            onChange={setAddQuery}
            placeholder={t("radar.compare.quickAddPlaceholder")}
          />

          <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
            <span>{t("radar.compare.listCount", { count: filteredCandidates.length })}</span>
            <div className="flex items-center justify-end">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={onReset}
                disabled={selectedIds.length === 0}
                className="h-7 px-2.5 text-xs"
              >
                {t("radar.compare.emptyList")}
              </Button>
            </div>
          </div>

          <div className="min-h-7">
            <div className="flex min-h-7 flex-wrap items-center gap-1.5">
            {selectedIds.map((selectedId) => {
              const consultant = consultants.find((item) => item.value === selectedId);
              if (!consultant) {
                return null;
              }

              return (
                <span
                  key={consultant.value}
                  className="animate-selection-card-in inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-2.5 py-1 text-xs text-foreground"
                >
                  <span className="font-medium">{consultant.label}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSelected(consultant.value)}
                    className="rounded-full p-0.5 hover:bg-muted"
                    aria-label={t("radar.compare.removeConsultant", { name: consultant.label })}
                  >
                    <XIcon className="size-3.5" />
                  </button>
                </span>
              );
            })}
            </div>
          </div>

          <div className="max-h-[52vh] overflow-y-auto pr-1 [scrollbar-gutter:stable] lg:min-h-0 lg:max-h-none lg:flex-1">
            <div className="space-y-1.5">
              {visibleCandidates.length > 0 ? (
                <>
                  {visibleCandidates.map((consultant) => {
                    const selected = selectedSet.has(consultant.value);
                    const disabled = !selected && selectedIds.length >= maxSelected;

                    return (
                    <div
                      key={consultant.value}
                      role="button"
                      tabIndex={disabled ? -1 : 0}
                      aria-disabled={disabled}
                      aria-label={
                        selected
                          ? t("radar.compare.removeConsultant", { name: consultant.label })
                          : t("radar.compare.addConsultant", { name: consultant.label })
                      }
                      onClick={() => {
                        if (!disabled) {
                          handleToggleSelected(consultant.value);
                        }
                      }}
                      onKeyDown={(event) => {
                        if (disabled) {
                          return;
                        }

                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          handleToggleSelected(consultant.value);
                        }
                      }}
                      className={`animate-selection-card-in flex min-h-[5.75rem] w-full items-stretch justify-between gap-2 rounded-[12px] border-2 px-2.5 py-2 text-left transition-colors ${
                        selected
                          ? "border-[#021e57]/40 bg-[#021e57]/10 dark:border-white/24 dark:bg-white/10"
                          : "border-transparent bg-muted/35 hover:border-accent/60 hover:bg-muted/55"
                      } ${
                        disabled
                          ? "cursor-not-allowed opacity-40"
                          : "cursor-pointer"
                      }`}
                    >
                      <span className="flex min-h-full min-w-0 flex-1 flex-col justify-between gap-2">
                        <span className="space-y-1">
                          <span className="block truncate text-sm font-medium text-foreground">{consultant.label}</span>
                          <span className="block">
                            <ProjectStatusPill
                              inProject={consultant.inProject}
                              label={t(`radar.compare.projectStatus.${consultant.inProject ? "in-project" : "available"}`)}
                            />
                          </span>
                        </span>
                        <span className="space-y-1.5 pt-1">
                          <span className="flex flex-wrap gap-1">
                            <MetaPill icon={<MapPinIcon className="size-3" />} label={consultant.city} />
                            <MetaPill icon={<BriefcaseBusinessIcon className="size-3" />} label={getDepartmentAbbreviation(consultant.department)} />
                          </span>
                          <span className="flex flex-wrap gap-1">
                            {consultant.roleTags.map((role) => (
                              <MetaPill key={`${consultant.value}-${role}`} label={t(`radar.compare.roles.${role}`)} />
                            ))}
                          </span>
                        </span>
                      </span>
                      <div className="flex min-h-full w-[5.25rem] shrink-0 self-stretch flex-col items-end justify-between">
                        {cvsByUserId[consultant.value] ? (
                          <UpdateDatePill updatedAt={cvsByUserId[consultant.value].updated_at} />
                        ) : null}
                        <span className="flex items-end justify-end">
                          <span
                            aria-hidden="true"
                            className={`flex size-6 items-center justify-center rounded-full border transition-colors ${
                              selected
                                ? "border-[#021e57] bg-[#021e57] text-white hover:bg-[#021b42] dark:border-[#839df9] dark:bg-[#839df9] dark:text-[#021e57] dark:hover:bg-[#9bb0ff]"
                                : "border-dashed border-[#021e57]/45 bg-[#021e57]/[0.04] text-[#021e57]/70 hover:border-[#021e57]/70 hover:bg-[#021e57]/[0.08] hover:text-[#021e57] dark:border-[#839df9]/50 dark:bg-[#839df9]/10 dark:text-[#c7d4ff] dark:hover:border-[#9bb0ff] dark:hover:bg-[#839df9]/16 dark:hover:text-[#e4ebff]"
                            }`}
                          >
                            {selected ? <CheckIcon className="size-3" /> : null}
                          </span>
                        </span>
                      </div>
                    </div>
                    );
                  })}
                </>
              ) : (
                <div className="flex h-full min-h-48 items-center justify-center rounded-[12px] border border-dashed border-border/80 bg-muted/10 px-4 text-center text-sm text-muted-foreground">
                  {t("radar.compare.emptyCandidates")}
                </div>
              )}
            </div>
          </div>
        </section>

      </CardContent>
    </Card>
  );
}
