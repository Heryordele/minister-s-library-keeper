import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, Loader2 } from "lucide-react";
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { PageHeader, EmptyState } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import {
  allProgressKey,
  categoryPagesRead,
  computeLibraryStats,
  fetchAllProgress,
  readingGrowth,
} from "@/lib/dashboard";
import {
  booksKey,
  categoriesKey,
  fetchBooks,
  fetchCategories,
} from "@/lib/books";
import { borrowRecordsKey, fetchBorrowRecords } from "@/lib/lending";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({
    meta: [
      { title: "Library Analytics — Minister's Vault" },
      {
        name: "description",
        content:
          "See your library at a glance: books owned, read, lent out, overdue, and reading growth.",
      },
      { property: "og:title", content: "Library Analytics — Minister's Vault" },
      {
        property: "og:description",
        content:
          "See your library at a glance: books owned, read, lent out, overdue, and reading growth.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AnalyticsPage,
});

const PIE_COLORS = [
  "hsl(var(--accent))",
  "hsl(var(--primary))",
  "hsl(var(--muted-foreground))",
  "hsl(var(--ring))",
  "hsl(var(--secondary-foreground))",
];

function AnalyticsPage() {
  const { data: books, isLoading } = useQuery({
    queryKey: booksKey,
    queryFn: fetchBooks,
  });
  const { data: categories } = useQuery({
    queryKey: categoriesKey,
    queryFn: fetchCategories,
  });
  const { data: records } = useQuery({
    queryKey: borrowRecordsKey,
    queryFn: fetchBorrowRecords,
  });
  const { data: progress } = useQuery({
    queryKey: allProgressKey,
    queryFn: fetchAllProgress,
  });

  const stats = computeLibraryStats(books ?? [], records ?? []);
  const categoryData = categoryPagesRead(
    books ?? [],
    progress ?? [],
    categories ?? [],
  ).slice(0, 5);
  const growth = readingGrowth(progress ?? []);
  const hasGrowth = growth.some((g) => g.pages > 0);

  return (
    <>
      <PageHeader
        title="Analytics"
        subtitle="Reading pace, categories, and your library at a glance."
      />

      <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 md:px-8">
        {isLoading ? (
          <div className="grid place-items-center py-16">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : stats.total === 0 ? (
          <EmptyState
            icon={<BarChart3 className="h-6 w-6" />}
            title="Insights will appear here"
            body="Once you start cataloging books and logging reading, you'll see trends and patterns."
          />
        ) : (
          <>
            <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <StatCard label="Total books owned" value={stats.total} />
              <StatCard label="Books read" value={stats.read} />
              <StatCard label="Currently reading" value={stats.reading} />
              <StatCard label="Unread" value={stats.unread} />
              <StatCard label="Lent out" value={stats.lentOut} />
              <StatCard label="Overdue" value={stats.overdue} />
              <StatCard label="Lost" value={stats.lost} />
            </section>

            <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold">
                Most-read categories
              </h2>
              {categoryData.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Log some reading progress to see which subjects you spend the
                  most time in.
                </p>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        dataKey="pages"
                        nameKey="name"
                        innerRadius="50%"
                        outerRadius="80%"
                        paddingAngle={2}
                      >
                        {categoryData.map((entry, i) => (
                          <Cell
                            key={entry.name}
                            fill={PIE_COLORS[i % PIE_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => [`${value} pages`, ""]}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </section>

            <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold">
                Reading growth — last 6 months
              </h2>
              {!hasGrowth ? (
                <p className="text-sm text-muted-foreground">
                  No pages logged yet in the last six months.
                </p>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={growth}>
                      <XAxis
                        dataKey="month"
                        tickLine={false}
                        axisLine={false}
                        fontSize={12}
                      />
                      <YAxis tickLine={false} axisLine={false} fontSize={12} />
                      <Tooltip
                        cursor={{ fill: "hsl(var(--muted))" }}
                        formatter={(value: number) => [`${value} pages`, ""]}
                      />
                      <Bar
                        dataKey="pages"
                        fill="hsl(var(--accent))"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </>
  );
}
