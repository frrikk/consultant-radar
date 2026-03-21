import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/app/_components/ThemeToggle";
import { getButtonStyles } from "@/app/_lib/button-styles";
import { getT } from "@/lib/i18n";
import { getCv, getTechnologyCategories, searchUsers } from "@/lib/flowcase";
import { RadarWorkspace } from "./radar/_components/RadarWorkspace";
import {
  RADAR_STATISTIC,
  buildRadarFieldCatalog,
  buildConsultantOption,
  buildConsultantSearchIndex,
  firstValue,
  listValue,
  type RadarStatistic,
} from "./radar/_lib/radar";

type PageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function Home({ searchParams }: PageProps) {
  const t = getT();
  const resolvedSearchParams = await searchParams;
  const statisticValue = firstValue(resolvedSearchParams.stat, RADAR_STATISTIC);
  const statistic: RadarStatistic = statisticValue === RADAR_STATISTIC ? RADAR_STATISTIC : RADAR_STATISTIC;
  const explicitSelectedIds = listValue(resolvedSearchParams.selected);

  let usersResponse;
  let categoriesResponse;

  try {
    [usersResponse, categoriesResponse] = await Promise.all([
      searchUsers({ limit: 20 }),
      getTechnologyCategories(),
    ]);
  } catch {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <section className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center gap-5 px-6 text-center">
          <Badge className="border-border bg-muted text-foreground hover:bg-muted">{t("radar.page.badge")}</Badge>
          <h1 className="text-3xl font-semibold tracking-tight">{t("radar.page.apiUnavailableTitle")}</h1>
          <p className="max-w-xl text-muted-foreground">{t("radar.page.apiUnavailableDescription")}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <a href="/api/health" target="_blank" rel="noreferrer" className={getButtonStyles("default") + " no-underline"}>
              {t("radar.page.openApi")}
            </a>
            <code className="rounded-full border border-border bg-card px-4 py-2 text-sm">/api/health</code>
          </div>
        </section>
      </main>
    );
  }

  const consultants = usersResponse.users.filter((consultant) => buildConsultantSearchIndex(consultant).length > 0);

  if (consultants.length === 0) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <section className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center gap-6 px-6 text-center">
          <h1 className="text-3xl font-semibold tracking-tight">{t("radar.page.emptyTitle")}</h1>
          <p className="max-w-xl text-muted-foreground">{t("radar.page.emptyDescription")}</p>
          <a href="/api/health" target="_blank" rel="noreferrer" className={getButtonStyles("default") + " no-underline"}>
            {t("radar.page.openApi")}
          </a>
        </section>
      </main>
    );
  }

  const categories = categoriesResponse.data;

  const consultantOptions = consultants.map(buildConsultantOption);
  const effectiveSelectedIds = explicitSelectedIds.slice(0, 5);

  let allConsultantCvs;

  try {
    allConsultantCvs = await Promise.all(
      consultants.map((consultant) => getCv(consultant.user_id, consultant.default_cv_id)),
    );
  } catch {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <section className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center gap-5 px-6 text-center">
          <Badge className="border-border bg-muted text-foreground hover:bg-muted">{t("radar.page.badge")}</Badge>
          <h1 className="text-3xl font-semibold tracking-tight">{t("radar.page.apiUnavailableTitle")}</h1>
          <p className="max-w-xl text-muted-foreground">{t("radar.page.apiUnavailableDescription")}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <a href="/api/health" target="_blank" rel="noreferrer" className={getButtonStyles("default") + " no-underline"}>
              {t("radar.page.openApi")}
            </a>
            <code className="rounded-full border border-border bg-card px-4 py-2 text-sm">/api/health</code>
          </div>
        </section>
      </main>
    );
  }
  const cvsByUserId = Object.fromEntries(allConsultantCvs.map((entry) => [entry.user_id, entry]));
  const fieldCatalog = buildRadarFieldCatalog(categories, allConsultantCvs);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto flex w-full max-w-[1520px] flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
        <header className="flex items-center justify-between gap-4 rounded-[20px] border border-border bg-card px-4 py-3">
          <div className="flex items-center gap-2">
            <Badge className="border-border bg-muted text-foreground hover:bg-muted">{t("radar.page.badge")}</Badge>
            <h1 className="text-lg font-semibold tracking-tight">{t("radar.page.title")}</h1>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/api/v2/users/search?keyword=react"
              target="_blank"
              rel="noreferrer"
              className={getButtonStyles("secondary") + " no-underline"}
            >
              {t("radar.page.openApi")}
            </a>
            <ThemeToggle />
          </div>
        </header>

        <RadarWorkspace
          consultants={consultants}
          consultantOptions={consultantOptions}
          cvsByUserId={cvsByUserId}
          categories={categories}
          fieldCatalog={fieldCatalog}
          initialStatistic={statistic}
          initialSelectedIds={effectiveSelectedIds}
        />
      </section>
    </main>
  );
}
