import consultantProfilesData from "@/mock-api/data/consultant-profiles.json";
import countriesData from "@/mock-api/data/countries.json";
import officesData from "@/mock-api/data/offices.json";
import technologyCategoriesData from "@/mock-api/data/technology-categories.json";
import technologyTagsData from "@/mock-api/data/technology-tags.json";
import type {
  FlowcaseCv,
  FlowcasePaginatedResponse,
  FlowcaseTechnologyCategory,
  FlowcaseTechnologyTag,
  FlowcaseUsersSearchResponse,
} from "@/lib/flowcase";

type ConsultantProfile = (typeof consultantProfilesData)[number];

type MockUser = Omit<FlowcaseUsersSearchResponse["users"][number], "default_cv">;

type MockDatabase = {
  countries: typeof countriesData;
  offices: typeof officesData;
  users: MockUser[];
  cvs: FlowcaseCv[];
  technologyCategories: FlowcaseTechnologyCategory[];
  technologyTags: FlowcaseTechnologyTag[];
};

let cachedDatabase: MockDatabase | null = null;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function uniq<T>(values: T[]) {
  return [...new Set(values)];
}

function paginate<T>(items: T[], searchParams: URLSearchParams): FlowcasePaginatedResponse<T> {
  const offset = Number.parseInt(searchParams.get("offset") ?? "0", 10);
  const limit = Number.parseInt(searchParams.get("limit") ?? `${items.length || 20}`, 10);
  const safeOffset = Number.isNaN(offset) ? 0 : Math.max(0, offset);
  const safeLimit = Number.isNaN(limit) ? items.length || 20 : Math.max(1, limit);

  return {
    offset: safeOffset,
    limit: safeLimit,
    total: items.length,
    data: items.slice(safeOffset, safeOffset + safeLimit),
  };
}

function toSearchable(values: Array<string | string[] | undefined | null>) {
  return values
    .flatMap((value) => {
      if (Array.isArray(value)) {
        return value;
      }

      return value == null ? [] : [value];
    })
    .map((value) => String(value).toLowerCase());
}

function matchesValue(value: string | undefined, query: string) {
  return String(value ?? "").toLowerCase().includes(query.toLowerCase());
}

function buildUsers(consultantProfiles: ConsultantProfile[]): MockUser[] {
  return consultantProfiles.map((profile) => ({
    id: profile.id,
    user_id: profile.id,
    external_unique_id: profile.external_unique_id,
    name: profile.name,
    email: profile.email,
    telephone: profile.telephone,
    role: "consultant",
    extra_roles: profile.extra_roles,
    default_cv_id: profile.default_cv_id,
    office_id: profile.office_id,
    office_name: profile.office_name,
    city: profile.office_name,
    department: profile.department,
    country_id: profile.country_id,
    country_code: profile.country_code,
    language_code: profile.language_code,
    title: profile.title,
    professional_title: profile.professional_title,
    professional_title_no: profile.professional_title_no,
    role_tags: profile.role_tags ?? [],
    seniority: profile.seniority,
    experience_years: profile.experience_years,
    deactivated: false,
    in_project: profile.in_project,
    current_project: profile.current_project,
    created_at: profile.created_at,
    updated_at: profile.updated_at,
    image: profile.image,
  }));
}

function buildCvs(
  consultantProfiles: ConsultantProfile[],
  technologyCategories: FlowcaseTechnologyCategory[],
  technologyTags: FlowcaseTechnologyTag[],
): FlowcaseCv[] {
  const tagBySlug = new Map(technologyTags.map((tag) => [tag.slug, tag]));

  return consultantProfiles.map((profile, profileIndex) => {
    const categoryScores = technologyCategories.map((category) => ({
      category_id: category.id,
      category_slug: category.slug,
      label: category.values.no,
      score: profile.category_scores[category.slug as keyof typeof profile.category_scores],
    }));

    const technologies = technologyCategories.map((category, categoryIndex) => {
      const score = profile.category_scores[category.slug as keyof typeof profile.category_scores];
      const keywordSlugs = profile.keywords[category.slug as keyof typeof profile.keywords] ?? [];

      return {
        _id: `tech-${profileIndex + 1}-${categoryIndex + 1}`,
        category: {
          id: category.id,
          slug: category.slug,
          values: category.values,
        },
        technology_skills: keywordSlugs.map((tagSlug, tagIndex) => {
          const tag = tagBySlug.get(tagSlug);

          if (!tag) {
            throw new Error(`Unknown technology tag slug: ${tagSlug}`);
          }

          const proficiency = clamp(score - Math.floor(tagIndex / 2), 1, 5);
          const duration = clamp(
            Math.round(profile.experience_years * ((proficiency + 1) / 6) - tagIndex * 0.4),
            1,
            profile.experience_years,
          );

          return {
            _id: `skill-${profileIndex + 1}-${categoryIndex + 1}-${tagIndex + 1}`,
            technology_id: tag.id,
            slug: tag.slug,
            name: tag.values,
            proficiency,
            total_duration_in_years: duration,
            base_duration_in_years: duration,
            offset_duration_in_years: 0,
            tags: [category.slug],
            order: tagIndex + 1,
            version: 1,
          };
        }),
      };
    });

    const languageCodes = uniq([profile.language_code, "int", "no"]);
    const keywordSlugs = uniq(technologies.flatMap((technology) => technology.technology_skills.map((skill) => skill.slug)));

    return {
      _id: profile.default_cv_id,
      id: profile.default_cv_id,
      user_id: profile.id,
      name: profile.name,
      title: profile.professional_title,
      titles: {
        int: profile.professional_title,
        no: profile.professional_title_no,
      },
      email: profile.email,
      company_id: "flowcase-demo-company",
      updated_at: profile.updated_at,
      owner_updated_at: profile.updated_at,
      country_code: profile.country_code,
      language_code: profile.language_code,
      language_codes: languageCodes,
      custom_tag_ids: [],
      radar_profile: profile.category_scores,
      category_scores: categoryScores,
      keyword_slugs: keywordSlugs,
      technologies,
    };
  });
}

function buildUserSummary(user: MockUser, cvs: FlowcaseCv[]) {
  const defaultCv = cvs.find((cv) => cv._id === user.default_cv_id);

  return {
    ...user,
    default_cv: defaultCv
      ? {
          _id: defaultCv._id,
          name: defaultCv.name,
          title: defaultCv.title,
          updated_at: defaultCv.updated_at,
          category_scores: defaultCv.category_scores,
          keyword_slugs: defaultCv.keyword_slugs,
        }
      : null,
  };
}

function cvMatchesKeywords(cv: FlowcaseCv, technologyTags: FlowcaseTechnologyTag[], searchParams: URLSearchParams) {
  const keywordQueries = [...searchParams.getAll("keyword"), ...searchParams.getAll("keywords[]"), ...searchParams.getAll("keywords")]
    .flatMap((value) => value.split(","))
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  if (keywordQueries.length === 0) {
    return true;
  }

  const tagsBySlug = new Map(technologyTags.map((tag) => [tag.slug, tag]));
  const searchableKeywords = cv.technologies.flatMap((technology) =>
    technology.technology_skills.flatMap((skill) => {
      const tag = tagsBySlug.get(skill.slug);
      return toSearchable([skill.slug, skill.name.int, skill.name.no, tag?.aliases, tag?.category_slug]);
    }),
  );

  return keywordQueries.every((query) => searchableKeywords.some((candidate) => candidate.includes(query)));
}

function cvMatchesCategories(
  cv: FlowcaseCv,
  technologyCategories: FlowcaseTechnologyCategory[],
  searchParams: URLSearchParams,
) {
  const categoryQueries = [...searchParams.getAll("category"), ...searchParams.getAll("categories[]"), ...searchParams.getAll("categories")]
    .flatMap((value) => value.split(","))
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  if (categoryQueries.length === 0) {
    return true;
  }

  const searchableCategories = cv.category_scores.flatMap((score) => {
    const category = technologyCategories.find((item) => item.slug === score.category_slug);
    return toSearchable([score.category_slug, score.label, category?.values.int, category?.aliases]);
  });

  return categoryQueries.every((query) => searchableCategories.some((candidate) => candidate.includes(query)));
}

function cvMatchesMinimums(cv: FlowcaseCv, searchParams: URLSearchParams) {
  const minCategoryScore = Number.parseInt(searchParams.get("min_category_score") ?? "0", 10);
  const minKeywordScore = Number.parseInt(searchParams.get("min_keyword_score") ?? "0", 10);

  if (!Number.isNaN(minCategoryScore) && minCategoryScore > 0) {
    const hasCategoryMatch = cv.category_scores.some((score) => score.score >= minCategoryScore);
    if (!hasCategoryMatch) {
      return false;
    }
  }

  if (!Number.isNaN(minKeywordScore) && minKeywordScore > 0) {
    const hasKeywordMatch = cv.technologies.some((technology) =>
      technology.technology_skills.some((skill) => skill.proficiency >= minKeywordScore),
    );
    if (!hasKeywordMatch) {
      return false;
    }
  }

  return true;
}

function filterUsers(users: MockUser[], searchParams: URLSearchParams, cvs: FlowcaseCv[], technologyTags: FlowcaseTechnologyTag[], technologyCategories: FlowcaseTechnologyCategory[]) {
  const officeIds = [...searchParams.getAll("office_ids[]"), ...searchParams.getAll("office_ids")];
  const cityQueries = [...searchParams.getAll("city"), ...searchParams.getAll("cities[]"), ...searchParams.getAll("cities")]
    .flatMap((value) => value.split(","))
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  const titleQueries = [...searchParams.getAll("title"), ...searchParams.getAll("titles[]"), ...searchParams.getAll("titles")]
    .flatMap((value) => value.split(","))
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  const includeDeactivated = searchParams.get("include_deactivated") === "true";
  const deactivatedFilter = searchParams.get("deactivated");
  const nameQuery = searchParams.get("name")?.trim();
  const roleQuery = searchParams.get("role")?.trim();

  return users.filter((user) => {
    if (officeIds.length > 0 && !officeIds.includes(user.office_id)) {
      return false;
    }

    if (cityQueries.length > 0 && !cityQueries.some((query) => matchesValue(user.city ?? user.office_name, query))) {
      return false;
    }

    if (titleQueries.length > 0 && !titleQueries.some((query) => matchesValue(user.title, query))) {
      return false;
    }

    if (!includeDeactivated && user.deactivated) {
      return false;
    }

    if (deactivatedFilter === "true" && !user.deactivated) {
      return false;
    }

    if (deactivatedFilter === "false" && user.deactivated) {
      return false;
    }

    if (nameQuery && !matchesValue(user.name, nameQuery) && !matchesValue(user.email, nameQuery)) {
      return false;
    }

    if (roleQuery && user.role !== roleQuery) {
      return false;
    }

    const cv = cvs.find((item) => item._id === user.default_cv_id);
    if (!cv) {
      return false;
    }

    if (!cvMatchesKeywords(cv, technologyTags, searchParams)) {
      return false;
    }

    if (!cvMatchesCategories(cv, technologyCategories, searchParams)) {
      return false;
    }

    if (!cvMatchesMinimums(cv, searchParams)) {
      return false;
    }

    return true;
  });
}

export function getMockDatabase() {
  if (cachedDatabase) {
    return cachedDatabase;
  }

  cachedDatabase = {
    countries: countriesData,
    offices: officesData,
    users: buildUsers(consultantProfilesData),
    cvs: buildCvs(consultantProfilesData, technologyCategoriesData, technologyTagsData),
    technologyCategories: technologyCategoriesData,
    technologyTags: technologyTagsData,
  };

  return cachedDatabase;
}

export function getMockTechnologyCategories(searchParams: URLSearchParams) {
  const { technologyCategories } = getMockDatabase();
  const nameQuery = searchParams.get("name")?.trim().toLowerCase();
  const filteredCategories = technologyCategories.filter((category) => {
    if (!nameQuery) {
      return true;
    }

    return toSearchable([category.slug, category.values.int, category.values.no, category.aliases]).some((candidate) =>
      candidate.includes(nameQuery),
    );
  });

  return paginate(filteredCategories, searchParams);
}

export function getMockUsersSearch(searchParams: URLSearchParams): FlowcaseUsersSearchResponse {
  const { users, cvs, technologyCategories, technologyTags } = getMockDatabase();
  const filteredUsers = filterUsers(users, searchParams, cvs, technologyTags, technologyCategories)
    .sort((left, right) => left.name.localeCompare(right.name))
    .map((user) => buildUserSummary(user, cvs));
  const { offset, limit, total, data } = paginate(filteredUsers, searchParams);

  return {
    offset,
    limit,
    total,
    users: data,
  };
}

export function getMockCvByUserId(userId: string, cvId: string) {
  const { cvs } = getMockDatabase();
  return cvs.find((cv) => cv.user_id === userId && cv._id === cvId) ?? null;
}
