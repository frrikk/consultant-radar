import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, "data");
const dbFile = join(__dirname, "db.json");

const sourceFiles = {
  countries: "countries.json",
  offices: "offices.json",
  consultantProfiles: "consultant-profiles.json",
  technologyCategories: "technology-categories.json",
  technologyTags: "technology-tags.json",
};

function readJson(fileName) {
  const filePath = join(dataDir, fileName);
  return JSON.parse(readFileSync(filePath, "utf8"));
}

export function loadDatabase() {
  const sources = Object.fromEntries(
    Object.entries(sourceFiles).map(([key, fileName]) => [key, readJson(fileName)]),
  );

  const users = buildUsers(sources.consultantProfiles);
  const cvs = buildCvs(
    sources.consultantProfiles,
    sources.technologyCategories,
    sources.technologyTags,
  );

  return {
    countries: sources.countries,
    offices: sources.offices,
    users,
    cvs,
    technologyCategories: sources.technologyCategories,
    technologyTags: sources.technologyTags,
  };
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function uniq(values) {
  return [...new Set(values)];
}

function buildUsers(consultantProfiles) {
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
    created_at: profile.created_at,
    updated_at: profile.updated_at,
    image: profile.image,
  }));
}

function buildCvs(consultantProfiles, technologyCategories, technologyTags) {
  const tagBySlug = new Map(technologyTags.map((tag) => [tag.slug, tag]));

  return consultantProfiles.map((profile, profileIndex) => {
    const categoryScores = technologyCategories.map((category) => ({
      category_id: category.id,
      category_slug: category.slug,
      label: category.values.no,
      score: profile.category_scores[category.slug],
    }));

    const technologies = technologyCategories.map((category, categoryIndex) => {
      const score = profile.category_scores[category.slug];
      const keywordSlugs = profile.keywords[category.slug] ?? [];

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
    const keywordSlugs = uniq(technologies.flatMap((technology) =>
      technology.technology_skills.map((skill) => skill.slug),
    ));

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

export function writeDatabaseFile() {
  const db = loadDatabase();
  writeFileSync(dbFile, `${JSON.stringify(db, null, 2)}\n`, "utf8");
  return db;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  writeDatabaseFile();
  process.stdout.write(`Wrote ${dbFile}\n`);
}
