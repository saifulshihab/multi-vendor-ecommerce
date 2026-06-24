import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ProductStatus } from "@/lib/types";

const STYLES: Record<ProductStatus, string> = {
  ACTIVE:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  DRAFT: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  OUT_OF_STOCK:
    "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
};

const LABELS: Record<ProductStatus, string> = {
  ACTIVE: "Active",
  DRAFT: "Draft",
  OUT_OF_STOCK: "Out of stock",
};

export function ProductStatusBadge({ status }: { status: ProductStatus }) {
  return (
    <Badge variant="secondary" className={cn("border-0", STYLES[status])}>
      {LABELS[status]}
    </Badge>
  );
}
