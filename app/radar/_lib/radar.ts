import type { FlowcaseCv, FlowcaseTechnologyCategory, FlowcaseUserSummary } from "@/lib/flowcase";
import { translateConsultantTitle } from "@/lib/i18n";

export const RADAR_STATISTIC = "category-score" as const;
export const RANGE_ACTIVE_THRESHOLD = 3 as const;
export const RANGE_STAGE_IDS = ["design", "frontend", "backend", "cloud"] as const;
export const PROJECT_STATUS_OPTIONS = ["in-project", "available"] as const;
export const RADAR_PRESET_IDS = ["default", "frontend-core", "ux-accessibility", "platform"] as const;
export const RADAR_VISUALIZATION_MODES = ["radar", "range"] as const;
export const RANGE_TEAM_SIZES = [1, 2, 3, 4] as const;
export const RADAR_MAX_SELECTED = 5 as const;
export const RANGE_MAX_SELECTED = 4 as const;

export type RadarStatistic = typeof RADAR_STATISTIC;
export type RadarPresetId = (typeof RADAR_PRESET_IDS)[number];
export type RadarVisualizationMode = (typeof RADAR_VISUALIZATION_MODES)[number];
export type RangeStageId = (typeof RANGE_STAGE_IDS)[number];

export type RadarAxisDatum = {
  category: string;
  categoryLabel: string;
  value: number;
  fullMark: number;
};

export type RadarSeriesDatum = RadarAxisDatum & {
  consultantId: string;
  consultantName: string;
};

export type RadarSeries = {
  consultantId: string;
  consultantName: string;
  office: string;
  title: string;
  data: RadarSeriesDatum[];
};

export type RadarOfficeSeries = {
  officeId: string;
  officeName: string;
  consultants: number;
  data: RadarAxisDatum[];
};

export type ConsultantRangeStage = {
  id: RangeStageId;
  value: number;
  active: boolean;
};

export type ConsultantRangeSeries = {
  consultantId: string;
  consultantName: string;
  office: string;
  title: string;
  stages: ConsultantRangeStage[];
  stageSkills: Record<RangeStageId, string[]>;
  startIndex: number;
  endIndex: number;
  strongestStageId: RangeStageId;
};

export type RangeCoverageSummary = {
  coveredStageIds: RangeStageId[];
  missingStageIds: RangeStageId[];
  isFullyCovered: boolean;
  isWithinRecommendedTeamSize: boolean;
};

export type RangeRecommendation = {
  consultantIds: string[];
  consultantNames: string[];
  coverage: RangeCoverageSummary;
  teamSize: number;
  stageStrength: number;
};

export type RangeTeamSize = (typeof RANGE_TEAM_SIZES)[number];
export type ProjectStatusFilter = (typeof PROJECT_STATUS_OPTIONS)[number];

export type RadarConsultantOption = {
  value: string;
  label: string;
  hint: string;
  city: string;
  department: string;
  roleTags: string[];
  inProject: boolean;
  searchValue: string;
};

export type RadarConsultantFilters = {
  cities: string[];
  departments: string[];
  roles: string[];
  projectStatuses: ProjectStatusFilter[];
};

export const EMPTY_RADAR_CONSULTANT_FILTERS: RadarConsultantFilters = {
  cities: [],
  departments: [],
  roles: [],
  projectStatuses: [],
};

export type RadarUrlState = {
  selectedIds: string[];
  visualizationMode: RadarVisualizationMode;
  presetId: RadarPresetId;
  recommendedTeamSize: RangeTeamSize;
  filters: RadarConsultantFilters;
};

export const DEFAULT_RADAR_URL_STATE: RadarUrlState = {
  selectedIds: [],
  visualizationMode: "radar",
  presetId: "frontend-core",
  recommendedTeamSize: 3,
  filters: EMPTY_RADAR_CONSULTANT_FILTERS,
};

export type RadarFieldOption = {
  id: string;
  label: string;
  description: string;
  categorySlug: string;
};

export type RadarPresetOption = {
  id: RadarPresetId;
  fields: RadarFieldOption[];
};

const presetCategoryMap: Record<Exclude<RadarPresetId, "default">, string[]> = {
  "frontend-core": [
    "web-development",
    "accessibility-wcag",
    "design-systems-components",
    "quality-performance-maintenance",
    "integrations-security-privacy",
  ],
  "ux-accessibility": [
    "ux-interaction-frontend",
    "accessibility-wcag",
    "design-systems-components",
    "cms-content-platforms",
    "web-development",
  ],
  platform: [
    "frontend-cloud-devops",
    "quality-performance-maintenance",
    "integrations-security-privacy",
    "web-development",
    "cms-content-platforms",
  ],
};

const rangeStageCategoryMap: Record<RangeStageId, string[]> = {
  design: ["ux-interaction-frontend", "accessibility-wcag", "design-systems-components"],
  frontend: ["web-development", "cms-content-platforms"],
  backend: ["integrations-security-privacy", "quality-performance-maintenance"],
  cloud: ["frontend-cloud-devops"],
};

export function firstValue(value: string | string[] | undefined, fallback = "") {
  if (Array.isArray(value)) {
    return value[0] ?? fallback;
  }

  return value ?? fallback;
}

export function listValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value.flatMap((entry) =>
      entry
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    );
  }

  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function uniqueValues<T>(values: T[]) {
  return [...new Set(values)];
}

function filterAllowedValues<T extends string>(values: string[], allowedValues: readonly T[]) {
  const allowed = new Set<string>(allowedValues);
  return uniqueValues(values).filter((value): value is T => allowed.has(value));
}

function parseRangeTeamSize(value: string | string[] | undefined) {
  const parsed = Number(firstValue(value, String(DEFAULT_RADAR_URL_STATE.recommendedTeamSize)));

  return RANGE_TEAM_SIZES.includes(parsed as RangeTeamSize)
    ? (parsed as RangeTeamSize)
    : DEFAULT_RADAR_URL_STATE.recommendedTeamSize;
}

function normalizeSelectedIds(selectedIds: string[], maxSelected: number, consultantOptions: RadarConsultantOption[]) {
  const validConsultantIds = new Set(consultantOptions.map((consultant) => consultant.value));

  return uniqueValues(selectedIds).filter((selectedId) => validConsultantIds.has(selectedId)).slice(0, maxSelected);
}

export function parseRadarUrlState(
  searchParams: Record<string, string | string[] | undefined>,
  consultantOptions: RadarConsultantOption[],
): RadarUrlState {
  const visualizationMode = filterAllowedValues(listValue(searchParams.view), RADAR_VISUALIZATION_MODES)[0]
    ?? DEFAULT_RADAR_URL_STATE.visualizationMode;
  const presetId = filterAllowedValues(listValue(searchParams.preset), RADAR_PRESET_IDS)[0] ?? DEFAULT_RADAR_URL_STATE.presetId;
  const recommendedTeamSize = parseRangeTeamSize(searchParams.team);
  const maxSelected = visualizationMode === "range" ? RANGE_MAX_SELECTED : RADAR_MAX_SELECTED;

  const cityOptions = uniqueValues(consultantOptions.map((consultant) => consultant.city).filter(Boolean));
  const departmentOptions = uniqueValues(consultantOptions.map((consultant) => consultant.department).filter(Boolean));
  const roleOptions = uniqueValues(consultantOptions.flatMap((consultant) => consultant.roleTags));

  return {
    selectedIds: normalizeSelectedIds(listValue(searchParams.selected), maxSelected, consultantOptions),
    visualizationMode,
    presetId,
    recommendedTeamSize,
    filters: {
      cities: filterAllowedValues(listValue(searchParams.city), cityOptions),
      departments: filterAllowedValues(listValue(searchParams.dept), departmentOptions),
      roles: filterAllowedValues(listValue(searchParams.role), roleOptions),
      projectStatuses: filterAllowedValues(listValue(searchParams.status), PROJECT_STATUS_OPTIONS),
    },
  };
}

export function serializeRadarUrlState(state: RadarUrlState) {
  const query = new URLSearchParams();

  state.selectedIds.forEach((selectedId) => {
    query.append("selected", selectedId);
  });

  if (state.visualizationMode !== DEFAULT_RADAR_URL_STATE.visualizationMode) {
    query.set("view", state.visualizationMode);
  }

  if (state.visualizationMode === "radar" && state.presetId !== DEFAULT_RADAR_URL_STATE.presetId) {
    query.set("preset", state.presetId);
  }

  if (state.visualizationMode === "range" && state.recommendedTeamSize !== DEFAULT_RADAR_URL_STATE.recommendedTeamSize) {
    query.set("team", String(state.recommendedTeamSize));
  }

  state.filters.cities.forEach((city) => {
    query.append("city", city);
  });

  state.filters.departments.forEach((department) => {
    query.append("dept", department);
  });

  state.filters.roles.forEach((role) => {
    query.append("role", role);
  });

  state.filters.projectStatuses.forEach((projectStatus) => {
    query.append("status", projectStatus);
  });

  return query.toString();
}

export function buildRadarData(
  _statistic: RadarStatistic,
  cv: FlowcaseCv,
  _consultant: FlowcaseUserSummary,
  fields: RadarFieldOption[],
): RadarAxisDatum[] {
  return fields.map((field) => {
    const value = cv.category_scores.find((score) => score.category_slug === field.categorySlug)?.score ?? 0;

    return {
      category: field.id,
      categoryLabel: field.label,
      value,
      fullMark: 5,
    };
  });
}

export function buildConsultantOption(consultant: FlowcaseUserSummary): RadarConsultantOption {
  const hint = `${consultant.office_name} - ${translateConsultantTitle(consultant.title)}`;

  return {
    value: consultant.user_id,
    label: consultant.name,
    hint,
    city: consultant.city,
    department: consultant.department ?? "",
    roleTags: consultant.role_tags ?? [],
    inProject: consultant.in_project,
    searchValue: `${consultant.name} (${hint})`,
  };
}

export function buildConsultantSearchIndex(consultant: FlowcaseUserSummary) {
  return [
    consultant.name,
    consultant.office_name,
    consultant.title,
    consultant.professional_title,
    consultant.default_cv?.keyword_slugs.join(" ") ?? "",
  ]
    .join(" ")
    .toLowerCase();
}

export function matchesConsultantFilters(
  consultant: Pick<RadarConsultantOption, "city" | "department" | "roleTags" | "inProject">,
  filters: RadarConsultantFilters,
) {
  if (filters.cities.length > 0 && !filters.cities.includes(consultant.city)) {
    return false;
  }

  if (filters.departments.length > 0 && !filters.departments.includes(consultant.department)) {
    return false;
  }

  if (filters.roles.length > 0 && !filters.roles.every((role) => consultant.roleTags.includes(role))) {
    return false;
  }

  if (filters.projectStatuses.length > 0) {
    const projectStatus = consultant.inProject ? "in-project" : "available";

    if (!filters.projectStatuses.includes(projectStatus)) {
      return false;
    }
  }

  return true;
}

function buildCategoryFields(categories: FlowcaseTechnologyCategory[]): RadarFieldOption[] {
  return categories.map((category) => ({
    id: `category:${category.slug}`,
    label: category.values.no,
    description: category.values.no,
    categorySlug: category.slug,
  }));
}

export function buildStandardRadarPresets(categories: FlowcaseTechnologyCategory[]): RadarPresetOption[] {
  const allCategoryFields = buildCategoryFields(categories);
  const fieldsById = new Map(allCategoryFields.map((field) => [field.id, field]));
  const toFields = (slugs: string[]) => slugs.map((slug) => fieldsById.get(`category:${slug}`)).filter((field): field is RadarFieldOption => Boolean(field));

  return [
    { id: "default", fields: allCategoryFields },
    {
      id: "frontend-core",
      fields: toFields(presetCategoryMap["frontend-core"]),
    },
    {
      id: "ux-accessibility",
      fields: toFields(presetCategoryMap["ux-accessibility"]),
    },
    {
      id: "platform",
      fields: toFields(presetCategoryMap.platform),
    },
  ];
}

export function buildRadarSeries(
  statistic: RadarStatistic,
  consultant: FlowcaseUserSummary,
  cv: FlowcaseCv,
  fields: RadarFieldOption[],
): RadarSeries {
  const data = buildRadarData(statistic, cv, consultant, fields).map((axis) => ({
    ...axis,
    consultantId: consultant.user_id,
    consultantName: consultant.name,
  }));

  return {
    consultantId: consultant.user_id,
    consultantName: consultant.name,
    office: consultant.office_name,
    title: translateConsultantTitle(consultant.title),
    data,
  };
}

function getCategoryScore(cv: FlowcaseCv, categorySlug: string) {
  return cv.category_scores.find((score) => score.category_slug === categorySlug)?.score ?? 0;
}

function average(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function buildConsultantRangeSeries(consultant: FlowcaseUserSummary, cv: FlowcaseCv): ConsultantRangeSeries {
  const stagesWithSkills = RANGE_STAGE_IDS.map((stageId) => {
    const relevantTechnologies = cv.technologies.filter((technology) =>
      rangeStageCategoryMap[stageId].includes(technology.category.slug),
    );
    const scoredSkills = relevantTechnologies.flatMap((technology) =>
      technology.technology_skills.map((skill) => ({
        label: skill.name.no,
        score: skill.proficiency,
      })),
    );
    const categoryScores = rangeStageCategoryMap[stageId].map((categorySlug) => getCategoryScore(cv, categorySlug));
    const score = average(categoryScores);
    const skills = scoredSkills
      .filter((item) => item.score > 0)
      .sort((left, right) => right.score - left.score)
      .map((item) => item.label)
      .filter((skill, index, allSkills) => allSkills.indexOf(skill) === index);

    return {
      id: stageId,
      value: Number(score.toFixed(1)),
      active: score >= RANGE_ACTIVE_THRESHOLD,
      skills,
    };
  });

  const stages = stagesWithSkills.map(({ id, value, active }) => ({ id, value, active } satisfies ConsultantRangeStage));
  const stageSkills = Object.fromEntries(
    stagesWithSkills.map(({ id, skills }) => [id, skills]),
  ) as Record<RangeStageId, string[]>;

  const activeIndices = stages.flatMap((stage, index) => (stage.active ? [index] : []));
  const strongestIndex = stages.reduce(
    (bestIndex, stage, index, allStages) => (stage.value > allStages[bestIndex].value ? index : bestIndex),
    0,
  );
  const startIndex = activeIndices[0] ?? strongestIndex;
  const endIndex = activeIndices[activeIndices.length - 1] ?? strongestIndex;

  return {
    consultantId: consultant.user_id,
    consultantName: consultant.name,
    office: consultant.office_name,
    title: translateConsultantTitle(consultant.title),
    stages,
    stageSkills,
    startIndex,
    endIndex,
    strongestStageId: stages[strongestIndex]?.id ?? "frontend",
  };
}

export function buildRangeCoverageSummary(
  series: ConsultantRangeSeries[],
  maxRecommendedConsultants = 3,
): RangeCoverageSummary {
  const coveredIndices = new Set<number>();

  series.forEach((consultant) => {
    for (let index = consultant.startIndex; index <= consultant.endIndex; index += 1) {
      coveredIndices.add(index);
    }
  });

  const coveredStageIds = RANGE_STAGE_IDS.filter((_, index) => coveredIndices.has(index));
  const missingStageIds = RANGE_STAGE_IDS.filter((_, index) => !coveredIndices.has(index));

  return {
    coveredStageIds,
    missingStageIds,
    isFullyCovered: missingStageIds.length === 0,
    isWithinRecommendedTeamSize: series.length > 0 && series.length <= maxRecommendedConsultants,
  };
}

function getRangeStageStrength(series: ConsultantRangeSeries[]) {
  return RANGE_STAGE_IDS.reduce((sum, stageId) => {
    const strongestValue = Math.max(...series.map((consultant) => consultant.stages.find((stage) => stage.id === stageId)?.value ?? 0), 0);
    return sum + strongestValue;
  }, 0);
}

function buildRangeRecommendation(series: ConsultantRangeSeries[], maxRecommendedConsultants: number): RangeRecommendation {
  const coverage = buildRangeCoverageSummary(series, maxRecommendedConsultants);

  return {
    consultantIds: series.map((consultant) => consultant.consultantId),
    consultantNames: series.map((consultant) => consultant.consultantName),
    coverage,
    teamSize: series.length,
    stageStrength: Number(getRangeStageStrength(series).toFixed(1)),
  };
}

function compareRangeRecommendations(left: RangeRecommendation, right: RangeRecommendation) {
  if (left.coverage.isFullyCovered !== right.coverage.isFullyCovered) {
    return left.coverage.isFullyCovered ? -1 : 1;
  }

  if (left.coverage.missingStageIds.length !== right.coverage.missingStageIds.length) {
    return left.coverage.missingStageIds.length - right.coverage.missingStageIds.length;
  }

  if (left.teamSize !== right.teamSize) {
    return left.teamSize - right.teamSize;
  }

  if (left.stageStrength !== right.stageStrength) {
    return right.stageStrength - left.stageStrength;
  }

  return left.consultantNames.join("|").localeCompare(right.consultantNames.join("|"));
}

export function buildBestRangeRecommendation(
  consultants: ConsultantRangeSeries[],
  targetTeamSize: RangeTeamSize,
): RangeRecommendation | null {
  if (consultants.length === 0 || consultants.length < targetTeamSize) {
    return null;
  }

  let bestRecommendation: RangeRecommendation | null = null;

  function visit(startIndex: number, selection: ConsultantRangeSeries[]) {
    if (selection.length === targetTeamSize) {
      const candidate = buildRangeRecommendation(selection, targetTeamSize);
      if (!bestRecommendation || compareRangeRecommendations(candidate, bestRecommendation) < 0) {
        bestRecommendation = candidate;
      }
      return;
    }

    for (let index = startIndex; index < consultants.length; index += 1) {
      selection.push(consultants[index]);
      visit(index + 1, selection);
      selection.pop();
    }
  }

  visit(0, []);

  return bestRecommendation;
}

export function buildOfficeAverageSeries(
  consultants: FlowcaseUserSummary[],
  cvByUserId: Map<string, FlowcaseCv>,
  fields: RadarFieldOption[],
  statistic: RadarStatistic,
): RadarOfficeSeries[] {
  const grouped = new Map<string, FlowcaseUserSummary[]>();

  consultants.forEach((consultant) => {
    const bucket = grouped.get(consultant.office_id) ?? [];
    bucket.push(consultant);
    grouped.set(consultant.office_id, bucket);
  });

  return [...grouped.entries()].map(([officeId, members]) => {
    const officeName = members[0]?.office_name ?? officeId;

    const data = fields.map((field) => {
      const values = members.map((consultant) => {
        const cv = cvByUserId.get(consultant.user_id);
        if (!cv) {
          return 0;
        }

        return buildRadarData(statistic, cv, consultant, fields).find((axis) => axis.category === field.id)?.value ?? 0;
      });

      const average = values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;

      return {
        category: field.id,
        categoryLabel: field.label,
        value: Number(average.toFixed(2)),
        fullMark: 5,
      };
    });

    return {
      officeId,
      officeName,
      consultants: members.length,
      data,
    };
  });
}
