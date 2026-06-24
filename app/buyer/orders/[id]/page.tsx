"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Check, ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { RequireAuth } from "@/components/require-auth";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { fetchOrder } from "@/lib/queries";
import { formatDate, formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/lib/types";

const TIMELINE: OrderStatus[] = [
  "PENDING",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
];

function OrderDetail() {
  const id = useParams().id as string;
  const { data: order, isLoading } = useQuery({
    queryKey: ["order", id],
    queryFn: () => fetchOrder(id),
  });

  if (isLoading) {
    return (
      <div className="grid place-items-center py-20">
        <Loader2 className="size-6 animate-spin" />
      </div>
    );
  }
  if (!order) {
    return (
      <div className="text-muted-foreground py-20 text-center">
        Order not found.
      </div>
    );
  }

  const cancelled = order.status === "CANCELLED" || order.status === "REFUNDED";
  const currentStep = TIMELINE.indexOf(order.status);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Button
        variant="ghost"
        size="sm"
        className="text-muted-foreground mb-4"
        render={<Link href="/buyer/orders" />}
      >
        <ArrowLeft className="size-4" /> Back to orders
      </Button>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Order #{order.id.slice(0, 8)}</h1>
          <p className="text-muted-foreground text-sm">
            Placed {formatDate(order.createdAt)}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      {/* Timeline */}
      {!cancelled && (
        <Card className="mb-6">
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              {TIMELINE.map((step, i) => {
                const done = i <= currentStep;
                return (
                  <div key={step} className="flex flex-1 flex-col items-center">
                    <div className="flex w-full items-center">
                      <div
                        className={cn(
                          "h-0.5 flex-1",
                          i === 0
                            ? "bg-transparent"
                            : done
                              ? "bg-emerald-500"
                              : "bg-muted",
                        )}
                      />
                      <div
                        className={cn(
                          "grid size-8 shrink-0 place-items-center rounded-full border-2",
                          done
                            ? "border-emerald-500 bg-emerald-500 text-white"
                            : "border-muted text-muted-foreground",
                        )}
                      >
                        {done ? (
                          <Check className="size-4" />
                        ) : (
                          <span className="text-xs">{i + 1}</span>
                        )}
                      </div>
                      <div
                        className={cn(
                          "h-0.5 flex-1",
                          i === TIMELINE.length - 1
                            ? "bg-transparent"
                            : i < currentStep
                              ? "bg-emerald-500"
                              : "bg-muted",
                        )}
                      />
                    </div>
                    <span className="text-muted-foreground mt-2 text-xs">
                      {step.charAt(0) + step.slice(1).toLowerCase()}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Items */}
      <Card>
        <CardContent className="divide-y py-0">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center gap-4 py-4">
              <div className="bg-muted size-16 shrink-0 overflow-hidden rounded-md">
                {item.product?.images?.[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.product.images[0]}
                    alt=""
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="text-muted-foreground/40 grid size-full place-items-center">
                    <ImageIcon className="size-6" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/products/${item.productId}`}
                  className="font-medium hover:underline"
                >
                  {item.product?.title ?? "Product"}
                </Link>
                {item.product?.store && (
                  <p className="text-muted-foreground text-sm">
                    Sold by{" "}
                    <Link
                      href={`/stores/${item.product.store.slug}`}
                      className="hover:underline"
                    >
                      {item.product.store.name}
                    </Link>
                  </p>
                )}
                <p className="text-muted-foreground text-sm">
                  Qty {item.quantity} × {formatMoney(item.price)}
                </p>
                {order.status === "DELIVERED" && (
                  <Link
                    href={`/products/${item.productId}`}
                    className="text-primary mt-1 inline-block text-sm hover:underline"
                  >
                    Write a review
                  </Link>
                )}
              </div>
              <div className="font-semibold">
                {formatMoney(Number(item.price) * item.quantity)}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="mt-4 flex justify-end">
        <div className="w-64 space-y-2">
          <Separator />
          <div className="flex justify-between text-lg font-semibold">
            <span>Total</span>
            <span>{formatMoney(order.total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BuyerOrderDetailPage() {
  return (
    <RequireAuth>
      <OrderDetail />
    </RequireAuth>
  );
}
