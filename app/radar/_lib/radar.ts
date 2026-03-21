import type { FlowcaseCv, FlowcaseTechnologyCategory, FlowcaseUserSummary } from "@/lib/flowcase";
import { translateConsultantTitle } from "@/lib/i18n";

export const RADAR_STATISTIC = "category-score" as const;
export const RANGE_ACTIVE_THRESHOLD = 3 as const;
export const RANGE_STAGE_IDS = ["design", "frontend", "backend", "cloud"] as const;

export type RadarStatistic = typeof RADAR_STATISTIC;
export type RadarPresetId = "default" | "frontend-core" | "ux-accessibility" | "platform";
export type RadarVisualizationMode = "radar" | "range";
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

export type RangeTeamSize = 1 | 2 | 3 | 4;

export type RadarConsultantOption = {
  value: string;
  label: string;
  hint: string;
  city: string;
  department: string;
  roleTags: string[];
  searchValue: string;
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
  const stages = RANGE_STAGE_IDS.map((stageId) => {
    const score = average(rangeStageCategoryMap[stageId].map((categorySlug) => getCategoryScore(cv, categorySlug)));

    return {
      id: stageId,
      value: Number(score.toFixed(1)),
      active: score >= RANGE_ACTIVE_THRESHOLD,
    } satisfies ConsultantRangeStage;
  });

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
