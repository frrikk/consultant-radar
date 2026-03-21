import { Badge } from "@/components/ui/badge";
import { SettingsMenu } from "@/app/_components/SettingsMenu";
import { getButtonStyles } from "@/app/_lib/button-styles";
import { getT, isAppLocale, defaultLocale, type AppLocale } from "@/lib/i18n";
import { getCv, getTechnologyCategories, searchUsers } from "@/lib/flowcase";
import { RadarWorkspace } from "../radar/_components/RadarWorkspace";
import {
  buildConsultantOption,
  buildConsultantSearchIndex,
  parseRadarUrlState,
  serializeIncomingSearchParams,
  type RadarStatistic,
} from "../radar/_lib/radar";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

function resolveRouteLocale(lang: string): AppLocale {
  return isAppLocale(lang) ? lang : defaultLocale;
}

export default async function Home({ params, searchParams }: PageProps) {
  const [{ lang }, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const locale = resolveRouteLocale(lang);
  const t = getT(locale);
  const statistic: RadarStatistic = "category-score";

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
  const consultantOptions = consultants.map((consultant) => buildConsultantOption(consultant, locale));
  const initialSearch = serializeIncomingSearchParams(resolvedSearchParams);
  const initialUrlState = parseRadarUrlState(resolvedSearchParams, consultantOptions);

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

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto grid min-h-screen w-full max-w-[1760px] grid-rows-[auto_minmax(0,1fr)] gap-2 px-3 py-2 sm:px-4 lg:h-dvh lg:min-h-0 lg:overflow-hidden lg:px-4 lg:py-2.5">
        <header className="shrink-0 flex items-center justify-between gap-2 rounded-[16px] border border-border bg-card px-3 py-1.5">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-semibold tracking-tight">{t("radar.page.title")}</h1>
          </div>

          <div className="flex items-center gap-2">
            <SettingsMenu locale={locale} />
          </div>
        </header>

        <div className="min-h-0 lg:overflow-hidden">
          <RadarWorkspace
            consultants={consultants}
            consultantOptions={consultantOptions}
            cvsByUserId={cvsByUserId}
            categories={categories}
            initialStatistic={statistic}
            initialSearch={initialSearch}
            initialUrlState={initialUrlState}
            locale={locale}
          />
        </div>
      </section>
    </main>
  );
}
