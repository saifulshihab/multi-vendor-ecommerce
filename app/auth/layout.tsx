import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md flex-col justify-center px-4 py-12">
      <Link
        href="/"
        className="mb-8 flex items-center justify-center gap-2 font-semibold"
      >
        <span className="bg-primary text-primary-foreground grid size-8 place-items-center rounded-md font-bold">
          O
        </span>
        OpenStall
      </Link>
      {children}
    </div>
  );
}
