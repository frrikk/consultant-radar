import { Button, Card, CardBlock, Checkbox, Fieldset, FieldsetDescription, FieldsetLegend, Tag } from "@digdir/designsystemet-react";
import Link from "next/link";
import type { FlowcaseUserSummary } from "@/lib/flowcase";
import type { ChartSeries, ConsultantSeries } from "../_lib/preview";

type SeriesToolsProps = {
  city: string;
  title: string;
  category: string;
  rawKeywords: string;
  comparison: string;
  retainedQuery: string;
  consultants: FlowcaseUserSummary[];
  effectiveSelectedIds: string[];
  selectedConsultants: FlowcaseUserSummary[];
  selectedSeries: ConsultantSeries[];
  officeSeries: ChartSeries[];
};

export function SeriesTools({
  city,
  title,
  category,
  rawKeywords,
  comparison,
  retainedQuery,
  consultants,
  effectiveSelectedIds,
  selectedConsultants,
  selectedSeries,
  officeSeries,
}: SeriesToolsProps) {
  return (
    <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <CardBlock className="p-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Series selection</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">Pick consultants for explicit comparison</h2>
            </div>
            <Tag data-color="accent">{selectedConsultants.length} selected</Tag>
          </div>

          <form action="/api-preview" method="get" className="mt-6 grid gap-4">
            {city ? <input type="hidden" name="city" value={city} /> : null}
            {title ? <input type="hidden" name="title" value={title} /> : null}
            {category ? <input type="hidden" name="category" value={category} /> : null}
            {rawKeywords ? <input type="hidden" name="keywords" value={rawKeywords} /> : null}
            <input type="hidden" name="comparison" value={comparison} />

            <Fieldset className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <FieldsetLegend className="text-sm font-semibold text-slate-800">Consultants in current result set</FieldsetLegend>
              <FieldsetDescription className="text-sm text-slate-600">
                Select exact people to generate chart-ready consultant series. If nothing is selected, the first three matches are used.
              </FieldsetDescription>
              <div className="mt-4 grid gap-3">
                {consultants.map((consultant) => (
                  <Checkbox
                    key={consultant.user_id}
                    name="selected"
                    value={consultant.user_id}
                    defaultChecked={effectiveSelectedIds.includes(consultant.user_id)}
                    label={`${consultant.name} - ${consultant.office_name}`}
                    description={consultant.professional_title}
                  />
                ))}
              </div>
            </Fieldset>

            <div className="flex flex-wrap gap-3">
              <Button type="submit">Update selected series</Button>
              <Button asChild variant="secondary">
                <Link href={`/api-preview?${retainedQuery}`}>Clear picks</Link>
              </Button>
            </div>
          </form>
        </CardBlock>
      </Card>

      <Card className="rounded-2xl border border-slate-200 bg-slate-950 text-slate-50 shadow-sm">
        <CardBlock className="p-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Chart-ready data</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">Series payload preview</h2>
            </div>
            <Tag variant="outline">JSON</Tag>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {selectedSeries.map((series) => (
              <Card key={series.consultantId} variant="tinted" className="rounded-2xl border border-white/10 bg-white/6 text-white">
                <CardBlock className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-base font-semibold">{series.label}</h3>
                    <Tag variant="outline">{series.office}</Tag>
                  </div>
                  <p className="mt-1 text-sm text-slate-300">{series.title}</p>
                </CardBlock>
              </Card>
            ))}
          </div>

          <pre className="mt-5 overflow-x-auto rounded-2xl border border-white/10 bg-black/20 p-4 text-xs leading-6 text-cyan-100">
            {JSON.stringify(
              {
                consultantSeries: selectedSeries,
                officeSeries,
              },
              null,
              2,
            )}
          </pre>
        </CardBlock>
      </Card>
    </section>
  );
}
