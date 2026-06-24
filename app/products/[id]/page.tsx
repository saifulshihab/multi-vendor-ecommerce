"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ImageIcon,
  Loader2,
  Minus,
  Plus,
  ShoppingCart,
  Store,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { StarRating } from "@/components/star-rating";
import { ProductCard } from "@/components/product-card";
import { ReviewsSection } from "@/components/reviews-section";
import { fetchProduct, fetchRelated } from "@/lib/queries";
import { useCart } from "@/lib/cart-context";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function ProductDetailPage() {
  const id = useParams().id as string;
  const { addItem } = useCart();
  const [qty, setQty] = useState(1);
  const [activeImage, setActiveImage] = useState(0);

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: () => fetchProduct(id),
  });
  const { data: related } = useQuery({
    queryKey: ["related", id],
    queryFn: () => fetchRelated(id),
    enabled: !!product,
  });

  if (isLoading) {
    return (
      <div className="grid place-items-center py-20">
        <Loader2 className="size-6 animate-spin" />
      </div>
    );
  }
  if (!product) {
    return (
      <div className="text-muted-foreground py-20 text-center">
        Product not found.
      </div>
    );
  }

  const soldOut = product.stock <= 0 || product.status === "OUT_OF_STOCK";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Gallery */}
        <div className="space-y-3">
          <div className="bg-muted aspect-square overflow-hidden rounded-xl">
            {product.images?.[activeImage] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.images[activeImage]}
                alt={product.title}
                className="size-full object-cover"
              />
            ) : (
              <div className="text-muted-foreground/40 grid size-full place-items-center">
                <ImageIcon className="size-16" />
              </div>
            )}
          </div>
          {product.images && product.images.length > 1 && (
            <div className="flex gap-2">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={cn(
                    "bg-muted size-16 overflow-hidden rounded-md border-2",
                    i === activeImage ? "border-primary" : "border-transparent",
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt="" className="size-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          {product.category && (
            <Link
              href={`/products?category=${product.category.slug}`}
              className="text-muted-foreground text-sm hover:underline"
            >
              {product.category.name}
            </Link>
          )}
          <h1 className="mt-1 text-3xl font-bold">{product.title}</h1>

          <div className="mt-2 flex items-center gap-3">
            <StarRating
              value={product.avgRating ?? 0}
              showValue
              count={product.reviewCount}
            />
          </div>

          <p className="mt-4 text-3xl font-semibold">
            {formatMoney(product.price)}
          </p>

          <div className="mt-2">
            {soldOut ? (
              <Badge variant="secondary">Sold out</Badge>
            ) : (
              <span className="text-sm text-emerald-600">
                {product.stock} in stock
              </span>
            )}
          </div>

          {product.store && (
            <Link
              href={`/stores/${product.store.slug}`}
              className="bg-muted/50 hover:bg-muted mt-4 inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"
            >
              <Store className="size-4" />
              <span className="font-medium">{product.store.name}</span>
              <span className="text-muted-foreground">· Visit store</span>
            </Link>
          )}

          <Separator className="my-6" />

          {!soldOut && (
            <div className="flex items-center gap-3">
              <div className="flex items-center rounded-md border">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                >
                  <Minus className="size-4" />
                </Button>
                <span className="w-10 text-center">{qty}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={qty >= product.stock}
                  onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
                >
                  <Plus className="size-4" />
                </Button>
              </div>
              <Button
                size="lg"
                className="flex-1"
                onClick={async () => {
                  await addItem(product, qty);
                  toast.success(`Added ${qty} × "${product.title}" to cart`);
                }}
              >
                <ShoppingCart className="size-4" /> Add to cart
              </Button>
            </div>
          )}

          <div className="mt-6">
            <h2 className="mb-2 font-semibold">Description</h2>
            <p className="text-muted-foreground whitespace-pre-line text-sm leading-relaxed">
              {product.description}
            </p>
          </div>
        </div>
      </div>

      {/* Reviews */}
      <Separator className="my-10" />
      <ReviewsSection
        productId={product.id}
        avgRating={product.avgRating ?? 0}
        reviewCount={product.reviewCount ?? 0}
        storeOwnerId={product.store?.ownerId}
      />

      {/* Related */}
      {related && related.length > 0 && (
        <>
          <Separator className="my-10" />
          <h2 className="mb-4 text-lg font-semibold">Related products</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
