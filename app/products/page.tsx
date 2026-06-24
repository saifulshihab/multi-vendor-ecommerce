"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProductGrid } from "@/components/product-grid";
import { fetchProducts, fetchCategories, ProductQuery } from "@/lib/queries";

const SORTS = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "best_rated", label: "Best Rated" },
] as const;

function CatalogInner() {
  const router = useRouter();
  const params = useSearchParams();

  const query: ProductQuery = useMemo(
    () => ({
      q: params.get("q") ?? undefined,
      category: params.get("category") ?? undefined,
      minPrice: params.get("minPrice") ? Number(params.get("minPrice")) : undefined,
      maxPrice: params.get("maxPrice") ? Number(params.get("maxPrice")) : undefined,
      minRating: params.get("minRating") ? Number(params.get("minRating")) : undefined,
      inStock: params.get("inStock") === "true" || undefined,
      sort: (params.get("sort") as ProductQuery["sort"]) ?? "newest",
      page: params.get("page") ? Number(params.get("page")) : 1,
      limit: 12,
    }),
    [params],
  );

  const { data, isLoading } = useQuery({
    queryKey: ["products", query],
    queryFn: () => fetchProducts(query),
  });
  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
    staleTime: 5 * 60_000,
  });

  const setParam = useCallback(
    (updates: Record<string, string | undefined>, resetPage = true) => {
      const next = new URLSearchParams(params.toString());
      for (const [k, v] of Object.entries(updates)) {
        if (v === undefined || v === "") next.delete(k);
        else next.set(k, v);
      }
      if (resetPage) next.delete("page");
      router.replace(`/products?${next.toString()}`);
    },
    [params, router],
  );

  // Debounced search box.
  const [search, setSearch] = useState(query.q ?? "");
  useEffect(() => {
    // Keep the box in sync when the URL query changes (e.g. back/forward).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSearch(query.q ?? "");
  }, [query.q]);
  useEffect(() => {
    const t = setTimeout(() => {
      if ((query.q ?? "") !== search) {
        setParam({ q: search || undefined });
      }
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Browse products</h1>
          {data && (
            <p className="text-muted-foreground text-sm">
              {data.meta.total} result{data.meta.total === 1 ? "" : "s"}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="text-muted-foreground size-4" />
          <Select
            value={query.sort}
            onValueChange={(v) => setParam({ sort: v ?? undefined })}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORTS.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        {/* Filters */}
        <aside className="space-y-6">
          <div className="space-y-2">
            <Label>Search</Label>
            <div className="relative">
              <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search…"
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              value={query.category ?? "all"}
              onValueChange={(v) =>
                setParam({ category: v && v !== "all" ? v : undefined })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories?.map((c) => (
                  <SelectItem key={c.id} value={c.slug}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Price range</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={0}
                placeholder="Min"
                defaultValue={query.minPrice ?? ""}
                onBlur={(e) =>
                  setParam({ minPrice: e.target.value || undefined })
                }
              />
              <span className="text-muted-foreground">–</span>
              <Input
                type="number"
                min={0}
                placeholder="Max"
                defaultValue={query.maxPrice ?? ""}
                onBlur={(e) =>
                  setParam({ maxPrice: e.target.value || undefined })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Minimum rating</Label>
            <Select
              value={query.minRating ? String(query.minRating) : "any"}
              onValueChange={(v) =>
                setParam({ minRating: v && v !== "any" ? v : undefined })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any rating</SelectItem>
                {[4, 3, 2, 1].map((r) => (
                  <SelectItem key={r} value={String(r)}>
                    {r}★ & up
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            variant={query.inStock ? "default" : "outline"}
            className="w-full"
            onClick={() =>
              setParam({ inStock: query.inStock ? undefined : "true" })
            }
          >
            {query.inStock ? "✓ In stock only" : "In stock only"}
          </Button>

          <Button
            variant="ghost"
            className="text-muted-foreground w-full"
            onClick={() => router.replace("/products")}
          >
            Clear filters
          </Button>
        </aside>

        {/* Results */}
        <ProductGrid
          products={data?.data}
          loading={isLoading}
          skeletonCount={12}
          meta={data?.meta}
          onPageChange={(page) => setParam({ page: String(page) }, false)}
        />
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="grid place-items-center py-20">
          <Loader2 className="size-6 animate-spin" />
        </div>
      }
    >
      <CatalogInner />
    </Suspense>
  );
}
