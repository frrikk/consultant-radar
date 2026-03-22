"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "framer-motion";
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
import { formatLocaleDate, getT, type AppLocale } from "@/lib/i18n";
import {
  EMPTY_RADAR_CONSULTANT_FILTERS,
  PROJECT_STATUS_OPTIONS,
  matchesConsultantFilters,
  type RadarConsultantFilters,
  type ProjectStatusFilter,
  type RadarPresetId,
  type RadarVisualizationMode,
} from "../_lib/radar";
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
  filters: RadarConsultantFilters;
  locale: AppLocale;
  onSelectedIdsChange: (ids: string[]) => void;
  onReset: () => void;
  presetId: RadarPresetId;
  onPresetChange: (presetId: RadarPresetId) => void;
  presetOptions: RadarPresetOption[];
  visualizationMode: RadarVisualizationMode;
  onVisualizationModeChange: (mode: RadarVisualizationMode) => void;
  maxSelected: number;
  onFiltersChange: (filters: RadarConsultantFilters) => void;
};

const DEFAULT_DEPARTMENTS = ["Digital Experience", "Software Engineering"] as const;
const ROLE_OPTIONS = ["developer", "designer"] as const;

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
      selected: "border-emerald-500/18 bg-emerald-500/10 dark:border-emerald-300/20 dark:bg-emerald-400/14",
      idle: "border-emerald-500/14 bg-emerald-500/8 dark:border-emerald-300/18 dark:bg-emerald-400/12",
    };
  }

  if (ageInDays < 90) {
    return {
      selected: "border-amber-500/18 bg-amber-500/10 dark:border-amber-300/20 dark:bg-amber-400/14",
      idle: "border-amber-500/14 bg-amber-500/8 dark:border-amber-300/18 dark:bg-amber-400/12",
    };
  }

  return {
    selected: "border-rose-500/18 bg-rose-500/10 dark:border-rose-300/20 dark:bg-rose-400/14",
    idle: "border-rose-500/14 bg-rose-500/8 dark:border-rose-300/18 dark:bg-rose-400/12",
  };
}

function UpdateDatePill({ updatedAt, locale, selected = false }: { updatedAt: string; locale: AppLocale; selected?: boolean }) {
  const tone = getUpdateTone(updatedAt);

  return (
    <span
      className={`inline-flex h-6 min-w-fit items-center justify-center gap-1.5 self-center rounded-[10px] border px-2 text-[11px] leading-none transition-colors ${
        selected
          ? `${tone.selected} text-[#021e57] dark:text-[#eff3ff]`
          : `${tone.idle} text-muted-foreground`
      }`}
    >
        <FileTextIcon className="size-2.75" strokeWidth={2.1} />
        {formatLocaleDate(updatedAt, locale)}
    </span>
  );
}

function MetaPill({ icon, label, selected = false }: { icon?: ReactNode; label: string; selected?: boolean }) {
  return (
    <span
      className={`inline-flex h-6 min-w-fit items-center justify-center gap-1.5 self-center rounded-[10px] border px-2 text-[11px] leading-none ${
        selected
          ? "border-[#021e57]/12 bg-white/90 text-[#021e57] dark:border-white/12 dark:bg-white/10 dark:text-[#eff3ff]"
          : "border-border/60 bg-background/70 text-muted-foreground"
      }`}
    >
      {icon}
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

export function RadarEditorPanel({
  consultants,
  cvsByUserId,
  selectedIds,
  filters,
  locale,
  onSelectedIdsChange,
  onReset,
  presetId,
  onPresetChange,
  presetOptions,
  visualizationMode,
  onVisualizationModeChange,
  maxSelected,
  onFiltersChange,
}: RadarEditorPanelProps) {
  const t = getT(locale);
  const reduceMotion = useReducedMotion();
  const layoutTransition = { duration: reduceMotion ? 0.12 : 0.22, ease: [0.22, 1, 0.36, 1] as const };
  const [addQuery, setAddQuery] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const selectedCities = filters.cities;
  const selectedDepartments = filters.departments;
  const selectedRoles = filters.roles;
  const selectedProjectStatuses = filters.projectStatuses;
  const activeFilters = filters;

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
    const pool = consultants.filter((consultant) => matchesConsultantFilters(consultant, activeFilters));

    if (!query) {
      return pool;
    }

    return pool.filter((consultant) => consultant.searchValue.toLowerCase().includes(query));
  }, [consultants, activeFilters, addQuery]);
  const visibleCandidates = filteredCandidates;
  const totalActiveFilters = activeFilterCount(selectedCities, selectedDepartments, selectedRoles) + selectedProjectStatuses.length;
  const presetLabel = t(`radar.config.presets.${presetId}`);

  function toggleCity(city: string) {
    onFiltersChange({
      ...activeFilters,
      cities: selectedCities.includes(city) ? selectedCities.filter((item) => item !== city) : [...selectedCities, city],
    });
  }

  function toggleDepartment(department: string) {
    onFiltersChange({
      ...activeFilters,
      departments: selectedDepartments.includes(department)
        ? selectedDepartments.filter((item) => item !== department)
        : [...selectedDepartments, department],
    });
  }

  function toggleRole(role: string) {
    onFiltersChange({
      ...activeFilters,
      roles: selectedRoles.includes(role) ? selectedRoles.filter((item) => item !== role) : [...selectedRoles, role],
    });
  }

  function toggleProjectStatus(status: ProjectStatusFilter) {
    onFiltersChange({
      ...activeFilters,
      projectStatuses: selectedProjectStatuses.includes(status)
        ? selectedProjectStatuses.filter((item) => item !== status)
        : [...selectedProjectStatuses, status],
    });
  }

  function clearFilters() {
    onFiltersChange(EMPTY_RADAR_CONSULTANT_FILTERS);
  }

  useEffect(() => {
    const filteredSelectedIds = selectedIds.filter((selectedId) => {
      const consultant = consultants.find((item) => item.value === selectedId);
      if (!consultant) {
        return false;
      }

      return matchesConsultantFilters(consultant, activeFilters);
    });

    if (!sameIds(filteredSelectedIds, selectedIds)) {
      onSelectedIdsChange(filteredSelectedIds);
    }
  }, [activeFilters, consultants, onSelectedIdsChange, selectedIds]);

  function handleAddSelected(id: string) {
    onSelectedIdsChange(uniqueIds([id, ...selectedIds], maxSelected));
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
      <CardContent className="flex min-h-0 flex-1 flex-col space-y-4 overflow-hidden px-0 pt-0 lg:overflow-y-auto">
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
              <motion.div layout transition={{ duration: reduceMotion ? 0.12 : 0.18, ease: "easeOut" }}>
              <Badge className="border-border bg-muted/50 text-foreground hover:bg-muted/50">
                {t("radar.compare.selectedCount", { count: selectedIds.length, max: maxSelected })}
              </Badge>
              </motion.div>
              {totalActiveFilters > 0 ? (
                <motion.button
                  layout
                  type="button"
                  onClick={() => setFiltersOpen(true)}
                  className="inline-flex h-5 items-center justify-center gap-1 rounded-full border border-border bg-muted/50 px-2 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                  initial={reduceMotion ? false : { opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.94 }}
                  transition={{ duration: reduceMotion ? 0.12 : 0.16, ease: "easeOut" }}
                >
                  <FunnelIcon className="size-3" />
                  {totalActiveFilters}
                </motion.button>
              ) : null}
            </div>
          </div>

          <div
            className={`rounded-[12px] border bg-muted/15 transition-[border-color,background-color] ${
              filtersOpen || totalActiveFilters > 0
                ? "border-[#021e57]/16 bg-[#021e57]/[0.03] dark:border-[#839df9]/22 dark:bg-[#12306f]/16"
                : "border-border/70"
            }`}
          >
            <button
              type="button"
              onClick={() => setFiltersOpen((current) => !current)}
              aria-expanded={filtersOpen}
              className="flex h-11 w-full items-center justify-between gap-2 px-3 text-sm font-medium text-foreground"
            >
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
            </button>

            <AnimatePresence initial={false}>
              {filtersOpen ? (
                <motion.div
                  key="filter-panel"
                  initial={reduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
                  animate={reduceMotion ? { opacity: 1 } : { height: "auto", opacity: 1 }}
                  exit={reduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
                  transition={{ duration: reduceMotion ? 0.12 : 0.2, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <motion.div
                    initial={reduceMotion ? false : { y: -6 }}
                    animate={{ y: 0 }}
                    exit={reduceMotion ? undefined : { y: -4 }}
                    transition={{ duration: reduceMotion ? 0.12 : 0.18, ease: "easeOut" }}
                    className="grid gap-3 px-3 pb-3"
                  >
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
                  </motion.div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          </section>
        </div>

        <section className="flex min-h-0 flex-1 flex-col space-y-3 px-3 pb-4">

          <SearchInput
            id="add-consultant"
            value={addQuery}
            onChange={setAddQuery}
            placeholder={t("radar.compare.quickAddPlaceholder")}
          />

          <motion.div layout="position" transition={layoutTransition} className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
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
          </motion.div>

          <motion.div layout="position" transition={layoutTransition} className="min-h-7">
            <LayoutGroup>
            <motion.div layout="position" transition={layoutTransition} className="flex min-h-7 flex-wrap items-center gap-1.5">
            <AnimatePresence initial={false} mode="popLayout">
            {selectedIds.map((selectedId) => {
              const consultant = consultants.find((item) => item.value === selectedId);
              if (!consultant) {
                return null;
              }

              return (
                <motion.span
                  layout
                  initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -2 }}
                  transition={{ duration: reduceMotion ? 0.12 : 0.18, ease: [0.22, 1, 0.36, 1] }}
                  key={consultant.value}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-2.5 py-1 text-xs text-foreground"
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
                </motion.span>
              );
            })}
            </AnimatePresence>
            </motion.div>
            </LayoutGroup>
          </motion.div>

          <motion.div layout="position" transition={layoutTransition} className="max-h-[52vh] overflow-y-auto pr-1 [scrollbar-gutter:stable] lg:min-h-0 lg:max-h-none lg:flex-1 lg:overflow-visible">
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
                      className={`animate-selection-card-in relative flex min-h-[5.25rem] w-full items-center justify-between gap-3 overflow-hidden rounded-[14px] border px-3 py-2.5 text-left transition-[background-color,border-color] ${
                        selected
                          ? "border-[#021e57]/18 bg-[#021e57]/[0.05] dark:border-[#839df9]/28 dark:bg-[#12306f]/24"
                          : "border-border/80 bg-background hover:border-border hover:bg-muted/20"
                      } ${
                        disabled
                          ? "cursor-not-allowed opacity-40"
                          : "cursor-pointer"
                      }`}
                    >
                      <Tooltip>
                        <TooltipTrigger
                          type="button"
                          aria-label={t(`radar.compare.projectStatus.${consultant.inProject ? "in-project" : "available"}`)}
                          className={`absolute inset-y-0 left-0 w-1.5 ${
                            consultant.inProject
                              ? "bg-amber-500/55 dark:bg-amber-300/55"
                              : "bg-emerald-500/55 dark:bg-emerald-300/55"
                          }`}
                        />
                        <TooltipContent>
                          <TooltipTitle>{t(`radar.compare.projectStatus.${consultant.inProject ? "in-project" : "available"}`)}</TooltipTitle>
                        </TooltipContent>
                      </Tooltip>
                      <span className="flex min-w-0 flex-1 items-start gap-3">
                        <span className="flex min-w-0 flex-1 flex-col gap-2">
                          <span className="flex min-w-0 items-start justify-between gap-3">
                            <span className="min-w-0 space-y-1">
                              <span className="block truncate text-sm font-semibold text-foreground">{consultant.label}</span>
                              <span className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                                <span className="inline-flex items-center gap-1">
                                  <MapPinIcon className="size-3" />
                                  {consultant.city}
                                </span>
                                <span aria-hidden="true" className="text-border">/</span>
                                <span className="inline-flex items-center gap-1">
                                  <BriefcaseBusinessIcon className="size-3" />
                                  {getDepartmentAbbreviation(consultant.department)}
                                </span>
                              </span>
                            </span>
                          </span>
                          <span className="flex flex-wrap items-center gap-1.5">
                            {cvsByUserId[consultant.value] ? (
                              <UpdateDatePill updatedAt={cvsByUserId[consultant.value].updated_at} locale={locale} selected={selected} />
                            ) : null}
                            {consultant.roleTags.map((role) => (
                              <MetaPill selected={selected} key={`${consultant.value}-${role}`} label={t(`radar.compare.roles.${role}`)} />
                            ))}
                          </span>
                        </span>
                      </span>
                      <div className="flex shrink-0 items-center justify-end self-stretch">
                        <span className="flex items-center justify-end">
                          <motion.span
                            aria-hidden="true"
                            initial={false}
                            animate={selected && !reduceMotion ? { scale: 1 } : { scale: 0.98 }}
                            transition={{ duration: reduceMotion ? 0.1 : 0.16, ease: "easeOut" }}
                            className={`flex size-7 items-center justify-center rounded-full border transition-colors ${
                              selected
                                ? "border-[#021e57] bg-[#021e57] text-white hover:bg-[#021b42] dark:border-[#839df9] dark:bg-[#839df9] dark:text-[#021e57] dark:hover:bg-[#9bb0ff]"
                                : "border-border/80 bg-muted/35 text-muted-foreground hover:border-[#021e57]/24 hover:bg-[#021e57]/[0.04] hover:text-[#021e57] dark:hover:border-[#9bb0ff]/35 dark:hover:bg-[#839df9]/12 dark:hover:text-[#e4ebff]"
                            }`}
                          >
                            <AnimatePresence initial={false}>
                              {selected ? (
                                <motion.span
                                  key="selected-check"
                                  initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.7 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.7 }}
                                  transition={{ duration: reduceMotion ? 0.1 : 0.14, ease: "easeOut" }}
                                >
                                  <CheckIcon className="size-3" />
                                </motion.span>
                              ) : null}
                            </AnimatePresence>
                          </motion.span>
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
          </motion.div>
        </section>

      </CardContent>
    </Card>
  );
}
