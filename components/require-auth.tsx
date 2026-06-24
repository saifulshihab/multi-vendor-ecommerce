"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import type { Role } from "@/lib/types";

export function RequireAuth({
  children,
  roles,
}: {
  children: React.ReactNode;
  roles?: Role[];
}) {
  const { user, status } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace(`/auth/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [status, router, pathname]);

  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="grid place-items-center py-24">
        <Loader2 className="size-6 animate-spin" />
      </div>
    );
  }

  if (roles && user && !roles.includes(user.role)) {
    return (
      <div className="text-muted-foreground py-24 text-center">
        You don’t have access to this page.
      </div>
    );
  }

  return <>{children}</>;
}
