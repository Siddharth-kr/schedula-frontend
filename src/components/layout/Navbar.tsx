"use client";
import { logoutPatient, logoutDoctor } from "@/store/slices/authSlice";
import { useAppSelector, useAppDispatch } from "@/store/hooks";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { NotificationBell } from "./NotificationBell";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { patient, doctor } = useAppSelector(state => state.auth);
  const dispatch = useAppDispatch();
  const [isMounted, setIsMounted] = useState(false);
  
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setIsMounted(true), []);

  const isDoctorRoute = pathname === "/doctor" || pathname.startsWith("/doctor/");
  
  const role: "public" | "patient" | "doctor" = isDoctorRoute
    ? (doctor ? "doctor" : "public")
    : (patient ? "patient" : (doctor ? "doctor" : "public"));
    
  const userId = role === "patient" ? patient?.name : (role === "doctor" ? doctor?.name : null);

  // Close mobile menu on route change
  useEffect(() => {
    Promise.resolve().then(() => {
      setIsMobileMenuOpen(false);
    });
  }, [pathname]);

  if (!isMounted) return null;
  if (pathname.startsWith("/admin")) return null;

  // Hide navbar on auth screens if desired, but prompt says "provide simple link back to Schedula"
  // so we should probably show it, or a simplified version. For now, keep it on.
  if (pathname === "/login" || pathname === "/register" || pathname === "/doctor/login" || pathname === "/doctor/register") {
    // Return simplified navbar for auth pages
    return (
      <nav className="sticky top-0 z-50 w-full border-b border-[#E2E8F0] bg-white">
        <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-center px-4 sm:px-8 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
            <div className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-[#2563EB] to-[#1d4ed8] font-serif text-lg font-bold text-white shadow-sm">
              S
            </div>
            <span className="text-[21px] font-bold tracking-tight text-[#0F2747]">Schedula</span>
          </Link>
        </div>
      </nav>
    );
  }

  const doctorLinks = [
    { href: "/doctor/dashboard", label: "Dashboard" },
    { href: "/doctor/appointments", label: "Appointments" },
    { href: "/doctor/revenue", label: "Revenue" },
    { href: "/doctor/rating-analyzer", label: "Rating Analyzer" },
    { href: "/doctor/profile", label: "Profile" },
  ];

  const patientLinks = [
    { href: "/", label: "Home" },
    { href: "/doctors", label: "Find a Doctor" },
    ...(role === "patient" ? [
      { href: "/appointments", label: "Appointments" },
      { href: "/prescriptions", label: "Prescriptions" },
      { href: "/profile", label: "Profile" }
    ] : []),
  ];

  const currentLinks = role === "doctor" ? doctorLinks : patientLinks;

  const handleLogout = () => {
    if (role === "doctor") {
      dispatch(logoutDoctor());
      dispatch(logoutPatient()); // Just in case, clean everything
      router.push("/doctor/login");
    } else {
      dispatch(logoutPatient());
      dispatch(logoutDoctor());
      router.push("/");
    }
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-[#E2E8F0] bg-white">
      {role === "doctor" ? (
        /* ========== DOCTOR / PROVIDER NAVBAR — CSS GRID ========== */
        <div className="mx-auto h-[72px] max-w-[1440px] px-4 sm:px-6 lg:px-8 hidden md:grid grid-cols-[auto_1fr_auto] items-center">
          
          {/* LEFT: Brand */}
          <Link href="/doctor/dashboard" className="flex items-center gap-2.5 shrink-0 transition-opacity hover:opacity-90 justify-self-start">
            <div className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-[#2563EB] to-[#1d4ed8] font-serif text-lg font-bold text-white shadow-sm">
              S
            </div>
            <span className="text-[21px] font-bold tracking-tight text-[#0F2747]">
              Schedula for Providers
            </span>
          </Link>

          {/* CENTER: Navigation */}
          <div className="flex items-center justify-center gap-[6px]">
            {currentLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative px-[10px] py-2 text-[13.5px] font-semibold transition-colors duration-150 rounded-lg ${
                    isActive 
                      ? "text-[#2563EB]" 
                      : "text-[#64748B] hover:text-[#0F2747] hover:bg-slate-50"
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <span className="absolute bottom-[-21px] left-2 right-2 h-[2px] bg-[#2563EB] rounded-full" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* RIGHT: Actions */}
          <div className="flex items-center gap-1 justify-self-end">
            {userId && (
              <>
                <NotificationBell userId={userId} />
                <div className="w-px h-5 bg-[#E2E8F0] mx-2" />
              </>
            )}
            <button 
              onClick={handleLogout}
              className="px-3 py-2 text-[13px] font-medium text-[#64748B] hover:text-[#DC2626] transition-colors duration-150"
            >
              Sign out
            </button>
          </div>
        </div>
      ) : (
        /* ========== PATIENT / PUBLIC NAVBAR — CSS GRID ========== */
        <div className="mx-auto h-[72px] max-w-[1440px] px-4 sm:px-6 lg:px-8 hidden md:grid grid-cols-[auto_1fr_auto] items-center">
          
          {/* LEFT: Brand */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0 transition-opacity hover:opacity-90 justify-self-start">
            <div className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-[#2563EB] to-[#1d4ed8] font-serif text-lg font-bold text-white shadow-sm">
              S
            </div>
            <span className="text-[21px] font-bold tracking-tight text-[#0F2747]">Schedula</span>
          </Link>

          {/* CENTER: Navigation */}
          <div className="flex items-center justify-center gap-[6px]">
            {currentLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative px-[10px] py-2 text-[14px] font-medium transition-colors duration-150 rounded-lg ${
                    isActive 
                      ? "text-[#2563EB] font-semibold" 
                      : "text-[#64748B] hover:text-[#0F2747] hover:bg-slate-50"
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <span className="absolute bottom-[-21px] left-2 right-2 h-[2px] bg-[#2563EB] rounded-full" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* RIGHT: Actions */}
          <div className="flex items-center gap-1 justify-self-end">
            {userId && (
              <>
                <NotificationBell userId={userId} />
                <div className="w-px h-5 bg-[#E2E8F0] mx-2" />
              </>
            )}

            {role === "public" && (
              <Link href="/login" className="px-3 py-2 text-[14px] font-medium text-[#0F2747] hover:text-[#2563EB] transition-colors duration-150">
                Login
              </Link>
            )}
            
            <Link 
              href="/doctors" 
              className="rounded-[10px] bg-[#2563EB] px-5 py-[9px] text-[13px] font-semibold text-white shadow-sm transition-all duration-150 hover:bg-[#1d4ed8] hover:shadow active:scale-[0.98]"
            >
              Book Appointment
            </Link>

            {role !== "public" && (
              <>
                <div className="w-px h-5 bg-[#E2E8F0] mx-2" />
                <button 
                  onClick={handleLogout}
                  className="px-3 py-2 text-[13px] font-medium text-[#64748B] hover:text-[#DC2626] transition-colors duration-150"
                >
                  Sign out
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* MOBILE BAR — shared for both doctor and patient */}
      <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between px-4 sm:px-6 md:hidden">
        <Link href={role === "doctor" ? "/doctor/dashboard" : "/"} className="flex items-center gap-2.5 shrink-0 transition-opacity hover:opacity-90">
          <div className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-[#2563EB] to-[#1d4ed8] font-serif text-lg font-bold text-white shadow-sm">
            S
          </div>
          <span className="text-[21px] font-bold tracking-tight text-[#0F2747]">
            {role === "doctor" ? "Schedula for Providers" : "Schedula"}
          </span>
        </Link>
        <div className="flex items-center gap-3">
          {userId && <NotificationBell userId={userId} />}
          <button 
            className="p-2 text-[#0F2747] hover:text-[#2563EB] transition-colors duration-150 rounded-lg border border-[#E2E8F0] bg-white"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-[#E2E8F0] bg-white absolute w-full shadow-lg">
          <div className="flex flex-col px-5 py-4 space-y-1 max-w-[1440px] mx-auto">
            {currentLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-[15px] font-medium px-3 py-2.5 rounded-lg transition-colors duration-150 ${
                    isActive ? "text-[#2563EB] bg-blue-50" : "text-[#0F2747] hover:bg-slate-50"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
            
            <hr className="border-[#E2E8F0] my-2" />
              
              {role === "public" && (
                <div className="flex flex-col gap-3">
                  <Link href="/login" className="w-full rounded-[10px] border border-[#E2E8F0] px-4 py-2.5 text-center text-sm font-semibold text-[#0F2747] shadow-sm">
                    Patient Login
                  </Link>
                  <Link href="/doctor/login" className="w-full text-center text-sm font-medium text-[#64748B] py-2">
                    Are you a doctor?
                  </Link>
                </div>
              )}
              
              {role !== "doctor" && (
                <Link href="/doctors" className="w-full rounded-[10px] bg-[#2563EB] px-4 py-2.5 text-center text-sm font-semibold text-white shadow-sm mt-1">
                  Book Appointment
                </Link>
              )}

              {role !== "public" && (
                <button 
                  onClick={handleLogout}
                  className="w-full rounded-[10px] border border-[#E2E8F0] px-4 py-2.5 text-center text-sm font-semibold text-[#DC2626] shadow-sm mt-1"
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
