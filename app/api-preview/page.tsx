import { Button } from "@digdir/designsystemet-react";
import Link from "next/link";
import { getCountries, getCv, getTechnologyCategories, searchComparisons, searchUsers } from "@/lib/flowcase";
import { CategoryReference } from "./_components/CategoryReference";
import { ConsultantCard } from "./_components/ConsultantCard";
import { OfficeAndComparison } from "./_components/OfficeAndComparison";
import { PreviewFilters } from "./_components/PreviewFilters";
import { SeriesTools } from "./_components/SeriesTools";
import {
  asConsultants,
  buildConsultantSeries,
  buildOfficeSeries,
  buildRetainedQuery,
  firstValue,
  listValue,
  type SearchParamsRecord,
} from "./_lib/preview";

type PageProps = {
  searchParams: Promise<SearchParamsRecord>;
};

export default async function ApiPreviewPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;

  const city = firstValue(resolvedSearchParams.city);
  const title = firstValue(resolvedSearchParams.title);
  const category = firstValue(resolvedSearchParams.category);
  const comparison = firstValue(resolvedSearchParams.comparison, "office");
  const rawKeywords = firstValue(resolvedSearchParams.keywords ?? resolvedSearchParams.keyword);
  const keywords = listValue(rawKeywords);
  const selectedConsultantIds = listValue(resolvedSearchParams.selected);

  const [countries, categoriesResponse, usersResponse, comparisonResponse] = await Promise.all([
    getCountries(),
    getTechnologyCategories(),
    searchUsers({
      city: city || undefined,
      title: title || undefined,
      categories: category ? [category] : undefined,
      keywords: keywords.length > 0 ? keywords : ["react", "wcag"],
      limit: 8,
    }),
    searchComparisons(comparison === "consultant" ? "consultant" : "office", {
      city: city || undefined,
      title: title || undefined,
      categories: category ? [category] : undefined,
      keywords: keywords.length > 0 ? keywords : ["sanity"],
    }),
  ]);

  const consultants = usersResponse.users;
  const selectedCvs = await Promise.all(
    consultants.map((consultant) => getCv(consultant.user_id, consultant.default_cv_id)),
  );

  const cvByUserId = new Map(selectedCvs.map((cv) => [cv.user_id, cv]));
  const offices = countries.flatMap((country) => country.offices);
  const categories = categoriesResponse.data;
  const comparisonItems = asConsultants(comparisonResponse.items);
  const effectiveSelectedIds =
    selectedConsultantIds.length > 0
      ? selectedConsultantIds
      : consultants.slice(0, 3).map((consultant) => consultant.user_id);
  const selectedConsultants = consultants.filter((consultant) =>
    effectiveSelectedIds.includes(consultant.user_id),
  );
  const selectedSeries = buildConsultantSeries(selectedConsultants, cvByUserId);
  const officeSeries = comparisonItems.length === 0 ? buildOfficeSeries(comparisonResponse.items) : [];
  const retainedQuery = buildRetainedQuery({ city, title, category, rawKeywords, comparison });

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.92),_rgba(226,232,240,0.88)_30%,_rgba(186,230,253,0.5)_100%)] text-slate-950">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-10 lg:px-10 lg:py-14">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-700">Mock preview route</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">Interactive consultant preview</h1>
          </div>
          <Button asChild variant="secondary">
            <Link href="/">Back to overview</Link>
          </Button>
        </div>

        <PreviewFilters
          city={city}
          title={title}
          category={category}
          comparison={comparison}
          rawKeywords={rawKeywords}
          keywords={keywords}
          countriesCount={countries.length}
          offices={offices}
          categories={categories}
          consultantsCount={consultants.length}
        />

        <OfficeAndComparison
          offices={offices}
          comparisonItems={comparisonItems}
          comparisonResponse={comparisonResponse}
        />

        <section>
          <div className="flex items-end justify-between gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Consultant cards</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight">Filtered people ready for chart experiments</h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-slate-600">
              These cards show the same payload your chart layer can consume later: office metadata, category scores, and
              keyword-level skill tags.
            </p>
          </div>
          <div className="mt-6 grid gap-5 xl:grid-cols-2">
            {consultants.map((consultant) => (
              <ConsultantCard
                key={consultant.user_id}
                consultant={consultant}
                cv={cvByUserId.get(consultant.user_id) ?? null}
              />
            ))}
          </div>
        </section>

        <SeriesTools
          city={city}
          title={title}
          category={category}
          rawKeywords={rawKeywords}
          comparison={comparison}
          retainedQuery={retainedQuery}
          consultants={consultants}
          effectiveSelectedIds={effectiveSelectedIds}
          selectedConsultants={selectedConsultants}
          selectedSeries={selectedSeries}
          officeSeries={officeSeries}
        />

        <CategoryReference categories={categories} />
      </section>
    </main>
  );
}
