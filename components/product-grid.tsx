"use client";

import { ProductCard } from "@/components/product-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, PackageOpen } from "lucide-react";
import type { PaginationMeta, Product } from "@/lib/types";

export function ProductGrid({
  products,
  loading,
  skeletonCount = 8,
  meta,
  onPageChange,
}: {
  products?: Product[];
  loading?: boolean;
  skeletonCount?: number;
  meta?: PaginationMeta;
  onPageChange?: (page: number) => void;
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <Skeleton key={i} className="aspect-3/4 rounded-xl" />
        ))}
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="text-muted-foreground flex flex-col items-center gap-3 py-20 text-center">
        <PackageOpen className="size-10 opacity-40" />
        <p>No products match your filters.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>

      {meta && meta.lastPage > 1 && onPageChange && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={meta.page <= 1}
            onClick={() => onPageChange(meta.page - 1)}
          >
            <ChevronLeft className="size-4" /> Prev
          </Button>
          <span className="text-muted-foreground text-sm">
            Page {meta.page} of {meta.lastPage}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={meta.page >= meta.lastPage}
            onClick={() => onPageChange(meta.page + 1)}
          >
            Next <ChevronRight className="size-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
