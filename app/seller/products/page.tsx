"use client";

import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ImageIcon, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductStatusBadge } from "@/components/product-status-badge";
import { fetchSellerProducts } from "@/lib/queries";
import { api, apiErrorMessage } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import { toast } from "sonner";

export default function SellerProductsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["seller-products"],
    queryFn: () => fetchSellerProducts(1),
  });

  async function remove(id: string, title: string) {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/products/${id}`);
      toast.success("Product deleted");
      await queryClient.invalidateQueries({ queryKey: ["seller-products"] });
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Products</h1>
        <Button render={<Link href="/seller/products/new" />}>
          <Plus className="size-4" /> Add product
        </Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : !data || data.data.length === 0 ? (
        <div className="text-muted-foreground rounded-lg border py-20 text-center">
          <p>No products yet.</p>
          <Button
            className="mt-4"
            render={<Link href="/seller/products/new" />}
          >
            Add your first product
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.map((p) => (
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
                        className="line-clamp-1 font-medium hover:underline"
                      >
                        {p.title}
                      </Link>
                    </div>
                  </TableCell>
                  <TableCell>
                    <ProductStatusBadge status={p.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    {formatMoney(p.price)}
                  </TableCell>
                  <TableCell className="text-right">{p.stock}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        render={<Link href={`/seller/products/${p.id}/edit`} />}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground"
                        onClick={() => remove(p.id, p.title)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
