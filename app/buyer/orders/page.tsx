"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Package } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RequireAuth } from "@/components/require-auth";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { fetchMyOrders } from "@/lib/queries";
import { formatDate, formatMoney } from "@/lib/format";

function OrdersList() {
  const { data, isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: () => fetchMyOrders(1),
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
    );
  }

  if (!data || data.data.length === 0) {
    return (
      <div className="text-muted-foreground flex flex-col items-center gap-3 py-20 text-center">
        <Package className="size-10 opacity-40" />
        <p>You haven’t placed any orders yet.</p>
        <Button render={<Link href="/products" />}>Start shopping</Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {data.data.map((order) => (
        <Link key={order.id} href={`/buyer/orders/${order.id}`}>
          <Card className="transition-colors hover:border-foreground/20">
            <CardContent className="flex items-center gap-4 py-4">
              <div className="flex -space-x-3">
                {order.items.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    className="bg-muted border-background size-12 overflow-hidden rounded-md border-2"
                  >
                    {item.product?.images?.[0] && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.product.images[0]}
                        alt=""
                        className="size-full object-cover"
                      />
                    )}
                  </div>
                ))}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    Order #{order.id.slice(0, 8)}
                  </span>
                  <OrderStatusBadge status={order.status} />
                </div>
                <p className="text-muted-foreground text-sm">
                  {formatDate(order.createdAt)} ·{" "}
                  {order.items.length} item{order.items.length === 1 ? "" : "s"}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold">{formatMoney(order.total)}</p>
              </div>
              <ChevronRight className="text-muted-foreground size-5" />
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}

export default function BuyerOrdersPage() {
  return (
    <RequireAuth>
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold">My orders</h1>
        <OrdersList />
      </div>
    </RequireAuth>
  );
}
