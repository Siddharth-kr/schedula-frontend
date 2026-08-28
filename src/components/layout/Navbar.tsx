"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Navbar() {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Dashboard" },
    { href: "/doctors", label: "Find Doctors" },
  ];

  if (pathname === "/login") {
    return null;
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-[var(--line)] bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-8 lg:px-12">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="grid size-8 place-items-center rounded-lg bg-[var(--brand)] font-serif font-bold text-white">
              S
            </div>
            <span className="text-lg font-bold tracking-tight text-[var(--ink)]">Schedula</span>
          </Link>
          
          <div className="hidden space-x-6 sm:block">
            {links.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium transition-colors hover:text-[var(--brand)] ${
                    isActive ? "text-[var(--brand)]" : "text-[var(--muted)]"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link 
            href="/login" 
            className="rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--brand-deep)]"
          >
            Sign In
          </Link>
        </div>
      </div>
    </nav>
  );
}
