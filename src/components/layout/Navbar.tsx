"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getDoctorSession, clearDoctorSession } from "@/lib/availability-store";
import { NotificationBell } from "./NotificationBell";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [role, setRole] = useState<"public" | "patient" | "doctor">("public");
  const [userId, setUserId] = useState<string | null>(null);

  // Re-evaluate session whenever pathname changes (cheap and effective for mock frontend auth)
  useEffect(() => {
    Promise.resolve().then(() => {
      const doctorSession = getDoctorSession();
      if (doctorSession) {
        setRole("doctor");
        setUserId(doctorSession.name);
        return;
      }

      try {
        const patientSession = localStorage.getItem("mock_user");
        if (patientSession) {
          setRole("patient");
          setUserId(JSON.parse(patientSession).name);
          return;
        }
      } catch {}

      setRole("public");
      setUserId(null);
    });
  }, [pathname]);

  // Close mobile menu on route change
  useEffect(() => {
    Promise.resolve().then(() => {
      setIsMobileMenuOpen(false);
    });
  }, [pathname]);

  // Hide navbar on auth screens if desired, but prompt says "provide simple link back to Schedula"
  // so we should probably show it, or a simplified version. For now, keep it on.
  if (pathname === "/login" || pathname === "/register" || pathname === "/doctor/login" || pathname === "/doctor/register") {
    // Return simplified navbar for auth pages
    return (
      <nav className="sticky top-0 z-50 w-full border-b border-border bg-white/85 backdrop-blur-md shadow-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-center px-4 sm:px-8 lg:px-12">
          <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
            <div className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-primary to-primary-dark font-serif text-lg font-bold text-white shadow-sm ring-1 ring-[var(--color-primary-dark)]/20">
              S
            </div>
            <span className="text-xl font-bold tracking-tight text-text-primary">Schedula</span>
          </Link>
        </div>
      </nav>
    );
  }

  const doctorLinks = [
    { href: "/doctor/dashboard", label: "Dashboard" },
    { href: "/doctor/appointments", label: "Appointments" },
    { href: "/doctor/availability", label: "Availability" },
    { href: "/doctor/profile", label: "Profile" },
  ];

  const patientLinks = [
    { href: "/", label: "Home" },
    { href: "/doctors", label: "Find Doctors" },
    ...(role === "patient" ? [
      { href: "/appointments", label: "Appointments" },
      { href: "/profile", label: "Profile" }
    ] : []),
  ];

  const currentLinks = role === "doctor" ? doctorLinks : patientLinks;

  const handleLogout = () => {
    if (role === "doctor") {
      clearDoctorSession();
      localStorage.removeItem("mock_user");
      router.push("/doctor/login");
    } else {
      localStorage.removeItem("mock_user");
      clearDoctorSession();
      router.push("/");
    }
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Left side: Logo & Desktop Links */}
        <div className="flex items-center gap-6">
          <Link href={role === "doctor" ? "/doctor/dashboard" : "/"} className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
            <div className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-primary to-primary-dark font-serif text-lg font-bold text-white shadow-sm ring-1 ring-[var(--color-primary-dark)]/20">
              S
            </div>
            <span className="text-xl font-bold tracking-tight text-text-primary">
              {role === "doctor" ? "Schedula for Providers" : "Schedula"}
            </span>
          </Link>
          
          <div className="hidden space-x-4 md:block">
            {currentLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    isActive ? "text-primary border-b-2 border-primary pb-1" : "text-text-secondary"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Right side: Auth Actions & Mobile Toggle */}
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-4">
            {userId && <NotificationBell userId={userId} />}
            {role === "public" && (
              <Link href="/login" className="text-sm font-semibold text-text-primary hover:text-primary">
                Login
              </Link>
            )}
            
            {role !== "doctor" && (
              <Link 
                href="/doctors" 
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-dark hover:shadow active:scale-[0.98]"
              >
                Book Appointment
              </Link>
            )}

            {role !== "public" && (
              <button 
                onClick={handleLogout}
                className="text-sm font-medium text-text-secondary hover:text-error transition-colors"
              >
                Sign out
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-3 md:hidden">
            {userId && <NotificationBell userId={userId} />}
            <button 
              className="p-2 text-text-primary hover:text-primary transition-colors rounded-lg bg-background border border-border"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
            >
            {isMobileMenuOpen ? (
              <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-white absolute w-full shadow-lg">
          <div className="flex flex-col px-4 py-4 space-y-4">
            {currentLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-base font-medium px-2 py-1 rounded-md ${
                    isActive ? "text-primary bg-stone-50" : "text-text-primary"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
            
            <hr className="border-border" />
              
              {role === "public" && (
                <div className="flex flex-col gap-3">
                  <Link href="/login" className="w-full rounded-lg border border-border px-4 py-2.5 text-center text-sm font-semibold text-text-primary shadow-sm">
                    Patient Login
                  </Link>
                  <Link href="/doctor/login" className="w-full text-center text-sm font-medium text-text-secondary py-2">
                    Are you a doctor?
                  </Link>
                </div>
              )}
              
              {role !== "doctor" && (
                <Link href="/doctors" className="w-full rounded-lg bg-primary px-4 py-2.5 text-center text-sm font-semibold text-white shadow-sm mt-3">
                  Book Appointment
                </Link>
              )}

              {role !== "public" && (
                <button 
                  onClick={handleLogout}
                  className="w-full rounded-lg border border-border px-4 py-2 text-center text-sm font-semibold text-error shadow-sm mt-3"
                >
                  Sign out
                </button>
              )}
            </div>
          </div>
        )}
    </nav>
  );
}
