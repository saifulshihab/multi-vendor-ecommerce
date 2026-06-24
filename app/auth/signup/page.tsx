"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, ShoppingBag, Store } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { GoogleButton } from "@/components/google-button";
import { useAuth } from "@/lib/auth-context";
import { apiErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Role = "BUYER" | "SELLER";

export default function SignupPage() {
  const { signup } = useAuth();
  const router = useRouter();
  const [role, setRole] = useState<Role>("BUYER");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await signup({ name, email, password, role });
      toast.success("Account created! Check your email to verify.");
      router.push(role === "SELLER" ? "/seller/onboarding" : "/");
    } catch (err) {
      toast.error(apiErrorMessage(err));
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Create your account</CardTitle>
        <CardDescription>Join OpenStall as a buyer or a seller</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {(
            [
              { value: "BUYER", label: "Shop", icon: ShoppingBag },
              { value: "SELLER", label: "Sell", icon: Store },
            ] as const
          ).map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setRole(opt.value)}
              className={cn(
                "flex flex-col items-center gap-1 rounded-lg border p-4 text-sm transition-colors",
                role === opt.value
                  ? "border-primary bg-primary/5 ring-primary/20 ring-2"
                  : "hover:bg-muted",
              )}
            >
              <opt.icon className="size-5" />
              {opt.label}
            </button>
          ))}
        </div>

        <GoogleButton label="Sign up with Google" />
        <div className="flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-muted-foreground text-xs">OR</span>
          <Separator className="flex-1" />
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full name</Label>
            <Input
              id="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Doe"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="size-4 animate-spin" />}
            Create account
          </Button>
        </form>
        <p className="text-muted-foreground text-center text-sm">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-foreground hover:underline">
            Log in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
