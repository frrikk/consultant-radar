import { Card, CardBlock, Tag } from "@digdir/designsystemet-react";
import { getStrongestCategory, type FlowcaseCv, type FlowcaseUserSummary } from "@/lib/flowcase";
import { formatKeyword, scoreTone } from "../_lib/preview";

type ConsultantCardProps = {
  consultant: FlowcaseUserSummary;
  cv: FlowcaseCv | null;
};

export function ConsultantCard({ consultant, cv }: ConsultantCardProps) {
  const strongest = cv ? getStrongestCategory(cv) : consultant.default_cv?.category_scores[0] ?? null;
  const keywords = consultant.default_cv?.keyword_slugs.slice(0, 8) ?? [];

  return (
    <Card className="h-full rounded-[28px] border border-white/55 bg-white/88 shadow-[0_18px_50px_-24px_rgba(15,23,42,0.35)] backdrop-blur-sm">
      <CardBlock className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              {consultant.office_name} - {consultant.title}
            </p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{consultant.name}</h3>
            <p className="mt-1 text-sm text-slate-600">{consultant.professional_title}</p>
          </div>
          <Tag data-color="accent">{consultant.experience_years} years</Tag>
        </div>

        {strongest ? (
          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50/90 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Strongest category</p>
            <div className="mt-2 flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-slate-900">{strongest.label}</p>
              <span className={`rounded-full px-3 py-1 text-sm font-semibold ring-1 ${scoreTone(strongest.score)}`}>
                {strongest.score}/5
              </span>
            </div>
          </div>
        ) : null}

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {(consultant.default_cv?.category_scores ?? []).map((score) => (
            <div key={score.category_slug} className="rounded-2xl border border-slate-200 bg-white p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-slate-700">{score.label}</p>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${scoreTone(score.score)}`}>
                  {score.score}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Keywords</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {keywords.map((keyword) => (
              <Tag key={keyword} variant="outline">
                {formatKeyword(keyword)}
              </Tag>
            ))}
          </div>
        </div>
      </CardBlock>
    </Card>
  );
}
