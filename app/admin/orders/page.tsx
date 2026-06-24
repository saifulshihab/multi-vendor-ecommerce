"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ShoppingBag } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchAdminOrders } from "@/lib/queries";
import { api, apiErrorMessage } from "@/lib/api";
import { formatDate, formatMoney } from "@/lib/format";
import type { OrderStatus } from "@/lib/types";
import { toast } from "sonner";

const STATUS_OPTIONS: OrderStatus[] = [
  "PENDING",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
];

export default function AdminOrdersPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: () => fetchAdminOrders(1),
  });

  async function updateStatus(orderId: string, status: OrderStatus) {
    try {
      await api.patch(`/admin/orders/${orderId}/status`, { status });
      toast.success(`Order marked ${status.toLowerCase()}`);
      await queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">All orders</h1>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))}
        </div>
      ) : !data || data.data.length === 0 ? (
        <div className="text-muted-foreground flex flex-col items-center gap-3 rounded-lg border py-20 text-center">
          <ShoppingBag className="size-10 opacity-40" />
          <p>No orders yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {data.data.map((order) => (
            <Card key={order.id}>
              <CardContent className="space-y-3 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Order #{order.id.slice(0, 8)}</p>
                    <p className="text-muted-foreground text-sm">
                      {formatDate(order.createdAt)}
                      {order.buyer?.name && ` · ${order.buyer.name}`} ·{" "}
                      {order.items.length} item
                      {order.items.length === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">
                      {formatMoney(order.total)}
                    </span>
                    <Select
                      value={order.status}
                      onValueChange={(v) =>
                        v && updateStatus(order.id, v as OrderStatus)
                      }
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s.charAt(0) + s.slice(1).toLowerCase()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="text-muted-foreground text-sm">
                  {order.items
                    .map((i) => `${i.quantity}× ${i.product?.title ?? "Item"}`)
                    .join(", ")}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
