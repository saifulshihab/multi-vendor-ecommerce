"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

function VerifyEmail() {
  const token = useSearchParams().get("token") ?? "";
  const { refreshUser } = useAuth();
  const [state, setState] = useState<"loading" | "ok" | "error">("loading");
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    if (!token) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState("error");
      return;
    }
    api
      .post("/auth/verify-email", { token })
      .then(async () => {
        setState("ok");
        await refreshUser();
      })
      .catch(() => setState("error"));
  }, [token, refreshUser]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center text-2xl">Email verification</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4 py-6 text-center">
        {state === "loading" && (
          <>
            <Loader2 className="size-10 animate-spin" />
            <p className="text-muted-foreground text-sm">Verifying…</p>
          </>
        )}
        {state === "ok" && (
          <>
            <CheckCircle2 className="size-12 text-emerald-500" />
            <p className="text-sm">Your email has been verified.</p>
            <Button render={<Link href="/" />}>Continue shopping</Button>
          </>
        )}
        {state === "error" && (
          <>
            <XCircle className="text-destructive size-12" />
            <p className="text-sm">
              This verification link is invalid or has expired.
            </p>
            <Button variant="outline" render={<Link href="/" />}>
              Go home
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<Loader2 className="mx-auto size-6 animate-spin" />}>
      <VerifyEmail />
    </Suspense>
  );
}
