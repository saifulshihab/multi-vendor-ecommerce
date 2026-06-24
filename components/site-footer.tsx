import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t">
      <div className="text-muted-foreground mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm sm:flex-row">
        <div className="flex items-center gap-2">
          <span className="bg-primary text-primary-foreground grid size-6 place-items-center rounded text-xs font-bold">
            O
          </span>
          <span>© {new Date().getFullYear()} OpenStall</span>
        </div>
        <nav className="flex gap-6">
          <Link href="/products" className="hover:text-foreground">
            Browse
          </Link>
          <Link href="/seller/onboarding" className="hover:text-foreground">
            Sell on OpenStall
          </Link>
          <Link href="/auth/signup" className="hover:text-foreground">
            Sign up
          </Link>
        </nav>
      </div>
    </footer>
  );
}
