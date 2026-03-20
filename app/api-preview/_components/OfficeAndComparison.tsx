import { Card, CardBlock, Tag } from "@digdir/designsystemet-react";
import type { FlowcaseCompareResponse, FlowcaseOffice, FlowcaseUserSummary } from "@/lib/flowcase";
import { formatKeyword, scoreTone } from "../_lib/preview";

type OfficeAndComparisonProps = {
  offices: FlowcaseOffice[];
  comparisonItems: FlowcaseUserSummary[];
  comparisonResponse: FlowcaseCompareResponse;
};

export function OfficeAndComparison({ offices, comparisonItems, comparisonResponse }: OfficeAndComparisonProps) {
  return (
    <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
      <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <CardBlock className="p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Offices</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">Where the mock consultants sit</h2>
          <div className="mt-6 grid gap-4">
            {offices.map((office) => (
              <Card key={office.id} className="rounded-2xl border border-slate-200 bg-slate-50">
                <CardBlock className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-semibold text-slate-950">{office.name}</h3>
                      <p className="mt-1 text-sm text-slate-600">Norway office with mock consultant distribution.</p>
                    </div>
                    <Tag data-color="accent">{office.num_users} consultants</Tag>
                  </div>
                  <div className="mt-5 grid grid-cols-3 gap-3 text-sm">
                    <div className="rounded-2xl border border-slate-200 bg-white p-3">
                      <p className="text-slate-500">Active</p>
                      <p className="mt-1 text-lg font-semibold text-slate-950">{office.num_users_activated}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-3">
                      <p className="text-slate-500">Inactive</p>
                      <p className="mt-1 text-lg font-semibold text-slate-950">{office.num_users_deactivated}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-3">
                      <p className="text-slate-500">Language</p>
                      <p className="mt-1 text-lg font-semibold text-slate-950">{office.override_language_code.toUpperCase()}</p>
                    </div>
                  </div>
                </CardBlock>
              </Card>
            ))}
          </div>
        </CardBlock>
      </Card>

      <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <CardBlock className="p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Comparison payload</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">Current comparison response</h2>
          <div className="mt-6 grid gap-4">
            {comparisonItems.length > 0
              ? comparisonItems.map((consultant) => (
                  <Card key={consultant.user_id} className="rounded-2xl border border-slate-200 bg-slate-50">
                    <CardBlock className="p-5">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <h3 className="text-lg font-semibold text-slate-950">{consultant.name}</h3>
                          <p className="text-sm text-slate-600">
                            {consultant.office_name} - {consultant.title}
                          </p>
                        </div>
                        <Tag data-color="accent">consultant</Tag>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {(consultant.default_cv?.keyword_slugs ?? []).slice(0, 7).map((keyword) => (
                          <Tag key={keyword} variant="outline">
                            {formatKeyword(keyword)}
                          </Tag>
                        ))}
                      </div>
                    </CardBlock>
                  </Card>
                ))
              : comparisonResponse.items.map((item, index) => {
                  const officeItem = item as {
                    id: string;
                    label: string;
                    consultants: number;
                    category_scores: Array<{ category_slug: string; label: string; score: number }>;
                  };

                  return (
                    <Card key={`${officeItem.id}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50">
                      <CardBlock className="p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="text-lg font-semibold text-slate-950">{officeItem.label}</h3>
                            <p className="text-sm text-slate-600">
                              {officeItem.consultants} consultants in this filtered comparison set
                            </p>
                          </div>
                          <Tag data-color="info">office</Tag>
                        </div>
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          {officeItem.category_scores.map((score) => (
                            <div key={score.category_slug} className="rounded-2xl border border-slate-200 bg-white p-3">
                              <div className="flex items-center justify-between gap-3">
                                <span className="text-sm text-slate-700">{score.label}</span>
                                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${scoreTone(score.score)}`}>
                                  {score.score}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardBlock>
                    </Card>
                  );
                })}
          </div>
        </CardBlock>
      </Card>
    </section>
  );
}
