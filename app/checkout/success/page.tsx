"use client";

import { Suspense, useEffect, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

function Success() {
  const sessionId = useSearchParams().get("session_id");
  const queryClient = useQueryClient();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    // The webhook clears the DB cart and creates the order; refresh local cache.
    queryClient.invalidateQueries({ queryKey: ["cart"] });
    queryClient.invalidateQueries({ queryKey: ["orders"] });
  }, [queryClient]);

  return (
    <div className="mx-auto max-w-md px-4 py-24">
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
          <CheckCircle2 className="size-16 text-emerald-500" />
          <h1 className="text-2xl font-bold">Thank you for your order!</h1>
          <p className="text-muted-foreground text-sm">
            Your payment was successful. We’ve emailed your confirmation and
            notified the seller(s). Your order will appear in your history
            momentarily.
          </p>
          {sessionId && (
            <p className="text-muted-foreground font-mono text-xs">
              Ref: {sessionId.slice(0, 24)}…
            </p>
          )}
          <div className="mt-2 flex gap-3">
            <Button render={<Link href="/buyer/orders" />}>
              <Package className="size-4" /> View my orders
            </Button>
            <Button variant="outline" render={<Link href="/products" />}>
              Keep shopping
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={null}>
      <Success />
    </Suspense>
  );
}
