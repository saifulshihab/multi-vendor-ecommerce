"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingCart, Minus, Plus, Trash2, Loader2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";
import { api, unwrap, apiErrorMessage } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import { toast } from "sonner";

export function CartSheet() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { lines, itemCount, subtotal, updateItem, removeItem } = useCart();
  const { status } = useAuth();
  const router = useRouter();

  async function handleCheckout() {
    if (status !== "authenticated") {
      setOpen(false);
      router.push("/auth/login?redirect=/cart");
      return;
    }
    setLoading(true);
    try {
      const res = await unwrap<{ url: string }>(
        api.post("/checkout/session", {}),
      );
      window.location.href = res.url;
    } catch (err) {
      toast.error(apiErrorMessage(err));
      setLoading(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            aria-label="Cart"
          />
        }
      >
        <ShoppingCart className="size-5" />
        {itemCount > 0 && (
          <Badge className="bg-primary absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full p-0 text-[10px]">
            {itemCount}
          </Badge>
        )}
      </SheetTrigger>
      <SheetContent className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Your cart ({itemCount})</SheetTitle>
        </SheetHeader>

        {lines.length === 0 ? (
          <div className="text-muted-foreground flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center text-sm">
            <ShoppingCart className="size-10 opacity-30" />
            Your cart is empty.
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              render={<Link href="/products" />}
            >
              Browse products
            </Button>
          </div>
        ) : (
          <div className="flex-1 space-y-4 overflow-y-auto px-4">
            {lines.map((line) => (
              <div key={line.productId} className="flex gap-3">
                <div className="bg-muted size-16 shrink-0 overflow-hidden rounded-md">
                  {line.product.images?.[0] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={line.product.images[0]}
                      alt={line.product.title}
                      className="size-full object-cover"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/products/${line.productId}`}
                    onClick={() => setOpen(false)}
                    className="line-clamp-1 text-sm font-medium hover:underline"
                  >
                    {line.product.title}
                  </Link>
                  <p className="text-muted-foreground text-sm">
                    {formatMoney(line.product.price)}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-7"
                      onClick={() =>
                        line.quantity > 1
                          ? updateItem(line, line.quantity - 1)
                          : removeItem(line)
                      }
                    >
                      <Minus className="size-3" />
                    </Button>
                    <span className="w-6 text-center text-sm">
                      {line.quantity}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-7"
                      disabled={line.quantity >= line.product.stock}
                      onClick={() => updateItem(line, line.quantity + 1)}
                    >
                      <Plus className="size-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground ml-auto size-7"
                      onClick={() => removeItem(line)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {lines.length > 0 && (
          <SheetFooter className="gap-3 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="text-lg font-semibold">
                {formatMoney(subtotal)}
              </span>
            </div>
            <Button onClick={handleCheckout} disabled={loading} size="lg">
              {loading && <Loader2 className="size-4 animate-spin" />}
              {status === "authenticated" ? "Checkout" : "Sign in to checkout"}
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
