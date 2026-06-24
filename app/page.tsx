"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductCard } from "@/components/product-card";
import { fetchProducts, fetchCategories } from "@/lib/queries";

export default function HomePage() {
  const { data: featured, isLoading } = useQuery({
    queryKey: ["products", { sort: "newest", limit: 8 }],
    queryFn: () => fetchProducts({ sort: "newest", limit: 8 }),
  });
  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
    staleTime: 5 * 60_000,
  });

  return (
    <div>
      {/* Hero */}
      <section className="from-amber-50 to-background dark:from-amber-950/20 border-b bg-linear-to-b">
        <div className="mx-auto max-w-7xl px-4 py-20 text-center">
          <span className="bg-background inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium">
            <Store className="size-3.5" /> Independent sellers welcome
          </span>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-balance sm:text-6xl">
            A marketplace for makers and the people who love their work
          </h1>
          <p className="text-muted-foreground mx-auto mt-4 max-w-2xl text-lg">
            Shop unique products from independent stores — handmade goods,
            electronics, books and more, all in one place.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Button size="lg" render={<Link href="/products" />}>
              Start shopping <ArrowRight className="size-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              render={<Link href="/seller/onboarding" />}
            >
              Sell on OpenStall
            </Button>
          </div>
        </div>
      </section>

      {/* Categories */}
      {categories && categories.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-10">
          <h2 className="mb-4 text-lg font-semibold">Shop by category</h2>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <Button
                key={c.id}
                variant="outline"
                size="sm"
                render={<Link href={`/products?category=${c.slug}`} />}
              >
                {c.name}
              </Button>
            ))}
          </div>
        </section>
      )}

      {/* Featured */}
      <section className="mx-auto max-w-7xl px-4 pb-16">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">New arrivals</h2>
          <Button variant="ghost" size="sm" render={<Link href="/products" />}>
            View all <ArrowRight className="size-4" />
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="aspect-3/4 rounded-xl" />
              ))
            : featured?.data.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
        {!isLoading && featured?.data.length === 0 && (
          <p className="text-muted-foreground py-12 text-center">
            No products yet. Be the first to{" "}
            <Link href="/seller/onboarding" className="underline">
              open a store
            </Link>
            .
          </p>
        )}
      </section>
    </div>
  );
}
