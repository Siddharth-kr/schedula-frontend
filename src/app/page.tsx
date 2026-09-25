import Link from "next/link";
import { mockDoctors } from "@/lib/mock-data/doctors";
import { DoctorCard } from "@/features/doctors/components/DoctorCard";

export default function LandingPage() {
  const specialties = [
    { name: "General Medicine", icon: "🩺" },
    { name: "Cardiology", icon: "❤️" },
    { name: "Dermatology", icon: "✨" },
    { name: "Pediatrics", icon: "🧸" },
    { name: "Neurology", icon: "🧠" },
    { name: "Orthopedics", icon: "🦴" },
    { name: "Gynecology", icon: "⚕️" },
    { name: "ENT", icon: "👂" },
    { name: "Ophthalmology", icon: "👁️" }
  ];

  const featuredDoctors = mockDoctors.slice(0, 3);

  return (
    <main className="flex flex-col min-h-screen bg-[#F8FAFC]">
      
      {/* 1. HERO SECTION */}
      <section className="relative pt-12 pb-20">
        <div className="mx-auto max-w-[1440px] px-6 grid lg:grid-cols-2 gap-12 items-center">
          
          <div className="max-w-2xl">
            <span className="inline-block font-bold text-[12px] tracking-widest text-[#2563EB] mb-4 bg-blue-50 px-3 py-1.5 rounded-full uppercase">
              Your health, our priority
            </span>
            <h1 className="text-5xl lg:text-[64px] font-bold text-[#0F2747] font-serif leading-[1.05] mb-6 tracking-tight">
              Healthcare that <br/> fits your life.
            </h1>
            <p className="text-lg text-[#64748B] mb-10 max-w-[540px] leading-relaxed">
              Find trusted doctors, check real-time availability, and book appointments around your schedule.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/doctors" className="inline-flex justify-center items-center rounded-xl bg-[#2563EB] px-8 py-[18px] text-[15px] font-semibold text-white shadow-sm hover:bg-[#1d4ed8] transition-colors">
                Find a Doctor
              </Link>
              <Link href="/doctors" className="inline-flex justify-center items-center rounded-xl border border-[#E2E8F0] bg-white px-8 py-[18px] text-[15px] font-semibold text-[#0F2747] shadow-sm hover:bg-slate-50 transition-colors">
                Book an Appointment
              </Link>
            </div>
          </div>
          
          <div className="relative w-full flex justify-center lg:justify-end">
            <div className="relative w-full max-w-[560px] aspect-[4/3] lg:aspect-auto lg:h-[520px] rounded-[32px] overflow-hidden bg-slate-100">
              <img 
                src="/hero-doctor.png" 
                alt="Professional Doctor"
                className="absolute inset-0 w-full h-full object-cover object-top"
              />
            </div>
            {/* Floating Card */}
            <div className="absolute top-12 -left-4 sm:-left-8 bg-white rounded-2xl p-4 shadow-xl border border-[#E2E8F0] flex items-center gap-4">
              <div className="size-12 rounded-xl bg-emerald-50 flex items-center justify-center text-[#059669]">
                <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </div>
              <div>
                <p className="text-[14px] font-bold text-[#0F2747]">Available Today</p>
                <p className="text-[13px] text-[#64748B]">3 slots remaining</p>
              </div>
            </div>
            
            {/* Trusted Specialists Badge */}
             <div className="absolute bottom-12 -right-4 sm:-right-8 bg-white rounded-2xl p-4 shadow-xl border border-[#E2E8F0] flex items-center gap-3">
              <div className="size-10 rounded-full bg-emerald-50 flex items-center justify-center text-[#059669]">
                <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <p className="text-[14px] font-bold text-[#0F2747] leading-tight">Trusted<br/>Specialists</p>
            </div>
          </div>

        </div>
      </section>

      {/* 2. SEARCH SECTION */}
      <section className="relative z-20 px-6 -mt-10">
        <div className="mx-auto max-w-[1440px]">
          <div className="bg-white rounded-[16px] shadow-lg border border-[#E2E8F0] p-3 flex flex-col md:flex-row gap-3 md:items-center h-auto md:h-[80px]">
            <div className="relative flex-1 h-full flex items-center">
              <div className="pl-5 flex items-center pointer-events-none text-[#64748B]">
                <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
              <input 
                type="text" 
                placeholder="Search doctors, specialties, or conditions..." 
                className="w-full pl-3 pr-4 py-3 bg-transparent text-[15px] font-medium text-[#0F2747] focus:outline-none placeholder:text-[#64748B]"
              />
            </div>
            <div className="hidden md:block w-px h-10 bg-[#E2E8F0]"></div>
            <div className="relative w-full md:w-[240px] h-full flex items-center">
               <div className="pl-4 flex items-center pointer-events-none text-[#DC2626]">
                <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </div>
              <select className="w-full pl-2 pr-8 py-3 bg-transparent text-[15px] font-medium text-[#0F2747] focus:outline-none appearance-none cursor-pointer">
                 <option>All Locations</option>
              </select>
               <div className="absolute right-4 pointer-events-none text-[#64748B]">
                <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
            <Link href="/doctors" className="flex items-center justify-center bg-[#2563EB] text-white font-semibold text-[15px] h-full rounded-xl px-10 hover:bg-[#1d4ed8] transition-colors shrink-0 py-4 md:py-0">
              Search
            </Link>
          </div>
        </div>
      </section>

      {/* 3. SPECIALTIES */}
      <section className="px-6 py-12 lg:py-16 bg-[#F8FAFC]">
        <div className="mx-auto max-w-[1440px]">
          <div className="flex overflow-x-auto pb-4 gap-4 hide-scrollbar snap-x">
            {specialties.map((specialty, idx) => (
              <Link 
                key={idx}
                href="/doctors" 
                className="shrink-0 snap-start flex items-center gap-3 bg-white px-5 py-4 rounded-[14px] border border-[#E2E8F0] hover:border-[#2563EB] hover:shadow-sm transition-all group"
              >
                <div className="size-10 rounded-full bg-blue-50 flex items-center justify-center text-xl group-hover:bg-[#2563EB] group-hover:text-white transition-colors duration-300">
                  {specialty.icon}
                </div>
                <span className="font-semibold text-[#0F2747] text-[15px]">{specialty.name}</span>
              </Link>
            ))}
             <Link 
                href="/doctors" 
                className="shrink-0 snap-start flex items-center gap-3 bg-white px-6 py-4 rounded-[14px] border border-[#E2E8F0] hover:bg-slate-50 transition-all text-[#0F2747] font-semibold text-[15px]"
              >
                <div className="size-6 rounded-full bg-slate-100 flex items-center justify-center border border-[#E2E8F0]">
                  <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                </div>
                View All
              </Link>
          </div>
        </div>
      </section>

      {/* 4. TRUSTED SPECIALISTS */}
      <section className="px-6 py-16 lg:py-20 bg-white border-t border-[#E2E8F0]">
        <div className="mx-auto max-w-[1440px]">
          <div className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h2 className="text-[32px] font-bold text-[#0F2747] font-serif mb-2 leading-tight">Meet trusted specialists</h2>
              <p className="text-[16px] text-[#64748B]">Experienced professionals, available when you need them.</p>
            </div>
            <Link href="/doctors" className="flex items-center gap-1 text-[15px] font-semibold text-[#2563EB] hover:text-[#1d4ed8] transition-colors whitespace-nowrap">
              View All Doctors <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </Link>
          </div>
          
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {featuredDoctors.map((doctor) => (
              <DoctorCard key={doctor.id} doctor={doctor} />
            ))}
          </div>
        </div>
      </section>

      {/* 5. CARE SHOULD BE EASIER */}
      <section className="px-6 py-16 lg:py-24 bg-[#F8FAFC] border-t border-[#E2E8F0]">
        <div className="mx-auto max-w-[1440px]">
          <div className="mb-16">
            <h2 className="text-[36px] font-bold text-[#0F2747] font-serif tracking-tight">Care should be easier.</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16">
            <div className="flex flex-col">
              <div className="flex items-center gap-4 mb-5">
                <div className="size-12 rounded-full bg-blue-100 text-[#2563EB] flex items-center justify-center font-bold text-[15px]">01</div>
                <div className="size-12 rounded-full bg-white border border-[#E2E8F0] shadow-sm flex items-center justify-center text-[#2563EB]">
                  <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
              </div>
              <h3 className="text-[20px] font-bold text-[#0F2747] mb-3">Find the right doctor</h3>
              <p className="text-[15px] text-[#64748B] leading-relaxed">Search our network by name or specialty to find the healthcare provider perfectly suited for your specific needs.</p>
            </div>
            
            <div className="flex flex-col">
              <div className="flex items-center gap-4 mb-5">
                <div className="size-12 rounded-full bg-blue-100 text-[#2563EB] flex items-center justify-center font-bold text-[15px]">02</div>
                <div className="size-12 rounded-full bg-white border border-[#E2E8F0] shadow-sm flex items-center justify-center text-[#2563EB]">
                  <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </div>
              </div>
              <h3 className="text-[20px] font-bold text-[#0F2747] mb-3">Choose a time that works</h3>
              <p className="text-[15px] text-[#64748B] leading-relaxed">View real-time availability and select an appointment slot that fits seamlessly into your busy schedule.</p>
            </div>
            
            <div className="flex flex-col">
               <div className="flex items-center gap-4 mb-5">
                <div className="size-12 rounded-full bg-blue-100 text-[#2563EB] flex items-center justify-center font-bold text-[15px]">03</div>
                <div className="size-12 rounded-full bg-white border border-[#E2E8F0] shadow-sm flex items-center justify-center text-[#2563EB]">
                  <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                </div>
              </div>
              <h3 className="text-[20px] font-bold text-[#0F2747] mb-3">Stay in control</h3>
              <p className="text-[15px] text-[#64748B] leading-relaxed">Manage, track, and modify your upcoming appointments easily through a secure online platform.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. DESIGNED AROUND YOUR CARE */}
      <section className="px-6 py-16 lg:py-20 bg-white border-t border-[#E2E8F0]">
        <div className="mx-auto max-w-[1440px]">
          <h2 className="text-[28px] font-bold text-[#0F2747] font-serif mb-10">Designed around your care.</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="pt-6 border-t-2 border-blue-100">
              <h4 className="font-bold text-[#0F2747] text-[16px] mb-2">Secure management</h4>
              <p className="text-[14px] text-[#64748B] leading-relaxed">Your appointment history is safely stored.</p>
            </div>
            <div className="pt-6 border-t-2 border-emerald-100">
              <h4 className="font-bold text-[#0F2747] text-[16px] mb-2">Real-time availability</h4>
              <p className="text-[14px] text-[#64748B] leading-relaxed">No double-bookings. Always accurate.</p>
            </div>
            <div className="pt-6 border-t-2 border-amber-100">
              <h4 className="font-bold text-[#0F2747] text-[16px] mb-2">Transparent profiles</h4>
              <p className="text-[14px] text-[#64748B] leading-relaxed">Clear qualifications and verified reviews.</p>
            </div>
            <div className="pt-6 border-t-2 border-purple-100">
              <h4 className="font-bold text-[#0F2747] text-[16px] mb-2">Easy tracking</h4>
              <p className="text-[14px] text-[#64748B] leading-relaxed">Monitor upcoming and past visits.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. CTA SECTION */}
      <section className="px-6 py-12 lg:py-16 bg-white">
        <div className="mx-auto max-w-[1440px]">
          <div className="rounded-[24px] bg-gradient-to-r from-[#0F2747] to-[#163A5F] px-8 py-12 md:py-16 text-center shadow-lg flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-left max-w-xl">
              <h2 className="text-[32px] md:text-[36px] font-bold text-white font-serif mb-4 leading-tight">Ready to find the right doctor?</h2>
              <p className="text-[16px] text-blue-100 leading-relaxed mb-6">Browse trusted specialists and book a time that works for you.</p>
              <div className="flex flex-wrap gap-6 text-[14px] font-medium text-blue-200">
                <div className="flex items-center gap-2"><svg className="size-5 text-[#38BDF8]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> Verified Doctors</div>
                <div className="flex items-center gap-2"><svg className="size-5 text-[#38BDF8]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg> Secure Booking</div>
                <div className="flex items-center gap-2"><svg className="size-5 text-[#38BDF8]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg> 24/7 Support</div>
              </div>
            </div>
            
            <div className="shrink-0">
              <Link href="/doctors" className="inline-flex justify-center items-center rounded-xl bg-white px-8 py-4 text-[16px] font-bold text-[#0F2747] shadow-sm transition-all hover:bg-blue-50 active:scale-[0.98]">
                Find a Doctor <svg className="size-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 8. FOOTER */}
      <footer className="bg-white border-t border-[#E2E8F0] pt-16 pb-8 px-6">
        <div className="mx-auto max-w-[1440px]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
            <div className="lg:col-span-2 lg:pr-12">
              <Link href="/" className="flex items-center gap-2.5 mb-6">
                <div className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-[#2563EB] to-[#1d4ed8] font-serif text-lg font-bold text-white shadow-sm">
                  S
                </div>
                <span className="text-[21px] font-bold tracking-tight text-[#0F2747]">Schedula</span>
              </Link>
              <p className="text-[#64748B] text-[14px] leading-relaxed">
                A professional healthcare appointment scheduling platform connecting patients with trusted medical experts.
              </p>
            </div>
            
            <div>
              <h3 className="font-bold text-[#0F2747] mb-5 text-[13px] uppercase tracking-wider">Patient</h3>
              <ul className="space-y-4 text-[14px]">
                <li><Link href="/" className="text-[#64748B] hover:text-[#2563EB] font-medium transition-colors">Home</Link></li>
                <li><Link href="/doctors" className="text-[#64748B] hover:text-[#2563EB] font-medium transition-colors">Find a Doctor</Link></li>
                <li><Link href="/appointments" className="text-[#64748B] hover:text-[#2563EB] font-medium transition-colors">Appointments</Link></li>
                <li><Link href="/prescriptions" className="text-[#64748B] hover:text-[#2563EB] font-medium transition-colors">Prescriptions</Link></li>
                <li><Link href="/profile" className="text-[#64748B] hover:text-[#2563EB] font-medium transition-colors">Profile</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-bold text-[#0F2747] mb-5 text-[13px] uppercase tracking-wider">Doctor</h3>
              <ul className="space-y-4 text-[14px]">
                <li><Link href="/doctor/login" className="text-[#64748B] hover:text-[#2563EB] font-medium transition-colors">Doctor Login</Link></li>
                <li><Link href="/doctor/register" className="text-[#64748B] hover:text-[#2563EB] font-medium transition-colors">Doctor Registration</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-[#0F2747] mb-5 text-[13px] uppercase tracking-wider">Support</h3>
              <ul className="space-y-4 text-[14px]">
                <li><Link href="#" className="text-[#64748B] hover:text-[#2563EB] font-medium transition-colors">Help Center</Link></li>
                <li><Link href="#" className="text-[#64748B] hover:text-[#2563EB] font-medium transition-colors">Privacy Policy</Link></li>
                <li><Link href="#" className="text-[#64748B] hover:text-[#2563EB] font-medium transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-[#E2E8F0] flex flex-col md:flex-row justify-between items-center gap-4 text-[13px] text-[#64748B] font-medium">
            <p>&copy; {new Date().getFullYear()} Schedula. All rights reserved.</p>
            <div className="flex gap-4">
              <Link href="#" className="hover:text-[#0F2747] transition-colors"><svg className="size-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg></Link>
              <Link href="#" className="hover:text-[#0F2747] transition-colors"><svg className="size-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm3 8h-1.35c-.538 0-.65.221-.65.778v1.222h2l-.209 2h-1.791v7h-3v-7h-2v-2h2v-2.308c0-1.769.931-2.692 3.029-2.692h1.971v3z"/></svg></Link>
              <Link href="#" className="hover:text-[#0F2747] transition-colors"><svg className="size-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg></Link>
            </div>
          </div>
        </div>
      </footer>

      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </main>
  );
}
