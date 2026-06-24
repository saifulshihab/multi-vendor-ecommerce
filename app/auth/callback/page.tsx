"use client";

import { Suspense, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

function Callback() {
  const router = useRouter();
  const token = useSearchParams().get("accessToken");
  const { setSession } = useAuth();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    (async () => {
      if (!token) {
        toast.error("Sign-in failed");
        router.replace("/auth/login");
        return;
      }
      await setSession(token);
      toast.success("Signed in!");
      router.replace("/");
    })();
  }, [token, setSession, router]);

  return (
    <div className="flex flex-col items-center gap-3 py-12 text-center">
      <Loader2 className="size-8 animate-spin" />
      <p className="text-muted-foreground text-sm">Completing sign-in…</p>
    </div>
  );
}

export default function CallbackPage() {
  return (
    <Suspense fallback={<Loader2 className="mx-auto size-6 animate-spin" />}>
      <Callback />
    </Suspense>
  );
}
