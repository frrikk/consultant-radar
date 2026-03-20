export type FlowcaseOffice = {
  _id: string;
  id: string;
  name: string;
  city: string;
  country_id: string;
  country_code: string;
  override_language_code: string;
  num_users: number;
  num_users_activated: number;
  num_users_deactivated: number;
};

export type FlowcaseCountry = {
  _id: string;
  id: string;
  code: string;
  name: string;
  native_language_code: string;
  language_codes: string[];
  offices: FlowcaseOffice[];
};

export type FlowcaseCategoryScore = {
  category_id: string;
  category_slug: string;
  label: string;
  score: number;
};

export type FlowcaseDefaultCvSummary = {
  _id: string;
  name: string;
  title: string;
  updated_at: string;
  category_scores: FlowcaseCategoryScore[];
  keyword_slugs: string[];
};

export type FlowcaseUserSummary = {
  id: string;
  user_id: string;
  external_unique_id: string;
  name: string;
  email: string;
  telephone: string;
  role: string;
  extra_roles: string[];
  default_cv_id: string;
  office_id: string;
  office_name: string;
  city: string;
  department?: string;
  country_id: string;
  country_code: string;
  language_code: string;
  title: string;
  professional_title: string;
  professional_title_no?: string;
  role_tags?: string[];
  seniority: string;
  experience_years: number;
  deactivated: boolean;
  created_at: string;
  updated_at: string;
  image: {
    url: string;
  };
  default_cv: FlowcaseDefaultCvSummary | null;
};

export type FlowcaseUsersSearchResponse = {
  offset: number;
  limit: number;
  total: number;
  users: FlowcaseUserSummary[];
};

export type FlowcaseTechnologyCategory = {
  id: string;
  _id: string;
  slug: string;
  order: number;
  aliases: string[];
  values: {
    int: string;
    no: string;
  };
};

export type FlowcaseTechnologyTag = {
  id: string;
  _id: string;
  slug: string;
  category_id: string;
  category_slug: string;
  external_unique_id: string;
  aliases: string[];
  values: {
    int: string;
    no: string;
  };
};

export type FlowcaseTechnologySkill = {
  _id: string;
  technology_id: string;
  slug: string;
  name: {
    int: string;
    no: string;
  };
  proficiency: number;
  total_duration_in_years: number;
  base_duration_in_years: number;
  offset_duration_in_years: number;
  tags: string[];
  order: number;
  version: number;
};

export type FlowcaseTechnologyGroup = {
  _id: string;
  category: {
    id: string;
    slug: string;
    values: {
      int: string;
      no: string;
    };
  };
  technology_skills: FlowcaseTechnologySkill[];
};

export type FlowcaseCv = {
  _id: string;
  id: string;
  user_id: string;
  name: string;
  title: string;
  titles: {
    int: string;
    no: string;
  };
  email: string;
  company_id: string;
  updated_at: string;
  owner_updated_at: string;
  country_code: string;
  language_code: string;
  language_codes: string[];
  custom_tag_ids: string[];
  radar_profile: Record<string, number>;
  category_scores: FlowcaseCategoryScore[];
  keyword_slugs: string[];
  technologies: FlowcaseTechnologyGroup[];
};

export type FlowcasePaginatedResponse<T> = {
  offset: number;
  limit: number;
  total: number;
  data: T[];
};

export type FlowcaseCompareItem = {
  id: string;
  label: string;
  consultants: number;
  category_scores: Array<{
    category_slug: string;
    label: string;
    score: number;
  }>;
  keyword_slugs: string[];
};

export type FlowcaseCompareResponse = {
  comparison: string;
  total: number;
  items: Array<FlowcaseCompareItem | FlowcaseUserSummary>;
};

export type FlowcaseSearchFilters = {
  city?: string;
  title?: string;
  name?: string;
  officeIds?: string[];
  keywords?: string[];
  categories?: string[];
  minCategoryScore?: number;
  minKeywordScore?: number;
  limit?: number;
  offset?: number;
};

const DEFAULT_BASE_URL = "http://localhost:3001";

function getBaseUrl() {
  return process.env.FLOWCASE_API_BASE_URL ?? DEFAULT_BASE_URL;
}

function appendList(searchParams: URLSearchParams, key: string, values?: string[]) {
  values?.filter(Boolean).forEach((value) => {
    searchParams.append(key, value);
  });
}

function buildSearchParams(filters: FlowcaseSearchFilters = {}) {
  const searchParams = new URLSearchParams();

  if (filters.city) searchParams.set("city", filters.city);
  if (filters.title) searchParams.set("title", filters.title);
  if (filters.name) searchParams.set("name", filters.name);
  if (typeof filters.minCategoryScore === "number") {
    searchParams.set("min_category_score", String(filters.minCategoryScore));
  }
  if (typeof filters.minKeywordScore === "number") {
    searchParams.set("min_keyword_score", String(filters.minKeywordScore));
  }
  if (typeof filters.limit === "number") searchParams.set("limit", String(filters.limit));
  if (typeof filters.offset === "number") searchParams.set("offset", String(filters.offset));

  appendList(searchParams, "office_ids[]", filters.officeIds);
  appendList(searchParams, "keyword", filters.keywords);
  appendList(searchParams, "category", filters.categories);

  return searchParams;
}

async function flowcaseFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${getBaseUrl()}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Flowcase mock request failed: ${response.status} ${response.statusText}`);
  }

  return (await response.json()) as T;
}

export async function getCountries() {
  return flowcaseFetch<FlowcaseCountry[]>("/api/v1/countries");
}

export async function getTechnologyCategories(filters?: { name?: string }) {
  const params = new URLSearchParams();
  if (filters?.name) params.set("name", filters.name);
  const query = params.toString();
  return flowcaseFetch<FlowcasePaginatedResponse<FlowcaseTechnologyCategory>>(
    `/api/v1/masterdata/technologies/category${query ? `?${query}` : ""}`,
  );
}

export async function getTechnologyTags(filters?: { name?: string; categorySlug?: string }) {
  const params = new URLSearchParams();
  if (filters?.name) params.set("name", filters.name);
  if (filters?.categorySlug) params.set("category_slug", filters.categorySlug);
  const query = params.toString();
  return flowcaseFetch<FlowcasePaginatedResponse<FlowcaseTechnologyTag>>(
    `/api/v1/masterdata/technologies/tags${query ? `?${query}` : ""}`,
  );
}

export async function searchUsers(filters: FlowcaseSearchFilters = {}) {
  const searchParams = buildSearchParams(filters);
  const query = searchParams.toString();
  return flowcaseFetch<FlowcaseUsersSearchResponse>(
    `/api/v2/users/search${query ? `?${query}` : ""}`,
  );
}

export async function getUser(userId: string) {
  return flowcaseFetch<FlowcaseUserSummary>(`/api/v1/users/${userId}`);
}

export async function getCv(userId: string, cvId: string) {
  return flowcaseFetch<FlowcaseCv>(`/api/v3/cvs/${userId}/${cvId}`);
}

export async function searchComparisons(
  comparison: "consultant" | "office",
  filters: FlowcaseSearchFilters = {},
) {
  const searchParams = buildSearchParams(filters);
  searchParams.set("comparison", comparison);
  return flowcaseFetch<FlowcaseCompareResponse>(`/api/v2/compare/search?${searchParams.toString()}`);
}

export function getTopKeywords(cv: FlowcaseCv, limit = 8) {
  return cv.technologies
    .flatMap((group) => group.technology_skills)
    .sort((left, right) => right.proficiency - left.proficiency)
    .slice(0, limit);
}

export function getStrongestCategory(cv: FlowcaseCv) {
  return [...cv.category_scores].sort((left, right) => right.score - left.score)[0] ?? null;
}
