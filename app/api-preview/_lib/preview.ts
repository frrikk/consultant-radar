import type {
  FlowcaseCategoryScore,
  FlowcaseCompareResponse,
  FlowcaseCv,
  FlowcaseUserSummary,
} from "@/lib/flowcase";

export type SearchParamsRecord = { [key: string]: string | string[] | undefined };

export type ChartSeries = {
  label: string;
  axes: Array<{
    key: string;
    label: string;
    value: number;
  }>;
};

export type ConsultantSeries = ChartSeries & {
  consultantId: string;
  office: string;
  title: string;
  keywords: string[];
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

export function scoreTone(score: number) {
  if (score >= 4.5) return "bg-emerald-500/18 text-emerald-950 ring-emerald-600/25";
  if (score >= 3.5) return "bg-sky-500/16 text-sky-950 ring-sky-600/25";
  if (score >= 2.5) return "bg-amber-400/18 text-amber-950 ring-amber-600/25";
  return "bg-rose-400/18 text-rose-950 ring-rose-600/25";
}

export function formatKeyword(slug: string) {
  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function buildChartSeries(
  label: string,
  scores: Array<Pick<FlowcaseCategoryScore, "category_slug" | "label" | "score">>,
): ChartSeries {
  return {
    label,
    axes: scores.map((score) => ({
      key: score.category_slug,
      label: score.label,
      value: score.score,
    })),
  };
}

export function asConsultants(items: FlowcaseCompareResponse["items"]) {
  return items.filter((item): item is FlowcaseUserSummary =>
    typeof item === "object" && item !== null && "user_id" in item,
  );
}

export function buildConsultantSeries(
  consultants: FlowcaseUserSummary[],
  cvByUserId: Map<string, FlowcaseCv>,
): ConsultantSeries[] {
  return consultants.map((consultant) => {
    const cv = cvByUserId.get(consultant.user_id);
    const scores = cv?.category_scores ?? consultant.default_cv?.category_scores ?? [];

    return {
      consultantId: consultant.user_id,
      office: consultant.office_name,
      title: consultant.title,
      keywords: consultant.default_cv?.keyword_slugs.slice(0, 10) ?? [],
      ...buildChartSeries(consultant.name, scores),
    };
  });
}

export function buildOfficeSeries(comparisonItems: FlowcaseCompareResponse["items"]) {
  return comparisonItems.map((item) => {
    const officeItem = item as {
      label: string;
      category_scores: Array<{ category_slug: string; label: string; score: number }>;
    };

    return buildChartSeries(officeItem.label, officeItem.category_scores);
  });
}

export function buildRetainedQuery(params: {
  city?: string;
  title?: string;
  category?: string;
  rawKeywords?: string;
  comparison: string;
}) {
  return new URLSearchParams(
    Object.fromEntries(
      [
        params.city ? ["city", params.city] : null,
        params.title ? ["title", params.title] : null,
        params.category ? ["category", params.category] : null,
        params.rawKeywords ? ["keywords", params.rawKeywords] : null,
        ["comparison", params.comparison],
      ].filter(Boolean) as [string, string][],
    ),
  ).toString();
}
