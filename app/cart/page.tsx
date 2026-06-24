"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ImageIcon, Loader2, Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";
import { api, unwrap, apiErrorMessage } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import { toast } from "sonner";

export default function CartPage() {
  const { lines, itemCount, subtotal, updateItem, removeItem } = useCart();
  const { status } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function checkout() {
    if (status !== "authenticated") {
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

  if (lines.length === 0) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
        <ShoppingCart className="text-muted-foreground/40 size-12" />
        <h1 className="text-xl font-semibold">Your cart is empty</h1>
        <p className="text-muted-foreground text-sm">
          Browse the marketplace and add something you love.
        </p>
        <Button render={<Link href="/products" />}>Browse products</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Your cart ({itemCount})</h1>
      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <ul className="space-y-4">
          {lines.map((line) => (
            <li
              key={line.productId}
              className="flex gap-4 rounded-lg border p-4"
            >
              <div className="bg-muted size-24 shrink-0 overflow-hidden rounded-md">
                {line.product.images?.[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={line.product.images[0]}
                    alt={line.product.title}
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="text-muted-foreground/40 grid size-full place-items-center">
                    <ImageIcon className="size-8" />
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col">
                <Link
                  href={`/products/${line.productId}`}
                  className="font-medium hover:underline"
                >
                  {line.product.title}
                </Link>
                <span className="text-muted-foreground text-sm">
                  {formatMoney(line.product.price)} each
                </span>
                <div className="mt-auto flex items-center gap-2">
                  <div className="flex items-center rounded-md border">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      onClick={() =>
                        line.quantity > 1
                          ? updateItem(line, line.quantity - 1)
                          : removeItem(line)
                      }
                    >
                      <Minus className="size-3.5" />
                    </Button>
                    <span className="w-8 text-center text-sm">
                      {line.quantity}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      disabled={line.quantity >= line.product.stock}
                      onClick={() => updateItem(line, line.quantity + 1)}
                    >
                      <Plus className="size-3.5" />
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground ml-auto"
                    onClick={() => removeItem(line)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
              <div className="text-right font-semibold">
                {formatMoney(Number(line.product.price) * line.quantity)}
              </div>
            </li>
          ))}
        </ul>

        <Card className="h-fit">
          <CardContent className="space-y-4 pt-6">
            <h2 className="font-semibold">Order summary</h2>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                Subtotal ({itemCount} items)
              </span>
              <span>{formatMoney(subtotal)}</span>
            </div>
            <div className="text-muted-foreground flex justify-between text-sm">
              <span>Shipping</span>
              <span>Calculated at checkout</span>
            </div>
            <Separator />
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>{formatMoney(subtotal)}</span>
            </div>
            <Button
              className="w-full"
              size="lg"
              onClick={checkout}
              disabled={loading}
            >
              {loading && <Loader2 className="size-4 animate-spin" />}
              {status === "authenticated"
                ? "Proceed to checkout"
                : "Sign in to checkout"}
            </Button>
            <p className="text-muted-foreground text-center text-xs">
              Secure payment powered by Stripe
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
