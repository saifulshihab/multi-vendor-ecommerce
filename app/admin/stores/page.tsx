"use client";

import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Store as StoreIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchAdminStores } from "@/lib/queries";
import { api, apiErrorMessage } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { toast } from "sonner";

export default function AdminStoresPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-stores"],
    queryFn: () => fetchAdminStores(1),
  });

  async function setApproval(id: string, isApproved: boolean) {
    try {
      await api.patch(`/admin/stores/${id}/approve`, { isApproved });
      toast.success(isApproved ? "Store approved" : "Store unapproved");
      await queryClient.invalidateQueries({ queryKey: ["admin-stores"] });
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Stores</h1>

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : !data || data.data.length === 0 ? (
        <div className="text-muted-foreground flex flex-col items-center gap-3 rounded-lg border py-20 text-center">
          <StoreIcon className="size-10 opacity-40" />
          <p>No stores yet.</p>
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Store</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <Link
                      href={`/stores/${s.slug}`}
                      className="font-medium hover:underline"
                    >
                      {s.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {s.owner?.name ?? "—"}
                  </TableCell>
                  <TableCell>
                    {s.isApproved ? (
                      <Badge variant="secondary">Approved</Badge>
                    ) : (
                      <Badge variant="outline">Pending</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDate(s.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant={s.isApproved ? "outline" : "default"}
                      size="sm"
                      onClick={() => setApproval(s.id, !s.isApproved)}
                    >
                      {s.isApproved ? "Unapprove" : "Approve"}
                    </Button>
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
