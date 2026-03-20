import Link from "next/link";
import { Button, Card, CardBlock, Tag } from "@digdir/designsystemet-react";

const highlights = [
  "Typed Flowcase mock client",
  "Oslo and Trondheim consultant data",
  "Keyword search and comparison payloads",
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.92),_rgba(226,232,240,0.86)_30%,_rgba(186,230,253,0.5)_100%)] text-slate-950">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-6 py-12 lg:px-10">
        <Card className="w-full rounded-[36px] border border-white/60 bg-white/82 shadow-[0_30px_80px_-36px_rgba(15,23,42,0.45)] backdrop-blur-sm">
          <CardBlock className="grid gap-10 p-8 lg:grid-cols-[1.25fr_0.75fr] lg:p-12">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-cyan-700">Flowcase mock dashboard</p>
              <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
                Preview the mock consultant dataset before you wire in charts.
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
                The project now includes a Bun-powered Flowcase-like API, a typed client, and a dedicated preview route
                where you can filter consultants by city, title, category, and keywords.
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                {highlights.map((highlight) => (
                  <Tag key={highlight} variant="outline">
                    {highlight}
                  </Tag>
                ))}
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild>
                  <Link href="/api-preview">Open preview</Link>
                </Button>
                <Button asChild variant="secondary">
                  <a href="http://localhost:3001/api/v2/users/search?keyword=react" target="_blank" rel="noreferrer">
                    Open mock API
                  </a>
                </Button>
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-slate-950 p-6 text-slate-50">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">Run locally</p>
              <div className="mt-5 space-y-4 text-sm leading-7 text-slate-300">
                <div>
                  <p className="font-medium text-white">1. Start the mock API</p>
                  <code className="mt-1 block rounded-2xl bg-white/8 px-4 py-3 text-sm text-cyan-100">
                    bun run mock:api
                  </code>
                </div>
                <div>
                  <p className="font-medium text-white">2. Start the app</p>
                  <code className="mt-1 block rounded-2xl bg-white/8 px-4 py-3 text-sm text-cyan-100">
                    bun run dev
                  </code>
                </div>
                <div>
                  <p className="font-medium text-white">3. Explore filters</p>
                  <code className="mt-1 block rounded-2xl bg-white/8 px-4 py-3 text-sm text-cyan-100">
                    /api-preview?city=Oslo&amp;keyword=react,wcag
                  </code>
                </div>
              </div>
            </div>
          </CardBlock>
        </Card>
      </section>
    </main>
  );
}
