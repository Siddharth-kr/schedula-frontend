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
    <main className="flex flex-col min-h-screen bg-background">
      
      {/* 1. HERO SECTION */}
      <section className="relative bg-background overflow-hidden px-4 sm:px-6 lg:px-8 pt-16 lg:pt-24 pb-32">
        <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-white to-transparent pointer-events-none"></div>
        <div className="mx-auto max-w-7xl grid lg:grid-cols-2 gap-12 lg:gap-8 items-center relative z-10">
          
          <div className="max-w-2xl">
            <span className="inline-block font-bold uppercase tracking-widest text-xs text-primary mb-6">
              Your health, our priority
            </span>
            <h1 className="text-5xl sm:text-6xl lg:text-[4.5rem] font-medium tracking-tight text-text-primary font-serif mb-6 leading-[1.1]">
              Healthcare that fits<br />your life.
            </h1>
            <p className="text-lg sm:text-xl text-text-secondary mb-10 max-w-xl leading-relaxed">
              Find trusted doctors, check real-time availability, and book appointments around your schedule.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Link href="/doctors" className="inline-flex justify-center items-center rounded-xl bg-primary px-8 py-4 text-base font-bold text-white shadow-sm transition-all hover:bg-primary-dark active:scale-[0.98]">
                Find a Doctor
              </Link>
              <Link href="/doctors" className="inline-flex justify-center items-center rounded-xl border border-border bg-white px-8 py-4 text-base font-bold text-text-primary shadow-sm transition-all hover:border-primary/50 hover:bg-stone-50 active:scale-[0.98]">
                Book an Appointment
              </Link>
            </div>
            
            <div className="flex flex-col sm:flex-row flex-wrap gap-x-8 gap-y-3 text-sm font-medium text-text-secondary">
              <div className="flex items-center gap-2">
                <svg className="size-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                Real-time availability
              </div>
              <div className="flex items-center gap-2">
                <svg className="size-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                Trusted specialists
              </div>
              <div className="flex items-center gap-2">
                <svg className="size-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                Simple online booking
              </div>
            </div>
          </div>
          
          <div className="relative w-full flex justify-center lg:justify-end">
            <div className="relative w-full max-w-[480px] aspect-[4/5] rounded-[2rem] bg-primary/5 overflow-hidden border border-border/50">
              <img 
                src="/hero-doctor.png" 
                alt="Professional Doctor"
                className="absolute inset-0 w-full h-full object-cover object-[center_top]"
              />
            </div>
            {/* Floating UI Elements */}
            <div className="absolute top-1/4 -left-6 sm:-left-12 bg-white/90 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-border flex items-center gap-4">
              <div className="size-12 rounded-full bg-success/10 flex items-center justify-center text-success">
                <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </div>
              <div>
                <p className="text-sm font-bold text-text-primary">Available Today</p>
                <p className="text-xs text-text-secondary">3 slots remaining</p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 2. SEARCH EXPERIENCE */}
      <section className="relative z-20 px-4 sm:px-6 lg:px-8 -mt-20">
        <div className="mx-auto max-w-5xl bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-border p-4 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <span className="text-xl">🔍</span>
            </div>
            <input 
              type="text" 
              suppressHydrationWarning
              placeholder="Search doctors, specialties, or conditions..." 
              className="w-full pl-12 pr-4 py-4 bg-transparent text-base focus:outline-none placeholder:text-text-secondary font-medium"
            />
          </div>
          <div className="hidden md:block w-px bg-border my-2"></div>
          <div className="relative w-full md:w-64 opacity-60">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <span className="text-xl">📍</span>
            </div>
            <input 
              type="text" 
              suppressHydrationWarning
              placeholder="All Locations" 
              disabled
              className="w-full pl-12 pr-4 py-4 bg-transparent text-base cursor-not-allowed font-medium"
            />
          </div>
          <Link href="/doctors" className="flex items-center justify-center bg-primary text-white font-bold py-4 px-8 rounded-xl hover:bg-primary-dark transition-colors shrink-0">
            Search
          </Link>
        </div>
      </section>

      {/* 3. SPECIALTIES */}
      <section className="px-4 sm:px-6 lg:px-8 py-20 lg:py-28 bg-background">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12">
            <h2 className="text-3xl font-medium text-text-primary font-serif mb-3">Find care for what you need</h2>
            <p className="text-text-secondary text-lg">Browse specialists by area of care.</p>
          </div>
          
          <div className="flex overflow-x-auto pb-6 -mx-4 px-4 sm:mx-0 sm:px-0 gap-4 sm:gap-6 snap-x hide-scrollbar">
            {specialties.map((specialty, idx) => (
              <Link 
                key={idx}
                href="/doctors" 
                className="shrink-0 snap-start w-[280px] sm:w-[240px] flex items-center gap-4 bg-white p-5 rounded-2xl border border-border hover:border-primary/40 hover:shadow-md transition-all group"
              >
                <div className="size-12 rounded-xl bg-primary/5 flex items-center justify-center text-2xl group-hover:bg-primary/10 transition-colors">
                  {specialty.icon}
                </div>
                <span className="font-semibold text-text-primary text-base group-hover:text-primary transition-colors">{specialty.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 4. FEATURED DOCTORS */}
      <section className="px-4 sm:px-6 lg:px-8 py-20 lg:py-28 bg-white border-t border-border">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div>
              <h2 className="text-3xl font-medium text-text-primary font-serif mb-3">Meet trusted specialists</h2>
              <p className="text-text-secondary text-lg">Experienced professionals, available when you need them.</p>
            </div>
            <Link href="/doctors" className="text-sm font-bold text-primary hover:underline whitespace-nowrap">
              View All Doctors &rarr;
            </Link>
          </div>
          
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {featuredDoctors.map((doctor) => (
              <DoctorCard key={doctor.id} doctor={doctor} />
            ))}
          </div>
        </div>
      </section>

      {/* 5. WHY SCHEDULA & HOW IT WORKS */}
      <section className="px-4 sm:px-6 lg:px-8 py-24 lg:py-32 bg-stone-50 border-t border-border">
        <div className="mx-auto max-w-7xl">
          
          <div className="mb-24">
            <h2 className="text-4xl lg:text-5xl font-medium text-text-primary font-serif mb-16 tracking-tight">Care should be easier.</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16">
              <div className="flex flex-col relative">
                <span className="text-sm font-bold text-primary mb-4">01</span>
                <h3 className="text-2xl font-medium text-text-primary font-serif mb-3">Find the right doctor</h3>
                <p className="text-text-secondary leading-relaxed">Search our network by name or specialty to find the healthcare provider perfectly suited for your specific needs.</p>
              </div>
              <div className="flex flex-col relative">
                <span className="text-sm font-bold text-primary mb-4">02</span>
                <h3 className="text-2xl font-medium text-text-primary font-serif mb-3">Choose a time that works</h3>
                <p className="text-text-secondary leading-relaxed">View real-time availability and select an appointment slot that fits seamlessly into your busy schedule.</p>
              </div>
              <div className="flex flex-col relative">
                <span className="text-sm font-bold text-primary mb-4">03</span>
                <h3 className="text-2xl font-medium text-text-primary font-serif mb-3">Stay in control</h3>
                <p className="text-text-secondary leading-relaxed">Manage, track, and modify your upcoming appointments easily through a secure online platform.</p>
              </div>
            </div>
          </div>

          <div className="pt-24 border-t border-border">
            <h2 className="text-3xl font-medium text-text-primary font-serif mb-12">Designed around your care.</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="pt-6 border-t border-primary/20">
                <h4 className="font-bold text-text-primary mb-2">Secure management</h4>
                <p className="text-sm text-text-secondary leading-relaxed">Your appointment history is safely stored.</p>
              </div>
              <div className="pt-6 border-t border-primary/20">
                <h4 className="font-bold text-text-primary mb-2">Real-time availability</h4>
                <p className="text-sm text-text-secondary leading-relaxed">No double-bookings. Always accurate.</p>
              </div>
              <div className="pt-6 border-t border-primary/20">
                <h4 className="font-bold text-text-primary mb-2">Transparent profiles</h4>
                <p className="text-sm text-text-secondary leading-relaxed">Clear qualifications and verified reviews.</p>
              </div>
              <div className="pt-6 border-t border-primary/20">
                <h4 className="font-bold text-text-primary mb-2">Easy tracking</h4>
                <p className="text-sm text-text-secondary leading-relaxed">Monitor all upcoming and past visits.</p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 6. FINAL CTA */}
      <section className="px-4 sm:px-6 lg:px-8 py-24 lg:py-32 bg-primary-dark text-center">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-4xl sm:text-5xl font-medium text-white font-serif mb-6 tracking-tight">Ready to find the right doctor?</h2>
          <p className="text-lg text-white/80 mb-10 max-w-xl mx-auto leading-relaxed">Browse trusted specialists and book a time that works for you.</p>
          <Link href="/doctors" className="inline-flex justify-center items-center rounded-xl bg-white px-10 py-4 text-base font-bold text-primary-dark shadow-sm transition-all hover:bg-stone-50 hover:scale-105 active:scale-95">
            Find a Doctor
          </Link>
        </div>
      </section>

      {/* 7. FOOTER */}
      <footer className="bg-background border-t border-border pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            <div className="lg:pr-8">
              <Link href="/" className="flex items-center gap-2.5 mb-6">
                <div className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-primary to-primary-dark font-serif text-lg font-bold text-white shadow-sm ring-1 ring-primary/20">
                  S
                </div>
                <span className="text-xl font-bold tracking-tight text-text-primary">Schedula</span>
              </Link>
              <p className="text-text-secondary text-sm leading-relaxed">A professional healthcare appointment scheduling platform connecting patients with trusted medical experts.</p>
            </div>
            
            <div>
              <h3 className="font-bold text-text-primary mb-5 uppercase tracking-widest text-xs">Patient</h3>
              <ul className="space-y-3.5 text-sm">
                <li><Link href="/" className="text-text-secondary hover:text-primary transition-colors font-medium">Home</Link></li>
                <li><Link href="/doctors" className="text-text-secondary hover:text-primary transition-colors font-medium">Find Doctors</Link></li>
                <li><Link href="/appointments" className="text-text-secondary hover:text-primary transition-colors font-medium">Appointments</Link></li>
                <li><Link href="/profile" className="text-text-secondary hover:text-primary transition-colors font-medium">Profile</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-bold text-text-primary mb-5 uppercase tracking-widest text-xs">Doctor</h3>
              <ul className="space-y-3.5 text-sm">
                <li><Link href="/doctor/login" className="text-text-secondary hover:text-primary transition-colors font-medium">Doctor Login</Link></li>
                <li><Link href="/doctor/register" className="text-text-secondary hover:text-primary transition-colors font-medium">Doctor Registration</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-text-primary mb-5 uppercase tracking-widest text-xs">Support</h3>
              <ul className="space-y-3.5 text-sm">
                <li><Link href="#" className="text-text-secondary hover:text-primary transition-colors font-medium">Help Center</Link></li>
                <li><Link href="#" className="text-text-secondary hover:text-primary transition-colors font-medium">Privacy Policy</Link></li>
                <li><Link href="#" className="text-text-secondary hover:text-primary transition-colors font-medium">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-text-secondary">
            <p>&copy; {new Date().getFullYear()} Schedula. All rights reserved.</p>
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
