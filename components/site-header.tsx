"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search, Store, LayoutDashboard, Package, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CartSheet } from "@/components/cart-sheet";
import { useAuth } from "@/lib/auth-context";
import { initials } from "@/lib/format";

export function SiteHeader() {
  const { user, status, logout } = useAuth();
  const router = useRouter();
  const [q, setQ] = useState("");

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = q.trim();
    router.push(trimmed ? `/products?q=${encodeURIComponent(trimmed)}` : "/products");
  }

  return (
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="bg-primary text-primary-foreground grid size-7 place-items-center rounded-md text-sm font-bold">
            O
          </span>
          <span className="hidden sm:inline">OpenStall</span>
        </Link>

        <form onSubmit={onSearch} className="relative mx-2 hidden flex-1 md:block">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search products…"
            className="pl-9"
          />
        </form>

        <nav className="flex items-center gap-1">
          <Button
            variant="ghost"
            className="hidden sm:inline-flex"
            render={<Link href="/products" />}
          >
            Browse
          </Button>
          <CartSheet />

          {status === "loading" ? (
            <div className="bg-muted size-9 animate-pulse rounded-full" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="ghost" size="icon" className="rounded-full" />
                }
              >
                <Avatar className="size-8">
                  <AvatarFallback className="text-xs">
                    {initials(user.name || user.email)}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="flex flex-col">
                    <span className="truncate">{user.name}</span>
                    <span className="text-muted-foreground truncate text-xs font-normal">
                      {user.email}
                    </span>
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem render={<Link href="/buyer/orders" />}>
                  <Package className="size-4" /> My orders
                </DropdownMenuItem>
                {user.role === "SELLER" && (
                  <DropdownMenuItem render={<Link href="/seller/dashboard" />}>
                    <Store className="size-4" /> Seller dashboard
                  </DropdownMenuItem>
                )}
                {user.role === "ADMIN" && (
                  <DropdownMenuItem render={<Link href="/admin/dashboard" />}>
                    <LayoutDashboard className="size-4" /> Admin
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => logout()}>
                  <LogOut className="size-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-1">
              <Button variant="ghost" render={<Link href="/auth/login" />}>
                <User className="size-4 sm:hidden" />
                <span className="hidden sm:inline">Log in</span>
              </Button>
              <Button
                className="hidden sm:inline-flex"
                render={<Link href="/auth/signup" />}
              >
                Sign up
              </Button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
