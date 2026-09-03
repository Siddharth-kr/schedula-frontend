"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function DoctorSidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { 
      label: "Dashboard", 
      href: "/doctor/dashboard", 
      // Home
      icon: <path strokeLinecap="round" strokeLinejoin="round" d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
    },
    { 
      label: "Appointments", 
      href: "/doctor/appointments", 
      // CalendarDays
      icon: <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    },
    { 
      label: "Availability", 
      href: "/doctor/availability", 
      // Clock
      icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    },
    { 
      label: "Profile", 
      href: "/doctor/profile", 
      // UserRound
      icon: <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    },
  ];

  return (
    <>
      {/* Mobile Toggle Button (Visible only on lg and below) */}
      <button 
        className="xl:hidden fixed bottom-6 right-6 z-50 p-3 bg-primary text-white rounded-full shadow-lg"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle Sidebar"
      >
        <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
        </svg>
      </button>

      {/* Backdrop for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 xl:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed xl:sticky top-16 xl:top-0 h-[calc(100vh-4rem)] xl:h-auto xl:min-h-[calc(100vh-4rem)] z-40
        w-[240px] bg-white border-r border-[#E2E8F0] shrink-0
        flex flex-col
        transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full xl:translate-x-0"}
      `}>
        
        {/* Branding / Logo */}
        <div className="h-20 flex flex-col justify-center px-5 border-b border-[#E2E8F0] shrink-0">
          <Link href="/doctor/dashboard" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary text-white font-serif font-bold flex items-center justify-center shadow-sm shrink-0">
              S
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-sm text-[#1E293B] leading-tight">
                Schedula
              </span>
              <span className="text-[11px] font-medium text-[#64748B] uppercase tracking-wider">
                For Providers
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`
                  relative flex items-center gap-3 px-3 h-[42px] rounded-[8px] text-sm font-semibold transition-colors
                  ${isActive 
                    ? "bg-[#F1F5FF] text-[#2D6CDF]" 
                    : "text-[#64748B] hover:bg-[#F1F5FF] hover:text-[#1E293B]"
                  }
                `}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[#2D6CDF] rounded-r-full" />
                )}
                <svg 
                  className={`shrink-0 ${isActive ? "text-[#2D6CDF]" : "text-[#94A3B8]"}`} 
                  width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                >
                  {item.icon}
                </svg>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
