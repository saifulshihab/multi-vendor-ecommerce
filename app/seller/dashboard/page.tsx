"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DollarSign, Package, ShoppingBag, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchSellerDashboard } from "@/lib/queries";
import { formatMoney } from "@/lib/format";

const RANGES = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
] as const;

export default function SellerDashboardPage() {
  const [range, setRange] = useState<"7d" | "30d" | "90d">("7d");
  const { data, isLoading } = useQuery({
    queryKey: ["seller-dashboard", range],
    queryFn: () => fetchSellerDashboard(range),
  });

  const maxRevenue = Math.max(
    1,
    ...(data?.revenueChart.map((d) => d.revenue) ?? [0]),
  );

  const stats = [
    {
      label: "Revenue",
      value: data ? formatMoney(data.totalRevenue) : "—",
      icon: DollarSign,
    },
    {
      label: "Orders",
      value: data?.totalOrders ?? "—",
      icon: ShoppingBag,
    },
    {
      label: "Units sold",
      value: data?.totalProductsSold ?? "—",
      icon: Package,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex gap-1 rounded-lg border p-1">
          {RANGES.map((r) => (
            <Button
              key={r.value}
              size="sm"
              variant={range === r.value ? "secondary" : "ghost"}
              onClick={() => setRange(r.value)}
            >
              {r.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-4 py-6">
              <div className="bg-muted grid size-10 place-items-center rounded-lg">
                <s.icon className="size-5" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm">{s.label}</p>
                {isLoading ? (
                  <Skeleton className="mt-1 h-6 w-20" />
                ) : (
                  <p className="text-2xl font-bold">{s.value}</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="size-4" /> Revenue
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : !data || data.revenueChart.length === 0 ? (
            <p className="text-muted-foreground py-12 text-center text-sm">
              No sales in this period yet.
            </p>
          ) : (
            <div className="flex h-40 items-end gap-1">
              {data.revenueChart.map((d) => (
                <div
                  key={d.date}
                  className="group flex flex-1 flex-col items-center justify-end"
                  title={`${d.date}: ${formatMoney(d.revenue)}`}
                >
                  <div
                    className="bg-primary/80 group-hover:bg-primary w-full rounded-t transition-all"
                    style={{
                      height: `${(d.revenue / maxRevenue) * 100}%`,
                      minHeight: d.revenue > 0 ? 4 : 0,
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top products */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top products</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : !data || data.topProducts.length === 0 ? (
            <p className="text-muted-foreground py-6 text-center text-sm">
              No sales yet.
            </p>
          ) : (
            <ul className="divide-y">
              {data.topProducts.map((p, i) => (
                <li
                  key={p.productId}
                  className="flex items-center gap-3 py-3 text-sm"
                >
                  <span className="text-muted-foreground w-5 font-mono">
                    {i + 1}
                  </span>
                  <span className="flex-1 font-medium">{p.title}</span>
                  <span className="text-muted-foreground">
                    {p.quantity} sold
                  </span>
                  <span className="w-20 text-right font-semibold">
                    {formatMoney(p.revenue)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
