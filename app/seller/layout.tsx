"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Loader2,
} from "lucide-react";
import { RequireAuth } from "@/components/require-auth";
import { fetchMyStore } from "@/lib/queries";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/seller/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/seller/products", label: "Products", icon: Package },
  { href: "/seller/orders", label: "Orders", icon: ShoppingBag },
];

function SellerShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const onOnboarding = pathname.startsWith("/seller/onboarding");

  const { data: store, isLoading, isError } = useQuery({
    queryKey: ["my-store"],
    queryFn: fetchMyStore,
    retry: false,
  });

  useEffect(() => {
    if (!onOnboarding && !isLoading && isError) {
      router.replace("/seller/onboarding");
    }
  }, [onOnboarding, isLoading, isError, router]);

  if (onOnboarding) return <>{children}</>;

  if (isLoading) {
    return (
      <div className="grid place-items-center py-24">
        <Loader2 className="size-6 animate-spin" />
      </div>
    );
  }
  if (isError || !store) return null; // redirecting to onboarding

  return (
    <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 lg:grid-cols-[220px_1fr]">
      <aside className="space-y-4">
        <div>
          <p className="text-muted-foreground text-xs">Store</p>
          <Link
            href={`/stores/${store.slug}`}
            className="font-semibold hover:underline"
          >
            {store.name}
          </Link>
        </div>
        <nav className="flex gap-1 lg:flex-col">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-muted font-medium"
                    : "text-muted-foreground hover:bg-muted/50",
                )}
              >
                <item.icon className="size-4" /> {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div>{children}</div>
    </div>
  );
}

export default function SellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireAuth roles={["SELLER"]}>
      <SellerShell>{children}</SellerShell>
    </RequireAuth>
  );
}
