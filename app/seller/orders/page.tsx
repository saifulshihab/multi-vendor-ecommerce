"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ImageIcon, Package } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchSellerOrders } from "@/lib/queries";
import { api, apiErrorMessage } from "@/lib/api";
import { formatDate, formatMoney } from "@/lib/format";
import type { OrderStatus } from "@/lib/types";
import { toast } from "sonner";

const STATUS_OPTIONS: OrderStatus[] = [
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

export default function SellerOrdersPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["seller-orders"],
    queryFn: () => fetchSellerOrders(1),
  });

  async function updateStatus(orderId: string, status: OrderStatus) {
    try {
      await api.patch(`/seller/orders/${orderId}/status`, { status });
      toast.success(`Order marked ${status.toLowerCase()}`);
      await queryClient.invalidateQueries({ queryKey: ["seller-orders"] });
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Incoming orders</h1>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
      ) : !data || data.data.length === 0 ? (
        <div className="text-muted-foreground flex flex-col items-center gap-3 rounded-lg border py-20 text-center">
          <Package className="size-10 opacity-40" />
          <p>No orders yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {data.data.map((order) => {
            const subtotal = order.items.reduce(
              (sum, i) => sum + Number(i.price) * i.quantity,
              0,
            );
            return (
              <Card key={order.id}>
                <CardContent className="space-y-3 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">
                        Order #{order.id.slice(0, 8)}
                      </p>
                      <p className="text-muted-foreground text-sm">
                        {formatDate(order.createdAt)}
                        {order.buyer?.name && ` · ${order.buyer.name}`}
                      </p>
                    </div>
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

                  <div className="space-y-2">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-3">
                        <div className="bg-muted size-10 shrink-0 overflow-hidden rounded-md">
                          {item.product?.images?.[0] ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.product.images[0]}
                              alt=""
                              className="size-full object-cover"
                            />
                          ) : (
                            <div className="text-muted-foreground/40 grid size-full place-items-center">
                              <ImageIcon className="size-4" />
                            </div>
                          )}
                        </div>
                        <span className="flex-1 text-sm">
                          {item.product?.title ?? "Product"}
                        </span>
                        <span className="text-muted-foreground text-sm">
                          {item.quantity} × {formatMoney(item.price)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end border-t pt-2 text-sm">
                    <span className="text-muted-foreground mr-2">
                      Your subtotal:
                    </span>
                    <span className="font-semibold">
                      {formatMoney(subtotal)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
