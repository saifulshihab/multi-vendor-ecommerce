"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  DollarSign,
  Package,
  Percent,
  ShoppingBag,
  TrendingUp,
  Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchAdminAnalytics } from "@/lib/queries";
import { api, apiErrorMessage } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import { toast } from "sonner";

export default function AdminDashboardPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-analytics"],
    queryFn: fetchAdminAnalytics,
  });

  const maxRevenue = Math.max(
    1,
    ...(data?.revenueChart.map((d) => d.revenue) ?? [0]),
  );

  const stats = [
    {
      label: "GMV",
      value: data ? formatMoney(data.gmv) : "—",
      icon: DollarSign,
    },
    {
      label: "Commission earned",
      value: data ? formatMoney(data.commissionEarned) : "—",
      icon: Percent,
    },
    { label: "Orders", value: data?.totalOrders ?? "—", icon: ShoppingBag },
    { label: "Users", value: data?.totalUsers ?? "—", icon: Users },
    { label: "Sellers", value: data?.totalSellers ?? "—", icon: Users },
    { label: "Products", value: data?.totalProducts ?? "—", icon: Package },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Platform overview</h1>

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

      <CommissionCard
        percent={data?.commissionPercent}
        loading={isLoading}
        onSaved={() =>
          queryClient.invalidateQueries({ queryKey: ["admin-analytics"] })
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="size-4" /> Revenue (last 30 days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : !data || data.revenueChart.length === 0 ? (
            <p className="text-muted-foreground py-12 text-center text-sm">
              No sales yet.
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

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top stores</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : !data || data.topStores.length === 0 ? (
            <p className="text-muted-foreground py-6 text-center text-sm">
              No sales yet.
            </p>
          ) : (
            <ul className="divide-y">
              {data.topStores.map((s, i) => (
                <li
                  key={s.storeId}
                  className="flex items-center gap-3 py-3 text-sm"
                >
                  <span className="text-muted-foreground w-5 font-mono">
                    {i + 1}
                  </span>
                  <span className="flex-1 font-medium">{s.name}</span>
                  <span className="font-semibold">
                    {formatMoney(s.revenue)}
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

function CommissionCard({
  percent,
  loading,
  onSaved,
}: {
  percent?: number;
  loading: boolean;
  onSaved: () => void;
}) {
  const [value, setValue] = useState("");

  useEffect(() => {
    if (percent !== undefined) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setValue(String(percent));
    }
  }, [percent]);

  const mutation = useMutation({
    mutationFn: () =>
      api.patch("/admin/settings/commission", { percent: Number(value) }),
    onSuccess: () => {
      toast.success("Commission rate updated");
      onSaved();
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Percent className="size-4" /> Commission rate
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-10 w-48" />
        ) : (
          <div className="flex items-end gap-3">
            <div className="space-y-1">
              <p className="text-muted-foreground text-xs">
                Platform fee taken from each seller payout
              </p>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className="w-24"
                />
                <span className="text-muted-foreground">%</span>
              </div>
            </div>
            <Button
              disabled={mutation.isPending || value === String(percent)}
              onClick={() => mutation.mutate()}
            >
              Save
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
