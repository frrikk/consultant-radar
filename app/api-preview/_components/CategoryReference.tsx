import { Card, CardBlock, Tag } from "@digdir/designsystemet-react";
import type { FlowcaseTechnologyCategory } from "@/lib/flowcase";

type CategoryReferenceProps = {
  categories: FlowcaseTechnologyCategory[];
};

export function CategoryReference({ categories }: CategoryReferenceProps) {
  return (
    <section className="rounded-[32px] border border-slate-900/10 bg-slate-950 px-6 py-7 text-slate-50 shadow-[0_25px_70px_-34px_rgba(15,23,42,0.6)]">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-200">Radar categories</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">Mock taxonomy for search and comparison</h2>
        </div>
        <p className="max-w-2xl text-sm leading-6 text-slate-300">
          Every consultant carries all categories plus keyword-level skills, so you can compare people, offices, or any
          future grouping you define in the UI.
        </p>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {categories.map((category) => (
          <Card key={category.slug} variant="tinted" className="rounded-3xl border border-white/10 bg-white/8 text-white">
            <CardBlock className="p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{category.slug}</p>
              <h3 className="mt-2 text-lg font-semibold text-white">{category.values.no}</h3>
              <p className="mt-1 text-sm text-slate-300">{category.values.int}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {category.aliases.map((alias) => (
                  <Tag key={alias} variant="outline">
                    {alias}
                  </Tag>
                ))}
              </div>
            </CardBlock>
          </Card>
        ))}
      </div>
    </section>
  );
}
