"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  BadgeCheck,
  CreditCard,
  Loader2,
  Store as StoreIcon,
} from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { fetchMyStore } from "@/lib/queries";
import { api, unwrap, apiErrorMessage } from "@/lib/api";
import { toast } from "sonner";

export default function OnboardingPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { data: store, isLoading } = useQuery({
    queryKey: ["my-store"],
    queryFn: fetchMyStore,
    retry: false,
  });

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [connecting, setConnecting] = useState(false);

  async function createStore(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/stores", {
        name,
        description: description || undefined,
        logoUrl: logoUrl || undefined,
      });
      toast.success("Store created!");
      await queryClient.invalidateQueries({ queryKey: ["my-store"] });
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function connectStripe() {
    setConnecting(true);
    try {
      const res = await unwrap<{ url: string }>(
        api.post("/stores/mine/onboarding-link", {}),
      );
      window.location.href = res.url;
    } catch (err) {
      toast.error(apiErrorMessage(err));
      setConnecting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="grid place-items-center py-24">
        <Loader2 className="size-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      {!store ? (
        <Card>
          <CardHeader>
            <div className="bg-primary/10 mb-2 grid size-10 place-items-center rounded-lg">
              <StoreIcon className="text-primary size-5" />
            </div>
            <CardTitle className="text-2xl">Open your store</CardTitle>
            <CardDescription>
              Set up your storefront. You can add products and connect payouts
              next.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={createStore} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Store name</Label>
                <Input
                  id="name"
                  required
                  minLength={2}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane’s Handmade Goods"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What do you sell?"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="logo">Logo URL (optional)</Label>
                <Input
                  id="logo"
                  type="url"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://…"
                />
              </div>
              <Button type="submit" className="w-full" disabled={saving}>
                {saving && <Loader2 className="size-4 animate-spin" />}
                Create store
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="mb-2 grid size-10 place-items-center rounded-lg bg-emerald-100 dark:bg-emerald-950">
              <BadgeCheck className="size-5 text-emerald-600" />
            </div>
            <CardTitle className="text-2xl">You’re set up!</CardTitle>
            <CardDescription>
              <strong>{store.name}</strong> is live. Connect Stripe to receive
              payouts, then add your first product.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <CreditCard className="text-muted-foreground size-5" />
                <div>
                  <p className="text-sm font-medium">Payouts via Stripe</p>
                  <p className="text-muted-foreground text-xs">
                    {store.stripeAccountId
                      ? "Account created — finish verification to get paid."
                      : "Not connected yet."}
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={connectStripe}
                disabled={connecting}
              >
                {connecting && <Loader2 className="size-4 animate-spin" />}
                {store.stripeAccountId ? "Continue" : "Connect"}
              </Button>
            </div>

            <div className="flex gap-3">
              <Button
                className="flex-1"
                render={<Link href="/seller/products/new" />}
              >
                Add a product <ArrowRight className="size-4" />
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                render={<Link href="/seller/dashboard" />}
              >
                Go to dashboard
              </Button>
            </div>
            <button
              type="button"
              onClick={() => router.push("/seller/dashboard")}
              className="text-muted-foreground hover:text-foreground w-full text-center text-xs"
            >
              Skip for now
            </button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
