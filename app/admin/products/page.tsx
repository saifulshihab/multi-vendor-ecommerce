"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ImageIcon, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ProductStatusBadge } from "@/components/product-status-badge";
import { fetchAdminProducts } from "@/lib/queries";
import { api, apiErrorMessage } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import { toast } from "sonner";

export default function AdminProductsPage() {
  const queryClient = useQueryClient();
  const [q, setQ] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-products", q],
    queryFn: () => fetchAdminProducts({ q: q || undefined }),
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["admin-products"] });

  async function toggleHide(id: string, hidden: boolean) {
    try {
      await api.patch(`/admin/products/${id}/status`, {
        status: hidden ? "ACTIVE" : "DRAFT",
      });
      toast.success(hidden ? "Product shown" : "Product hidden");
      await invalidate();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  async function remove(id: string) {
    if (!confirm("Permanently delete this product?")) return;
    try {
      await api.delete(`/admin/products/${id}`);
      toast.success("Product removed");
      await invalidate();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Products</h1>

      <div className="relative">
        <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search products…"
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : !data || data.data.length === 0 ? (
        <p className="text-muted-foreground py-16 text-center">
          No products found.
        </p>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Store</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.map((p) => {
                const hidden = p.status === "DRAFT";
                return (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="bg-muted size-10 shrink-0 overflow-hidden rounded-md">
                          {p.images?.[0] ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={p.images[0]}
                              alt=""
                              className="size-full object-cover"
                            />
                          ) : (
                            <div className="text-muted-foreground/40 grid size-full place-items-center">
                              <ImageIcon className="size-4" />
                            </div>
                          )}
                        </div>
                        <Link
                          href={`/products/${p.id}`}
                          className="font-medium hover:underline"
                        >
                          {p.title}
                        </Link>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {p.store?.name ?? "—"}
                    </TableCell>
                    <TableCell>{formatMoney(p.price)}</TableCell>
                    <TableCell>{p.stock}</TableCell>
                    <TableCell>
                      <ProductStatusBadge status={p.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleHide(p.id, hidden)}
                        >
                          {hidden ? "Show" : "Hide"}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => remove(p.id)}
                        >
                          Remove
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
