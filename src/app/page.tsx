import Link from "next/link";
import { mockDoctors } from "@/lib/mock-data/doctors";
import { DoctorCard } from "@/features/doctors/components/DoctorCard";

export default function LandingPage() {
  const specialties = [
    { name: "General Medicine", icon: (
      <svg className="size-6 text-[var(--brand)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
    )},
    { name: "Cardiology", icon: (
      <svg className="size-6 text-[var(--brand)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
    )},
    { name: "Dermatology", icon: (
      <svg className="size-6 text-[var(--brand)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" /></svg>
    )},
    { name: "Orthopedics", icon: (
      <svg className="size-6 text-[var(--brand)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    )},
    { name: "Pediatrics", icon: (
      <svg className="size-6 text-[var(--brand)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
    )},
    { name: "Neurology", icon: (
      <svg className="size-6 text-[var(--brand)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
    )}
  ];

  return (
    <main className="flex flex-col min-h-screen bg-[var(--canvas)]">
      
      {/* 1. HERO SECTION */}
      <section className="bg-white px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="mx-auto max-w-7xl grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <div className="max-w-2xl">
            <span className="inline-block font-semibold uppercase tracking-widest text-sm text-[var(--brand)] mb-4">
              Healthcare made simpler
            </span>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-[var(--ink)] font-serif mb-6 leading-tight">
              Find the right doctor for your care.
            </h1>
            <p className="text-lg text-[var(--muted)] mb-10 max-w-xl leading-relaxed">
              Discover trusted doctors, check their availability, and book appointments at a time that works for you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mb-10">
              <Link href="/doctors" className="inline-flex justify-center items-center rounded-lg bg-[var(--brand)] px-8 py-3.5 text-base font-semibold text-white shadow-sm transition-all hover:bg-[var(--brand-deep)] active:scale-[0.98]">
                Find a Doctor
              </Link>
              <Link href="/doctors" className="inline-flex justify-center items-center rounded-lg border border-[var(--line)] bg-white px-8 py-3.5 text-base font-semibold text-[var(--ink)] shadow-sm transition-all hover:bg-stone-50 active:scale-[0.98]">
                Book Appointment
              </Link>
            </div>
            
            <div className="flex flex-col sm:flex-row flex-wrap gap-x-8 gap-y-3 text-sm font-medium text-[var(--ink)]">
              <div className="flex items-center gap-2">
                <svg className="size-5 text-[var(--success)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                Easy online booking
              </div>
              <div className="flex items-center gap-2">
                <svg className="size-5 text-[var(--success)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                Real-time availability
              </div>
              <div className="flex items-center gap-2">
                <svg className="size-5 text-[var(--success)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                Trusted doctors
              </div>
            </div>
          </div>
          
          <div className="lg:ml-auto w-full flex justify-center">
            {/* Hero Image */}
            <div className="w-full max-w-[440px] aspect-[4/5] rounded-3xl bg-stone-50 overflow-hidden relative shadow-lg border border-[var(--line)]">
              <div className="absolute inset-0 bg-gradient-to-t from-stone-200/50 to-transparent z-10 pointer-events-none"></div>
              <img 
                src="/hero-doctor.png" 
                alt="Professional Doctor"
                className="absolute inset-0 w-full h-full object-cover object-[center_top]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 2. QUICK DOCTOR SEARCH */}
      <section className="bg-[var(--canvas)] border-b border-[var(--line)] px-4 sm:px-6 lg:px-8 py-10">
        <div className="mx-auto max-w-7xl">
          <form action="/doctors" className="flex flex-col md:flex-row items-center gap-4 p-4 rounded-xl bg-white shadow-sm border border-[var(--line)]">
            <div className="flex-1 w-full relative flex items-center">
              <svg className="absolute left-4 size-5 text-[var(--muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input 
                type="text" 
                name="q"
                placeholder="Search by doctor name or specialty..." 
                className="w-full pl-12 pr-4 py-3 text-base text-[var(--ink)] placeholder:text-[var(--muted)] outline-none"
              />
            </div>
            <div className="hidden md:block w-[1px] h-10 bg-[var(--line)]"></div>
            <div className="flex-1 w-full relative">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-[var(--muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              <input 
                type="text" 
                placeholder="Location (Optional)" 
                className="w-full pl-12 pr-4 py-3 text-base text-[var(--ink)] placeholder:text-[var(--muted)] outline-none"
              />
            </div>
            <button type="submit" className="w-full md:w-auto rounded-lg bg-[var(--brand)] px-8 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[var(--brand-deep)] active:scale-[0.98]">
              Search
            </button>
          </form>
        </div>
      </section>

      {/* 3. POPULAR SPECIALTIES */}
      <section className="px-4 sm:px-6 lg:px-8 py-12 lg:py-16 bg-white">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center md:text-left flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold text-[var(--ink)] font-serif">Find care by specialty</h2>
              <p className="mt-2 text-lg text-[var(--muted)]">Browse top specialties to find the exact care you need.</p>
            </div>
            <Link href="/doctors" className="text-[var(--brand)] font-semibold hover:text-[var(--brand-deep)] transition-colors flex items-center justify-center md:justify-start gap-1">
              View all specialties &rarr;
            </Link>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {specialties.map((spec) => (
              <Link key={spec.name} href={`/doctors?q=${encodeURIComponent(spec.name)}`} className="group flex flex-col items-center text-center rounded-xl bg-[var(--canvas)] p-6 border border-[var(--line)] transition-all hover:border-[var(--brand)]/30 hover:shadow-sm">
                <div className="grid size-12 place-items-center rounded-full bg-white shadow-sm text-[var(--brand)] mb-4">
                  {spec.icon}
                </div>
                <h3 className="text-sm font-semibold text-[var(--ink)] group-hover:text-[var(--brand)] transition-colors">{spec.name}</h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 4. FEATURED DOCTORS */}
      <section className="px-4 sm:px-6 lg:px-8 py-12 lg:py-16 bg-[var(--canvas)]">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold text-[var(--ink)] font-serif">Meet our doctors</h2>
              <p className="mt-2 text-lg text-[var(--muted)]">Highly qualified professionals dedicated to providing the best care.</p>
            </div>
            <Link href="/doctors" className="rounded-lg border border-[var(--line)] bg-white px-5 py-2 text-sm font-semibold text-[var(--ink)] shadow-sm transition-all hover:bg-stone-50">
              View all doctors
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {mockDoctors.slice(0, 4).map((doctor) => (
              <DoctorCard key={doctor.id} doctor={doctor} />
            ))}
          </div>
        </div>
      </section>

      {/* 5. HOW IT WORKS */}
      <section id="how-it-works" className="px-4 sm:px-6 lg:px-8 py-12 lg:py-16 bg-white border-y border-[var(--line)]">
        <div className="mx-auto max-w-5xl text-center">
          <h2 className="text-3xl font-bold text-[var(--ink)] font-serif mb-16">How Schedula works</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-left">
            <div className="flex flex-col">
              <span className="text-4xl font-bold text-[var(--sage)]/50 font-serif mb-4">01</span>
              <h3 className="text-xl font-bold text-[var(--ink)] mb-2">Find a doctor</h3>
              <p className="text-[var(--muted)]">Search our network by name or specialty to find the right healthcare provider for your specific needs.</p>
            </div>
            
            <div className="flex flex-col">
              <span className="text-4xl font-bold text-[var(--sage)]/50 font-serif mb-4">02</span>
              <h3 className="text-xl font-bold text-[var(--ink)] mb-2">Choose a convenient time</h3>
              <p className="text-[var(--muted)]">View real-time availability and select an appointment slot that fits perfectly into your schedule.</p>
            </div>
            
            <div className="flex flex-col">
              <span className="text-4xl font-bold text-[var(--sage)]/50 font-serif mb-4">03</span>
              <h3 className="text-xl font-bold text-[var(--ink)] mb-2">Book your appointment</h3>
              <p className="text-[var(--muted)]">Confirm your details securely online. You will receive immediate confirmation of your visit.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. TRUST SECTION */}
      <section id="about" className="px-4 sm:px-6 lg:px-8 py-12 lg:py-16 bg-[var(--ink)] text-white">
        <div className="mx-auto max-w-7xl">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-24 items-center">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold font-serif mb-6 leading-tight">Healthcare appointments, made simple.</h2>
              <p className="text-[var(--canvas)]/80 text-lg mb-8 leading-relaxed">
                Schedula streamlines the connection between patients and medical professionals. By combining intuitive doctor discovery with real-time schedule synchronization, we ensure you can always find the care you need, precisely when you need it.
              </p>
              <ul className="space-y-4 mb-8 text-[var(--canvas)]/90">
                <li className="flex items-center gap-3">
                  <svg className="size-5 text-[var(--brand)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Transparent doctor profiles and qualifications
                </li>
                <li className="flex items-center gap-3">
                  <svg className="size-5 text-[var(--brand)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Live availability without calling the clinic
                </li>
                <li className="flex items-center gap-3">
                  <svg className="size-5 text-[var(--brand)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Seamless online booking and management
                </li>
              </ul>
            </div>
            <div className="relative">
              <div className="aspect-square md:aspect-[4/5] rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center p-8">
                 <div className="w-full max-w-sm bg-white rounded-xl shadow-2xl p-6 text-[var(--ink)]">
                   <div className="flex items-center gap-4 mb-6 pb-6 border-b border-[var(--line)]">
                     <div className="size-12 rounded-full bg-[var(--brand)]/10 text-[var(--brand)] grid place-items-center font-bold">
                       AS
                     </div>
                     <div>
                       <p className="font-bold">Appointment Scheduled</p>
                       <p className="text-sm text-[var(--muted)]">Tomorrow at 10:00 AM</p>
                     </div>
                   </div>
                   <div className="flex justify-between items-center">
                     <p className="text-sm font-medium text-[var(--muted)]">Dr. Rohan Sharma</p>
                     <span className="text-xs font-bold text-[var(--success)] bg-[var(--success)]/10 px-2 py-1 rounded">Confirmed</span>
                   </div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. FINAL CTA */}
      <section className="px-4 sm:px-6 lg:px-8 py-12 lg:py-16 text-center bg-white">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-3xl font-bold text-[var(--ink)] font-serif mb-4">Ready to find the right doctor?</h2>
          <p className="text-lg text-[var(--muted)] mb-8">Browse available doctors and choose an appointment time that works for you.</p>
          <Link href="/doctors" className="inline-flex justify-center items-center rounded-lg bg-[var(--brand)] px-8 py-3.5 text-base font-semibold text-white shadow-sm transition-all hover:bg-[var(--brand-deep)] active:scale-[0.98]">
            Find a Doctor
          </Link>
        </div>
      </section>

      {/* 8. FOOTER */}
      <footer className="bg-[var(--canvas)] border-t border-[var(--line)] pt-16 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="md:col-span-2">
              <Link href="/" className="flex items-center gap-2.5 mb-4">
                <div className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-[var(--brand)] to-[var(--brand-deep)] font-serif text-lg font-bold text-white shadow-sm">
                  S
                </div>
                <span className="text-xl font-bold tracking-tight text-[var(--ink)]">Schedula</span>
              </Link>
              <p className="text-[var(--muted)] max-w-sm text-sm">A professional healthcare appointment scheduling platform connecting patients with trusted medical experts.</p>
            </div>
            
            <div>
              <h3 className="font-bold text-[var(--ink)] mb-4 text-sm">Patient</h3>
              <ul className="space-y-3 text-sm">
                <li><Link href="/" className="text-[var(--muted)] hover:text-[var(--brand)] transition-colors">Home</Link></li>
                <li><Link href="/doctors" className="text-[var(--muted)] hover:text-[var(--brand)] transition-colors">Find Doctors</Link></li>
                <li><Link href="/#how-it-works" className="text-[var(--muted)] hover:text-[var(--brand)] transition-colors">How It Works</Link></li>
                <li><Link href="/login" className="text-[var(--muted)] hover:text-[var(--brand)] transition-colors">Login</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-bold text-[var(--ink)] mb-4 text-sm">Doctor</h3>
              <ul className="space-y-3 text-sm">
                <li><Link href="/doctor/login" className="text-[var(--muted)] hover:text-[var(--brand)] transition-colors">Doctor Login</Link></li>
                <li><Link href="/doctor/register" className="text-[var(--muted)] hover:text-[var(--brand)] transition-colors">Doctor Registration</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-[var(--line)] flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-[var(--muted)]">
            <p>&copy; {new Date().getFullYear()} Schedula. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
