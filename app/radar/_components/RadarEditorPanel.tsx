"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { BriefcaseBusinessIcon, MapPinIcon, RotateCcwIcon, SearchIcon, XIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { formatLocaleShortDate, getT } from "@/lib/i18n";
import { type RadarPresetId } from "../_lib/radar";
import type { FlowcaseCv } from "@/lib/flowcase";

type ConsultantOption = {
  value: string;
  label: string;
  hint: string;
  city: string;
  department: string;
  roleTags: string[];
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

function uniqueIds(values: string[]) {
  return [...new Set(values)].slice(0, 5);
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
      pill: "text-emerald-700 dark:text-emerald-300",
    };
  }

  if (ageInDays < 90) {
    return {
      dot: "bg-amber-500 dark:bg-amber-400",
      pill: "text-amber-700 dark:text-amber-300",
    };
  }

  return {
    dot: "bg-red-500 dark:bg-red-400",
    pill: "text-red-700 dark:text-red-300",
  };
}

function UpdateDatePill({ updatedAt }: { updatedAt: string }) {
  const tone = getUpdateTone(updatedAt);

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full bg-muted px-2 py-0.5 text-[11px] ${tone.pill}`}>
      <span className={`size-1.5 rounded-full ${tone.dot}`} />
      {formatLocaleShortDate(updatedAt)}
    </span>
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

function isAddDisabled(selectedIds: string[], consultantId: string) {
  return selectedIds.includes(consultantId) || selectedIds.length >= 5;
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
        className="h-10 rounded-xl border-border bg-background pl-9 text-sm"
      />
    </div>
  );
}

function matchesActiveFilters(
  consultant: ConsultantOption,
  selectedCities: string[],
  selectedDepartments: string[],
  selectedRoles: string[],
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
}: RadarEditorPanelProps) {
  const t = getT();
  const [addQuery, setAddQuery] = useState("");
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

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
      if (!matchesActiveFilters(consultant, selectedCities, selectedDepartments, selectedRoles)) {
        return false;
      }

      return true;
    });

    if (!query) {
      return pool;
    }

    return pool.filter((consultant) => consultant.searchValue.toLowerCase().includes(query));
  }, [consultants, addQuery, selectedCities, selectedDepartments, selectedRoles]);
  const addMatches = filteredCandidates.filter((consultant) => !selectedSet.has(consultant.value)).slice(0, 5);
  const emptySlots = Math.max(0, 5 - addMatches.length);

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

  function clearFilters() {
    setSelectedCities([]);
    setSelectedDepartments([]);
    setSelectedRoles([]);
  }

  useEffect(() => {
    const filteredSelectedIds = selectedIds.filter((selectedId) => {
      const consultant = consultants.find((item) => item.value === selectedId);
      if (!consultant) {
        return false;
      }

      return matchesActiveFilters(consultant, selectedCities, selectedDepartments, selectedRoles);
    });

    if (!sameIds(filteredSelectedIds, selectedIds)) {
      onSelectedIdsChange(filteredSelectedIds);
    }
  }, [consultants, onSelectedIdsChange, selectedCities, selectedDepartments, selectedIds, selectedRoles]);

  function handleAddSelected(id: string) {
    onSelectedIdsChange(uniqueIds([...selectedIds, id]));
    setAddQuery("");
  }

  function handleRemoveSelected(id: string) {
    const next = selectedIds.filter((value) => value !== id);
    onSelectedIdsChange(next);
  }

  return (
    <Card className="rounded-[24px] border border-border bg-card py-0 shadow-none">
      <CardContent className="space-y-5 px-0 pt-0">
        <section className="space-y-3 border-b border-border/70 px-4 pt-4 pb-5">
          <p className="text-sm font-semibold text-foreground">{t("radar.config.modeTitle")}</p>
          <div className="space-y-1.5">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
              {t("radar.config.standardTitle")}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {presetOptions.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => onPresetChange(preset.id)}
                  className={`rounded-md border px-2.5 py-1.5 text-sm transition-colors ${
                    presetId === preset.id
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-foreground hover:border-accent"
                  }`}
                >
                  {t(`radar.config.presets.${preset.id}`)}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-3 px-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-foreground">{t("radar.compare.consultantsTitle")}</p>
            <Badge className="border-border bg-muted/50 text-foreground hover:bg-muted/50">
              {t("radar.compare.selectedCount", { count: selectedIds.length })}
            </Badge>
          </div>

          <div className="grid gap-3 border-b border-border/70 pb-4">
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={clearFilters}
                disabled={selectedDepartments.length === 0 && selectedCities.length === 0 && selectedRoles.length === 0}
                className="text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground disabled:cursor-default disabled:opacity-40 disabled:hover:text-muted-foreground"
              >
                {t("radar.compare.clearFilters")}
              </button>
            </div>

            <div className="space-y-1.5">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                {t("radar.compare.roleTitle")}
              </p>
              <div className="flex flex-wrap justify-start gap-1.5">
                {ROLE_OPTIONS.map((role) => {
                  const active = selectedRoles.includes(role);

                  return (
                     <label
                       key={role}
                       className="inline-flex w-fit items-center justify-start gap-2 rounded-md border border-border bg-muted/35 px-2.5 py-1.5 text-left text-sm text-foreground"
                     >
                      <Checkbox className="mt-0" checked={active} onCheckedChange={() => toggleRole(role)} />
                      <span>{t(`radar.compare.roles.${role}`)}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                {t("radar.compare.departmentTitle")}
              </p>
              <div className="flex flex-wrap justify-start gap-1.5">
                {departmentOptions.map((department) => {
                  const active = selectedDepartments.includes(department);

                  return (
                     <label
                       key={department}
                       className="inline-flex w-fit items-center justify-start gap-2 rounded-md border border-border bg-muted/35 px-2.5 py-1.5 text-left text-sm text-foreground"
                     >
                      <Checkbox className="mt-0" checked={active} onCheckedChange={() => toggleDepartment(department)} />
                      <span>{department}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                {t("radar.compare.locationTitle")}
              </p>
              <div className="flex flex-wrap justify-start gap-1.5">
                {cityOptions.map((city) => {
                  const active = selectedCities.includes(city);

                  return (
                     <label
                       key={city}
                       className="inline-flex w-fit items-center justify-start gap-2 rounded-md border border-border bg-muted/35 px-2.5 py-1.5 text-left text-sm text-foreground"
                     >
                      <Checkbox className="mt-0" checked={active} onCheckedChange={() => toggleCity(city)} />
                      <span>{city}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          <SearchInput
            id="add-consultant"
            value={addQuery}
            onChange={setAddQuery}
            placeholder={t("radar.compare.quickAddPlaceholder")}
          />

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{t("radar.compare.listCount", { count: filteredCandidates.length })}</span>
          </div>

          <div className="min-h-9 flex flex-wrap content-start gap-2">
            {selectedIds.map((selectedId) => {
              const consultant = consultants.find((item) => item.value === selectedId);
              if (!consultant) {
                return null;
              }

              return (
                <span
                  key={consultant.value}
                  className="animate-selection-card-in inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-3 py-1.5 text-sm text-foreground"
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

          <div className="h-[30rem] space-y-2 overflow-y-auto pr-1 [scrollbar-gutter:stable]">
            {addMatches.length > 0 ? (
              <>
                {addMatches.map((consultant) => (
                  <div
                    key={consultant.value}
                    role="button"
                   tabIndex={isAddDisabled(selectedIds, consultant.value) ? -1 : 0}
                   aria-disabled={isAddDisabled(selectedIds, consultant.value)}
                   onClick={() => {
                     if (!isAddDisabled(selectedIds, consultant.value)) {
                       handleAddSelected(consultant.value);
                     }
                   }}
                   onKeyDown={(event) => {
                     if (isAddDisabled(selectedIds, consultant.value)) {
                       return;
                     }

                     if (event.key === "Enter" || event.key === " ") {
                       event.preventDefault();
                       handleAddSelected(consultant.value);
                     }
                   }}
                    className={`animate-selection-card-in flex min-h-[6.75rem] w-full items-start justify-between gap-3 rounded-xl border border-border bg-muted/35 px-3 py-2.5 text-left transition-colors hover:border-accent hover:bg-muted/55 ${
                      isAddDisabled(selectedIds, consultant.value)
                        ? "cursor-not-allowed opacity-40"
                        : "cursor-pointer"
                    }`}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-foreground">{consultant.label}</span>
                      <span className="mt-2 flex flex-wrap gap-1.5">
                        <MetaPill icon={<MapPinIcon className="size-3" />} label={consultant.city} />
                      </span>
                      <span className="mt-1.5 flex flex-wrap gap-1.5">
                        {consultant.roleTags.map((role) => (
                          <MetaPill key={`${consultant.value}-${role}`} label={t(`radar.compare.roles.${role}`)} />
                        ))}
                      </span>
                    </span>
                    <span className="flex min-h-full w-[7.25rem] shrink-0 flex-col items-end justify-between gap-3 self-stretch">
                      <span className="flex items-center gap-2">
                        {cvsByUserId[consultant.value] ? <UpdateDatePill updatedAt={cvsByUserId[consultant.value].updated_at} /> : null}
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleAddSelected(consultant.value);
                          }}
                          disabled={isAddDisabled(selectedIds, consultant.value)}
                          className="whitespace-nowrap rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-background disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {t("radar.compare.addAction")}
                        </button>
                      </span>
                      <MetaPill icon={<BriefcaseBusinessIcon className="size-3" />} label={getDepartmentAbbreviation(consultant.department)} />
                    </span>
                  </div>
                ))}
                {Array.from({ length: emptySlots }).map((_, index) => (
                  <div
                    key={`empty-slot-${index}`}
                    aria-hidden="true"
                    className="flex min-h-[6.75rem] w-full rounded-xl border border-dashed border-border/60 bg-muted/10"
                  />
                ))}
              </>
            ) : (
              <div className="flex h-full min-h-48 items-center justify-center rounded-xl border border-dashed border-border/80 bg-muted/10 px-4 text-center text-sm text-muted-foreground">
                {t("radar.compare.emptyCandidates")}
              </div>
            )}
          </div>
        </section>

        <div className="flex flex-wrap gap-3 px-4 pb-4 pt-1">
          <Button type="button" variant="outline" onClick={onReset}>
            <RotateCcwIcon />
            {t("radar.controls.reset")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
