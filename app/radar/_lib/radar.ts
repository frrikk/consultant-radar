import type { FlowcaseCv, FlowcaseTechnologyCategory, FlowcaseUserSummary } from "@/lib/flowcase";
import { translateConsultantTitle } from "@/lib/i18n";

export const RADAR_STATISTIC = "category-score" as const;

export type RadarStatistic = typeof RADAR_STATISTIC;
export type RadarConfigMode = "standard" | "custom";
export type RadarFieldSource = "category" | "skill";
export type RadarPresetId = "default" | "frontend-core" | "ux-accessibility" | "platform";

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
  sourceType: RadarFieldSource;
  categorySlug: string;
  skillSlug?: string;
  searchValue: string;
};

export type RadarPresetOption = {
  id: RadarPresetId;
  fieldIds: string[];
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

function getSkillValue(cv: FlowcaseCv, skillSlug: string) {
  return (
    cv.technologies
      .flatMap((group) => group.technology_skills)
      .find((skill) => skill.slug === skillSlug)?.proficiency ?? 0
  );
}

export function buildRadarData(
  _statistic: RadarStatistic,
  cv: FlowcaseCv,
  _consultant: FlowcaseUserSummary,
  fields: RadarFieldOption[],
): RadarAxisDatum[] {
  return fields.map((field) => {
    const value =
      field.sourceType === "category"
        ? cv.category_scores.find((score) => score.category_slug === field.categorySlug)?.score ?? 0
        : getSkillValue(cv, field.skillSlug ?? "");

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

export function buildRadarFieldCatalog(
  categories: FlowcaseTechnologyCategory[],
  cvs: FlowcaseCv[],
): RadarFieldOption[] {
  const categoryFields = categories.map((category) => ({
    id: `category:${category.slug}`,
    label: category.values.no,
    description: category.values.no,
    sourceType: "category" as const,
    categorySlug: category.slug,
    searchValue: `${category.values.no} ${category.slug}`.toLowerCase(),
  }));

  const skillsBySlug = new Map<string, RadarFieldOption>();

  cvs.forEach((cv) => {
    cv.technologies.forEach((group) => {
      group.technology_skills.forEach((skill) => {
        if (skillsBySlug.has(skill.slug)) {
          return;
        }

        skillsBySlug.set(skill.slug, {
          id: `skill:${skill.slug}`,
          label: skill.name.no,
          description: group.category.values.no,
          sourceType: "skill",
          categorySlug: group.category.slug,
          skillSlug: skill.slug,
          searchValue: `${skill.name.no} ${skill.slug} ${group.category.values.no}`.toLowerCase(),
        });
      });
    });
  });

  return [...categoryFields, ...[...skillsBySlug.values()].sort((left, right) => left.label.localeCompare(right.label))];
}

export function buildStandardRadarPresets(categories: FlowcaseTechnologyCategory[]): RadarPresetOption[] {
  const allCategoryFieldIds = categories.map((category) => `category:${category.slug}`);

  return [
    { id: "default", fieldIds: allCategoryFieldIds },
    {
      id: "frontend-core",
      fieldIds: presetCategoryMap["frontend-core"].map((slug) => `category:${slug}`),
    },
    {
      id: "ux-accessibility",
      fieldIds: presetCategoryMap["ux-accessibility"].map((slug) => `category:${slug}`),
    },
    {
      id: "platform",
      fieldIds: presetCategoryMap.platform.map((slug) => `category:${slug}`),
    },
  ];
}

export function resolveRadarFields(
  mode: RadarConfigMode,
  presetId: RadarPresetId,
  customFieldIds: string[],
  catalog: RadarFieldOption[],
  presets: RadarPresetOption[],
) {
  const catalogById = new Map(catalog.map((field) => [field.id, field]));

  if (mode === "standard") {
    const preset = presets.find((item) => item.id === presetId) ?? presets[0];
    return preset.fieldIds
      .map((fieldId) => catalogById.get(fieldId))
      .filter((field): field is RadarFieldOption => Boolean(field));
  }

  return customFieldIds
    .map((fieldId) => catalogById.get(fieldId))
    .filter((field): field is RadarFieldOption => Boolean(field));
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
