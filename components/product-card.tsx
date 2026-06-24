"use client";

import Link from "next/link";
import { ShoppingCart, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StarRating } from "@/components/star-rating";
import { useCart } from "@/lib/cart-context";
import { formatMoney } from "@/lib/format";
import type { Product } from "@/lib/types";
import { toast } from "sonner";

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const soldOut = product.stock <= 0 || product.status === "OUT_OF_STOCK";

  async function onAdd(e: React.MouseEvent) {
    e.preventDefault();
    await addItem(product, 1);
    toast.success(`Added "${product.title}" to cart`);
  }

  return (
    <Link
      href={`/products/${product.id}`}
      className="group bg-card hover:border-foreground/20 flex flex-col overflow-hidden rounded-xl border transition-colors"
    >
      <div className="bg-muted relative aspect-square overflow-hidden">
        {product.images?.[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.images[0]}
            alt={product.title}
            className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="text-muted-foreground/40 grid size-full place-items-center">
            <ImageIcon className="size-10" />
          </div>
        )}
        {soldOut && (
          <Badge variant="secondary" className="absolute top-2 left-2">
            Sold out
          </Badge>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3">
        {product.category && (
          <span className="text-muted-foreground text-xs">
            {product.category.name}
          </span>
        )}
        <h3 className="line-clamp-2 text-sm font-medium">{product.title}</h3>
        {product.reviewCount && product.reviewCount > 0 ? (
          <StarRating
            value={product.avgRating ?? 0}
            showValue
            count={product.reviewCount}
          />
        ) : (
          <span className="text-muted-foreground text-xs">No reviews yet</span>
        )}
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="font-semibold">{formatMoney(product.price)}</span>
          <Button
            size="icon"
            variant="secondary"
            className="size-8"
            disabled={soldOut}
            onClick={onAdd}
            aria-label="Add to cart"
          >
            <ShoppingCart className="size-4" />
          </Button>
        </div>
      </div>
    </Link>
  );
}
