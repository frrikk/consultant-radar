import http from "node:http";
import { writeDatabaseFile } from "./build-db.mjs";

const port = Number.parseInt(process.env.MOCK_API_PORT ?? "3001", 10);

function sendJson(res, statusCode, body) {
  res.writeHead(statusCode, {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json; charset=utf-8",
  });
  res.end(JSON.stringify(body, null, 2));
}

function sendEmpty(res, statusCode) {
  res.writeHead(statusCode, {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end();
}

function paginate(items, searchParams) {
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

function buildCountryResponse(country, offices, users) {
  const countryOffices = offices
    .filter((office) => office.country_id === country._id)
    .map((office) => {
      const officeUsers = users.filter((user) => user.office_id === office._id);
      const activatedUsers = officeUsers.filter((user) => !user.deactivated);

      return {
        ...office,
        num_users: officeUsers.length,
        num_users_activated: activatedUsers.length,
        num_users_deactivated: officeUsers.length - activatedUsers.length,
      };
    });

  return {
    ...country,
    offices: countryOffices,
  };
}

function matchesValue(value, query) {
  return String(value ?? "").toLowerCase().includes(query.toLowerCase());
}

function toSearchable(values) {
  return values
    .flatMap((value) => {
      if (Array.isArray(value)) {
        return value;
      }

      return value == null ? [] : [value];
    })
    .map((value) => String(value).toLowerCase());
}

function cvMatchesKeywords(cv, technologyTags, searchParams) {
  const keywordQueries = [
    ...searchParams.getAll("keyword"),
    ...searchParams.getAll("keywords[]"),
    ...searchParams.getAll("keywords"),
  ]
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
      return toSearchable([
        skill.slug,
        skill.name.int,
        skill.name.no,
        tag?.aliases ?? [],
        tag?.category_slug,
      ]);
    }),
  );

  return keywordQueries.every((query) =>
    searchableKeywords.some((candidate) => candidate.includes(query)),
  );
}

function cvMatchesCategories(cv, technologyCategories, searchParams) {
  const categoryQueries = [
    ...searchParams.getAll("category"),
    ...searchParams.getAll("categories[]"),
    ...searchParams.getAll("categories"),
  ]
    .flatMap((value) => value.split(","))
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  if (categoryQueries.length === 0) {
    return true;
  }

  const searchableCategories = cv.category_scores.flatMap((score) => {
    const category = technologyCategories.find((item) => item.slug === score.category_slug);
    return toSearchable([
      score.category_slug,
      score.label,
      category?.values.int,
      category?.aliases ?? [],
    ]);
  });

  return categoryQueries.every((query) =>
    searchableCategories.some((candidate) => candidate.includes(query)),
  );
}

function cvMatchesMinimums(cv, searchParams) {
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

function filterUsers(users, searchParams, cvs, technologyTags, technologyCategories) {
  const officeIds = [
    ...searchParams.getAll("office_ids[]"),
    ...searchParams.getAll("office_ids"),
  ];
  const cityQueries = [
    ...searchParams.getAll("city"),
    ...searchParams.getAll("cities[]"),
    ...searchParams.getAll("cities"),
  ]
    .flatMap((value) => value.split(","))
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  const titleQueries = [
    ...searchParams.getAll("title"),
    ...searchParams.getAll("titles[]"),
    ...searchParams.getAll("titles"),
  ]
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

    if (
      cityQueries.length > 0 &&
      !cityQueries.some((query) => matchesValue(user.city ?? user.office_name, query))
    ) {
      return false;
    }

    if (
      titleQueries.length > 0 &&
      !titleQueries.some((query) => matchesValue(user.title, query))
    ) {
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

function buildUserSummary(user, cvs) {
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

function findUserByField(users, searchParams) {
  for (const [field, value] of searchParams.entries()) {
    if (value) {
      return users.find((user) => String(user[field] ?? "") === value) ?? null;
    }
  }

  return null;
}

function pickCvMetadata(cv) {
  return {
    _id: cv._id,
    user_id: cv.user_id,
    name: cv.name,
    title: cv.title,
    titles: cv.titles,
    email: cv.email,
    company_id: cv.company_id,
    updated_at: cv.updated_at,
    owner_updated_at: cv.owner_updated_at,
    country_code: cv.country_code,
    language_code: cv.language_code,
    language_codes: cv.language_codes,
    custom_tag_ids: cv.custom_tag_ids,
    category_scores: cv.category_scores,
    keyword_slugs: cv.keyword_slugs,
  };
}

function routeRequest(req, res) {
  if (!req.url) {
    sendJson(res, 400, { error: "Missing request URL" });
    return;
  }

  if (req.method === "OPTIONS") {
    sendEmpty(res, 204);
    return;
  }

  if (req.method !== "GET") {
    sendJson(res, 405, { error: "Method not allowed" });
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host ?? "localhost"}`);
  const db = writeDatabaseFile();
  const { countries, offices, users, cvs, technologyCategories, technologyTags } = db;
  const pathname = url.pathname;

  if (pathname === "/api/health") {
    sendJson(res, 200, { status: "ok" });
    return;
  }

  if (pathname === "/api/v1/countries") {
    const payload = countries.map((country) =>
      buildCountryResponse(country, offices, users),
    );
    sendJson(res, 200, payload);
    return;
  }

  const countryMatch = pathname.match(/^\/api\/v1\/countries\/([^/]+)$/);
  if (countryMatch) {
    const country = countries.find((item) => item._id === countryMatch[1]);

    if (!country) {
      sendJson(res, 404, { error: "Country not found" });
      return;
    }

    sendJson(res, 200, buildCountryResponse(country, offices, users));
    return;
  }

  const countryOfficesMatch = pathname.match(/^\/api\/v1\/countries\/([^/]+)\/offices$/);
  if (countryOfficesMatch) {
    const country = countries.find((item) => item._id === countryOfficesMatch[1]);

    if (!country) {
      sendJson(res, 404, { error: "Country not found" });
      return;
    }

    const payload = buildCountryResponse(country, offices, users).offices;
    sendJson(res, 200, payload);
    return;
  }

  const officeMatch = pathname.match(/^\/api\/v1\/countries\/([^/]+)\/offices\/([^/]+)$/);
  if (officeMatch) {
    const office = offices.find(
      (item) => item.country_id === officeMatch[1] && item._id === officeMatch[2],
    );

    if (!office) {
      sendJson(res, 404, { error: "Office not found" });
      return;
    }

    const officeUsers = users.filter((user) => user.office_id === office._id);
    const activatedUsers = officeUsers.filter((user) => !user.deactivated);

    sendJson(res, 200, {
      ...office,
      num_users: officeUsers.length,
      num_users_activated: activatedUsers.length,
      num_users_deactivated: officeUsers.length - activatedUsers.length,
    });
    return;
  }

  if (pathname === "/api/v1/users") {
    const filteredUsers = filterUsers(
      users,
      url.searchParams,
      cvs,
      technologyTags,
      technologyCategories,
    ).map((user) =>
      buildUserSummary(user, cvs),
    );
    sendJson(res, 200, filteredUsers);
    return;
  }

  if (pathname === "/api/v1/users/find") {
    const user = findUserByField(users, url.searchParams);

    if (!user) {
      sendJson(res, 404, { error: "User not found" });
      return;
    }

    sendJson(res, 200, buildUserSummary(user, cvs));
    return;
  }

  const userMatch = pathname.match(/^\/api\/v1\/users\/([^/]+)$/);
  if (userMatch) {
    const user = users.find((item) => item.id === userMatch[1] || item.user_id === userMatch[1]);

    if (!user) {
      sendJson(res, 404, { error: "User not found" });
      return;
    }

    sendJson(res, 200, buildUserSummary(user, cvs));
    return;
  }

  if (pathname === "/api/v2/users/search") {
    const filteredUsers = filterUsers(
      users,
      url.searchParams,
      cvs,
      technologyTags,
      technologyCategories,
    )
      .sort((left, right) => left.name.localeCompare(right.name))
      .map((user) => buildUserSummary(user, cvs));
    const { offset, limit, total, data } = paginate(filteredUsers, url.searchParams);

    sendJson(res, 200, {
      offset,
      limit,
      total,
      users: data,
    });
    return;
  }

  if (pathname === "/api/v2/compare/search") {
    const matchingUsers = filterUsers(
      users,
      url.searchParams,
      cvs,
      technologyTags,
      technologyCategories,
    );

    const comparisonType = url.searchParams.get("comparison") ?? "consultant";

    if (comparisonType === "office") {
      const grouped = Object.values(
        matchingUsers.reduce((accumulator, user) => {
          const key = user.office_id;
          const cv = cvs.find((item) => item._id === user.default_cv_id);
          if (!cv) {
            return accumulator;
          }

          accumulator[key] ??= {
            id: key,
            label: user.office_name,
            office_id: user.office_id,
            consultants: 0,
            category_totals: Object.fromEntries(
              technologyCategories.map((category) => [category.slug, 0]),
            ),
            keyword_counts: {},
          };

          accumulator[key].consultants += 1;

          cv.category_scores.forEach((score) => {
            accumulator[key].category_totals[score.category_slug] += score.score;
          });

          cv.keyword_slugs.forEach((slug) => {
            accumulator[key].keyword_counts[slug] =
              (accumulator[key].keyword_counts[slug] ?? 0) + 1;
          });

          return accumulator;
        }, {}),
      ).map((group) => ({
        id: group.id,
        label: group.label,
        consultants: group.consultants,
        category_scores: technologyCategories.map((category) => ({
          category_slug: category.slug,
          label: category.values.no,
          score: Number((group.category_totals[category.slug] / group.consultants).toFixed(2)),
        })),
        keyword_slugs: Object.entries(group.keyword_counts)
          .filter(([, count]) => count > 0)
          .sort((left, right) => right[1] - left[1])
          .map(([slug]) => slug),
      }));

      sendJson(res, 200, {
        comparison: "office",
        total: grouped.length,
        items: grouped,
      });
      return;
    }

    sendJson(res, 200, {
      comparison: "consultant",
      total: matchingUsers.length,
      items: matchingUsers.map((user) => buildUserSummary(user, cvs)),
    });
    return;
  }

  const cvMatch = pathname.match(/^\/api\/v3\/cvs\/([^/]+)\/([^/]+)$/);
  if (cvMatch) {
    const cv = cvs.find((item) => item.user_id === cvMatch[1] && item._id === cvMatch[2]);

    if (!cv) {
      sendJson(res, 404, { error: "CV not found" });
      return;
    }

    sendJson(res, 200, cv);
    return;
  }

  const cvMetadataMatch = pathname.match(/^\/api\/v3\/cvs\/([^/]+)\/([^/]+)\/metadata$/);
  if (cvMetadataMatch) {
    const cv = cvs.find(
      (item) => item.user_id === cvMetadataMatch[1] && item._id === cvMetadataMatch[2],
    );

    if (!cv) {
      sendJson(res, 404, { error: "CV not found" });
      return;
    }

    sendJson(res, 200, pickCvMetadata(cv));
    return;
  }

  const cvSectionMatch = pathname.match(/^\/api\/v3\/cvs\/([^/]+)\/([^/]+)\/([^/]+)$/);
  if (cvSectionMatch) {
    const cv = cvs.find(
      (item) => item.user_id === cvSectionMatch[1] && item._id === cvSectionMatch[2],
    );

    if (!cv) {
      sendJson(res, 404, { error: "CV not found" });
      return;
    }

    const sectionType = cvSectionMatch[3];

    if (sectionType === "technologies") {
      sendJson(res, 200, cv.technologies);
      return;
    }

    sendJson(res, 404, { error: "Section not found" });
    return;
  }

  if (pathname === "/api/v1/masterdata/technologies/category") {
    const nameQuery = url.searchParams.get("name")?.trim();
    const filteredCategories = technologyCategories.filter((category) => {
      if (!nameQuery) {
        return true;
      }

      return toSearchable([
        category.slug,
        category.values.int,
        category.values.no,
        category.aliases ?? [],
      ]).some((candidate) => candidate.includes(nameQuery.toLowerCase()));
    });

    sendJson(res, 200, paginate(filteredCategories, url.searchParams));
    return;
  }

  if (pathname === "/api/v1/masterdata/technologies/tags") {
    const categoryId = url.searchParams.get("category_id");
    const nameQuery = url.searchParams.get("name")?.trim();

    const filteredTags = technologyTags.filter((tag) => {
      if (categoryId && tag.category_id !== categoryId) {
        return false;
      }

      if (nameQuery) {
        const matches = toSearchable([
          tag.slug,
          tag.values.int,
          tag.values.no,
          tag.aliases ?? [],
          tag.category_slug,
        ]).some((candidate) => candidate.includes(nameQuery.toLowerCase()));

        if (!matches) {
          return false;
        }
      }

      const keywordCategory = url.searchParams.get("category_slug")?.trim();
      if (keywordCategory && tag.category_slug !== keywordCategory) {
        return false;
      }

      return true;
    });

    sendJson(res, 200, paginate(filteredTags, url.searchParams));
    return;
  }

  if (pathname === "/_json") {
    sendJson(res, 200, { resources: Object.keys(db) });
    return;
  }

  const rawCollectionMatch = pathname.match(/^\/_json\/([^/]+)$/);
  if (rawCollectionMatch) {
    const collection = db[rawCollectionMatch[1]];

    if (!collection) {
      sendJson(res, 404, { error: "Resource not found" });
      return;
    }

    sendJson(res, 200, collection);
    return;
  }

  const rawItemMatch = pathname.match(/^\/_json\/([^/]+)\/([^/]+)$/);
  if (rawItemMatch) {
    const collection = db[rawItemMatch[1]];

    if (!Array.isArray(collection)) {
      sendJson(res, 404, { error: "Resource not found" });
      return;
    }

    const item = collection.find(
      (entry) => entry.id === rawItemMatch[2] || entry._id === rawItemMatch[2],
    );

    if (!item) {
      sendJson(res, 404, { error: "Resource item not found" });
      return;
    }

    sendJson(res, 200, item);
    return;
  }

  sendJson(res, 404, {
    error: "Endpoint not found",
    available_endpoints: [
      "/api/v1/countries",
      "/api/v1/users",
      "/api/v2/users/search",
      "/api/v2/compare/search",
      "/api/v3/cvs/:userId/:cvId",
      "/api/v1/masterdata/technologies/category",
      "/api/v1/masterdata/technologies/tags",
      "/_json",
    ],
  });
}

const server = http.createServer(routeRequest);

server.listen(port, () => {
  writeDatabaseFile();
  process.stdout.write(`Flowcase mock API listening on http://localhost:${port}\n`);
});
