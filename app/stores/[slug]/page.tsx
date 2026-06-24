"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Store as StoreIcon, BadgeCheck } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ProductGrid } from "@/components/product-grid";
import { fetchStore, fetchProducts } from "@/lib/queries";
import { initials } from "@/lib/format";

export default function StorefrontPage() {
  const slug = useParams().slug as string;

  const { data: store, isLoading } = useQuery({
    queryKey: ["store", slug],
    queryFn: () => fetchStore(slug),
  });
  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ["store-products", store?.id],
    queryFn: () => fetchProducts({ storeId: store!.id, limit: 24 }),
    enabled: !!store,
  });

  if (isLoading) {
    return (
      <div className="grid place-items-center py-20">
        <Loader2 className="size-6 animate-spin" />
      </div>
    );
  }
  if (!store) {
    return (
      <div className="text-muted-foreground py-20 text-center">
        Store not found.
      </div>
    );
  }

  return (
    <div>
      {/* Banner */}
      <div className="from-muted to-background h-40 bg-linear-to-b sm:h-56">
        {store.bannerUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={store.bannerUrl}
            alt=""
            className="size-full object-cover"
          />
        )}
      </div>

      <div className="mx-auto max-w-7xl px-4">
        <div className="-mt-10 flex items-end gap-4">
          <Avatar className="border-background size-20 border-4">
            {store.logoUrl && <AvatarImage src={store.logoUrl} alt={store.name} />}
            <AvatarFallback className="text-xl">
              {initials(store.name)}
            </AvatarFallback>
          </Avatar>
          <div className="pb-1">
            <h1 className="flex items-center gap-2 text-2xl font-bold">
              {store.name}
              {store.isApproved && (
                <BadgeCheck className="size-5 text-emerald-500" />
              )}
            </h1>
            {store.description && (
              <p className="text-muted-foreground text-sm">
                {store.description}
              </p>
            )}
          </div>
        </div>

        <div className="mt-8 mb-4 flex items-center gap-2">
          <StoreIcon className="text-muted-foreground size-4" />
          <h2 className="font-semibold">Products</h2>
          {products && (
            <Badge variant="secondary">{products.meta.total}</Badge>
          )}
        </div>

        <div className="pb-16">
          <ProductGrid
            products={products?.data}
            loading={productsLoading}
            skeletonCount={8}
          />
        </div>
      </div>
    </div>
  );
}
