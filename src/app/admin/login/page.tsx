"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { loginAdmin } from "@/store/slices/authSlice";
import { toast } from "react-toastify";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("admin@schedula.com");
  const [password, setPassword] = useState("admin123");
  const [isLoading, setIsLoading] = useState(false);
  
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { admin } = useAppSelector(state => state.auth);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && admin) {
      router.push("/admin/dashboard");
    }
  }, [admin, router, isMounted]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    setTimeout(() => {
      if (email === "admin@schedula.com" && password === "admin123") {
        dispatch(loginAdmin({
          id: "admin-1",
          email: "admin@schedula.com",
          name: "Schedula Admin",
          role: "admin"
        }));
        toast.success("Admin logged in successfully");
      } else {
        toast.error("Invalid credentials");
      }
      setIsLoading(false);
    }, 800);
  };

  if (!isMounted) return null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl border border-border">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 grid size-12 place-items-center rounded-xl bg-gradient-to-br from-stone-800 to-stone-900 shadow-lg">
             <span className="font-serif text-2xl font-bold text-white">S</span>
          </div>
          <h1 className="text-2xl font-bold text-text-primary">Admin Portal</h1>
          <p className="text-sm text-text-secondary mt-2">Sign in to manage Schedula</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-2" htmlFor="email">
              Admin Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-border px-4 py-2.5 text-text-primary focus:border-stone-800 focus:outline-none focus:ring-1 focus:ring-stone-800 transition-colors"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-2" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-border px-4 py-2.5 text-text-primary focus:border-stone-800 focus:outline-none focus:ring-1 focus:ring-stone-800 transition-colors"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-stone-900 py-3 text-sm font-bold text-white transition-colors hover:bg-stone-800 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
