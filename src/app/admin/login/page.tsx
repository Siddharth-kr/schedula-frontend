"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { loginAdmin } from "@/store/slices/authSlice";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("admin@schedula.com");
  const [password, setPassword] = useState("admin123");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
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
    setErrorMsg("");
    
    setTimeout(() => {
      if (email === "admin@schedula.com" && password === "admin123") {
        dispatch(loginAdmin({
          id: "admin-1",
          email: "admin@schedula.com",
          name: "Schedula Admin",
          role: "admin"
        }));
        
        import('@/store/slices/auditSlice').then(({ addAuditLog }) => {
          dispatch(addAuditLog({
            admin: "Schedula Admin",
            action: "Admin login",
            entity: "System",
            details: "Admin successfully logged into the portal."
          }));
        });
        // Note: Using standard UI error state rather than toast for login form validation
        // but since requirement says keep toast intact if it was there, let's keep it clean
        // The prompt says: "If login fails: Show a professional inline error message."
        // So I'll show inline error.
      } else {
        setErrorMsg("Unable to sign in. Please check your email and password and try again.");
      }
      setIsLoading(false);
    }, 800);
  };

  if (!isMounted) return null;

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      
      {/* LEFT PANEL: Branding & Features (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-1/2 flex-col justify-between p-12 xl:p-16 relative overflow-hidden bg-[#F8FAFC]">
        {/* Subtle background decorations */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-100/50 blur-3xl"></div>
        <div className="absolute bottom-[20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-50/60 blur-3xl"></div>
        
        {/* Top Logo */}
        <div className={`flex items-center gap-3 transition-all duration-700 ease-out ${isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
            <span className="font-serif text-xl font-bold text-white">S</span>
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 leading-tight">Schedula</h2>
            <p className="text-sm text-slate-500 leading-tight">Admin Portal</p>
          </div>
        </div>

        {/* Main Branding Content */}
        <div className={`mt-12 z-10 transition-all duration-700 delay-150 ease-out ${isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <p className="text-xs font-bold tracking-widest text-slate-400 uppercase mb-4">
            Healthcare Made Simple
          </p>
          <h1 className="text-4xl xl:text-5xl font-extrabold text-slate-900 leading-[1.15] mb-6">
            Manage a healthier <br/>
            <span className="text-blue-600">tomorrow</span>
          </h1>
          <p className="text-base text-slate-600 mb-10 max-w-md leading-relaxed">
            Access the Schedula Admin Portal to manage doctors, patients, appointments, payments, reviews and more — all in one secure place.
          </p>

          {/* Feature Highlights */}
          <div className="space-y-6">
            
            <div className={`flex items-start gap-4 transition-all duration-700 delay-300 ease-out ${isMounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}>
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Manage Users</h3>
                <p className="text-sm text-slate-500 mt-0.5">Oversee doctors, patients and verifications</p>
              </div>
            </div>

            <div className={`flex items-start gap-4 transition-all duration-700 delay-400 ease-out ${isMounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}>
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Monitor Appointments</h3>
                <p className="text-sm text-slate-500 mt-0.5">Track and manage all scheduled appointments</p>
              </div>
            </div>

            <div className={`flex items-start gap-4 transition-all duration-700 delay-500 ease-out ${isMounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}>
              <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Payments & Reviews</h3>
                <p className="text-sm text-slate-500 mt-0.5">Handle transactions and patient feedback</p>
              </div>
            </div>

          </div>
        </div>

        {/* Footer Trust Section */}
        <div className={`mt-12 flex items-center gap-3 z-10 transition-all duration-700 delay-700 ease-out ${isMounted ? 'opacity-100' : 'opacity-0'}`}>
          <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-800">Secure • Reliable • Trusted</p>
            <p className="text-xs text-slate-500">Built for a better healthcare experience</p>
          </div>
        </div>

      </div>

      {/* RIGHT PANEL: Login Form */}
      <div className="w-full lg:w-[55%] xl:w-1/2 flex items-center justify-center bg-white p-6 sm:p-12 relative">
        
        <div className={`w-full max-w-[440px] transition-all duration-700 delay-100 ease-out ${isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
          
          {/* Mobile Logo (hidden on desktop since it's on the left) */}
          <div className="lg:hidden flex items-center gap-3 mb-10 justify-center">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-md shadow-blue-600/20">
              <span className="font-serif text-xl font-bold text-white">S</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 leading-tight">Schedula</h2>
              <p className="text-sm text-slate-500 leading-tight">Admin Portal</p>
            </div>
          </div>
          
          {/* Main Card */}
          <div className="bg-white rounded-[24px] shadow-2xl shadow-slate-200/50 border border-slate-100 p-8 sm:p-10 w-full">
            
            <div className="text-center mb-8">
              <div className="hidden lg:flex mx-auto mb-6 w-12 h-12 rounded-xl bg-blue-600 items-center justify-center shadow-md shadow-blue-600/20">
                <span className="font-serif text-2xl font-bold text-white">S</span>
              </div>
              <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Welcome Back</h1>
              <p className="text-slate-500 text-sm">Sign in to your admin account</p>
            </div>

            {errorMsg && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3">
                <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h4 className="text-sm font-semibold text-red-800">Unable to sign in</h4>
                  <p className="text-xs text-red-600 mt-1">{errorMsg}</p>
                </div>
              </div>
            )}
            
            <form onSubmit={handleLogin} className="space-y-5">
              {/* Email Field */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5" htmlFor="email">
                  Admin Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@schedula.com"
                    className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all bg-white"
                    required
                  />
                </div>
              </div>
              
              {/* Password Field */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5" htmlFor="password">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-slate-200 pl-10 pr-10 py-3 text-sm text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all bg-white"
                    required
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0l-3.59-3.59" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-1 pb-3">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    defaultChecked
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-600 cursor-pointer">
                    Remember me
                  </label>
                </div>
                {/* Omitted "Forgot password" link as per instructions to avoid fake functionality if it doesn't exist */}
              </div>
              
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 px-4 text-sm font-semibold text-white transition-all duration-200 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/20 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none disabled:hover:shadow-none"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </>
                )}
              </button>
            </form>

            <div className="relative mt-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-100"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-3 text-slate-400">OR</span>
              </div>
            </div>

            {/* Security Notice */}
            <div className="mt-8 rounded-xl bg-blue-50/50 border border-blue-100 p-4 flex items-start gap-3">
              <div className="mt-0.5">
                <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-semibold text-blue-900">Authorized Access Only</p>
                <p className="text-[11px] text-blue-700 mt-1 leading-relaxed">
                  This portal is restricted to Schedula administrators. All activities are monitored and logged.
                </p>
              </div>
            </div>

          </div>
          
          <div className="mt-8 text-center">
            <p className="text-xs text-slate-400">
              © {new Date().getFullYear()} Schedula. All rights reserved. <br/>
              <span className="text-slate-400/80">Healthcare management made simple.</span>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
