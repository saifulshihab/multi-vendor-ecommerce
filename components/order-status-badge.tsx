import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/lib/types";

const STYLES: Record<OrderStatus, string> = {
  PENDING: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  PROCESSING: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  SHIPPED:
    "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300",
  DELIVERED:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  CANCELLED: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  REFUNDED: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <Badge variant="secondary" className={cn("border-0", STYLES[status])}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </Badge>
  );
}
