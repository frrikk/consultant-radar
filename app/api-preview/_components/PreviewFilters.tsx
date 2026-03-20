import {
  Button,
  Card,
  CardBlock,
  Fieldset,
  FieldsetDescription,
  FieldsetLegend,
  Radio,
  Search,
  SearchClear,
  SearchInput,
  Select,
  Tag,
} from "@digdir/designsystemet-react";
import Link from "next/link";
import type { FlowcaseOffice, FlowcaseTechnologyCategory } from "@/lib/flowcase";

type PreviewFiltersProps = {
  city: string;
  title: string;
  category: string;
  comparison: string;
  rawKeywords: string;
  keywords: string[];
  countriesCount: number;
  offices: FlowcaseOffice[];
  categories: FlowcaseTechnologyCategory[];
  consultantsCount: number;
};

export function PreviewFilters({
  city,
  title,
  category,
  comparison,
  rawKeywords,
  keywords,
  countriesCount,
  offices,
  categories,
  consultantsCount,
}: PreviewFiltersProps) {
  return (
    <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <CardBlock className="p-6 lg:p-8">
        <div className="flex flex-col gap-8 lg:grid lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-600">Designsystemet filters</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">Tune the dataset before you build charts</h2>
            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-700">
              This page uses the typed Flowcase client and Designsystemet React components so you can test search,
              category filtering, and comparison output with realistic mock data.
            </p>
          </div>

          <form action="/api-preview" method="get" className="grid gap-5 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-800" htmlFor="city-select">
                  City
                </label>
                <Select id="city-select" name="city" defaultValue={city}>
                  <option value="">All cities</option>
                  {offices.map((office) => (
                    <option key={office.id} value={office.city}>
                      {office.city}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-800" htmlFor="title-select">
                  Title
                </label>
                <Select id="title-select" name="title" defaultValue={title}>
                  <option value="">All titles</option>
                  <option value="Consultant">Consultant</option>
                  <option value="Senior Consultant">Senior Consultant</option>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
              <div className="grid gap-2">
                <span className="text-sm font-medium text-slate-800">Keywords</span>
                <Search>
                  <SearchInput
                    aria-label="Keywords"
                    name="keywords"
                    defaultValue={rawKeywords}
                    placeholder="react, wcag, sanity"
                  />
                  <SearchClear />
                </Search>
                <p className="text-sm text-slate-600">Comma-separated keywords matching slugs, labels, and aliases.</p>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-800" htmlFor="category-select">
                  Category
                </label>
                <Select id="category-select" name="category" defaultValue={category}>
                  <option value="">All categories</option>
                  {categories.map((item) => (
                    <option key={item.slug} value={item.slug}>
                      {item.values.no}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <Fieldset className="rounded-2xl border border-slate-200 bg-white p-4">
              <FieldsetLegend className="text-sm font-semibold text-slate-800">Comparison mode</FieldsetLegend>
              <FieldsetDescription className="text-sm text-slate-600">
                Switch between grouped office payloads and direct consultant payloads.
              </FieldsetDescription>
              <div className="grid gap-3 md:grid-cols-2">
                <Radio
                  name="comparison"
                  value="office"
                  label="Office"
                  defaultChecked={comparison !== "consultant"}
                  description="Average category scores for matching consultants grouped by office."
                />
                <Radio
                  name="comparison"
                  value="consultant"
                  label="Consultant"
                  defaultChecked={comparison === "consultant"}
                  description="Return matching individual consultant profiles for direct comparison."
                />
              </div>
            </Fieldset>

            <div className="flex flex-wrap gap-3">
              <Button type="submit">Apply filters</Button>
              <Button asChild variant="secondary">
                <Link href="/api-preview">Reset</Link>
              </Button>
            </div>
          </form>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <Tag data-color="accent">{countriesCount} country</Tag>
          <Tag data-color="info">{offices.length} offices</Tag>
          <Tag data-color="warning">{consultantsCount} consultants</Tag>
          {(keywords.length > 0 ? keywords : ["react", "wcag"]).map((keyword) => (
            <Tag key={keyword} variant="outline">
              {keyword}
            </Tag>
          ))}
        </div>
      </CardBlock>
    </Card>
  );
}
