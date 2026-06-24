import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function StarRating({
  value,
  size = 14,
  className,
  showValue = false,
  count,
}: {
  value: number;
  size?: number;
  className?: string;
  showValue?: boolean;
  count?: number;
}) {
  const rounded = Math.round(value * 2) / 2;
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="flex">
        {[1, 2, 3, 4, 5].map((i) => {
          const filled = i <= Math.floor(rounded);
          const half = !filled && i - 0.5 === rounded;
          return (
            <Star
              key={i}
              style={{ width: size, height: size }}
              className={cn(
                filled || half
                  ? "fill-amber-400 text-amber-400"
                  : "fill-muted text-muted-foreground/40",
              )}
            />
          );
        })}
      </div>
      {showValue && (
        <span className="text-muted-foreground text-xs">
          {value.toFixed(1)}
          {count !== undefined && ` (${count})`}
        </span>
      )}
    </div>
  );
}
