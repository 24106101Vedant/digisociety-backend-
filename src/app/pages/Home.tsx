import { useState } from "react";
import {
  Users, IndianRupee, BookOpen, Megaphone, ShieldCheck, Camera,
  Phone, Mail, MapPin, Menu, X, Star, ChevronRight,
  Building2, CheckCircle2,
} from "lucide-react";
import logo from "@/assets/logo.png.jpg";
import EnquiryForm from "../components/EnquiryForm";

// ─── Constants ────────────────────────────────────────────────────────────────

const NAV_LINKS = [
  { label: "Home",     href: "#home"     },
  { label: "Services", href: "#services" },
  { label: "Features", href: "#features" },
  { label: "About",    href: "#about"    },
  { label: "Contact",  href: "#contact"  },
];

const SERVICES = [
  { icon: Users,       title: "Member Records",         desc: "Flat owners, tenants, contact details — all managed digitally with smart search and updates.",                                color: "from-cyan-400 to-emerald-500",   glow: "shadow-cyan-300/60"   },
  { icon: IndianRupee, title: "Maintenance Collection",  desc: "Monthly/quarterly charges, instant digital receipts, automated reminders — zero hassle.",                                  color: "from-orange-400 to-red-500",     glow: "shadow-orange-300/60" },
  { icon: BookOpen,    title: "Accounting",              desc: "Track income from maintenance & parking fees. Monitor expenses on repairs, electricity, salaries.",                         color: "from-violet-500 to-pink-500",    glow: "shadow-violet-300/60" },
  { icon: Megaphone,   title: "Meetings & Notices",      desc: "Schedule AGMs, send circulars, post announcements — keep every resident informed instantly.",                               color: "from-emerald-400 to-cyan-500",   glow: "shadow-emerald-300/60"},
  { icon: ShieldCheck, title: "Compliance",              desc: "Stay updated with municipal rules, cooperative society laws, and GST compliance requirements.",                             color: "from-pink-500 to-rose-500",      glow: "shadow-pink-300/60"   },
  { icon: Camera,      title: "Security & Facilities",   desc: "Gate management, CCTV monitoring, amenities booking — complete security at your fingertips.",                              color: "from-red-500 to-orange-500",     glow: "shadow-red-300/60"    },
];

const STATS = [
  { value: "500+", label: "Societies Managed", color: "text-cyan-500"   },
  { value: "50K+", label: "Happy Residents",   color: "text-emerald-500" },
  { value: "99%",  label: "Collection Rate",   color: "text-violet-600"  },
  { value: "24/7", label: "Support Available", color: "text-orange-500"  },
];

const WHY_US = [
  "Cloud-based, access anywhere anytime",
  "Real-time SMS & WhatsApp notifications",
  "Automated payment reminders",
  "Transparent financial reporting",
  "Secure document storage",
  "Multi-language support (Hindi & English)",
];

const CONTACT_CARDS = [
  { icon: Phone,  label: "Call Us",   value: "7756909593",       sub: "Mon–Sat, 9am–7pm",        color: "#10b981", bg: "from-emerald-50 to-cyan-50",   border: "border-emerald-200" },
  { icon: Mail,   label: "Email Us",  value: "info@digisociety.in", sub: "We reply within 24 hours", color: "#7c3aed", bg: "from-violet-50 to-pink-50",   border: "border-violet-200"  },
  { icon: MapPin, label: "Visit Us",  value: "digisociety.in",   sub: "Available pan India",      color: "#f97316", bg: "from-orange-50 to-red-50",     border: "border-orange-200"  },
];

// ─── Props ────────────────────────────────────────────────────────────────────

interface HomeProps {
  onGetStarted: () => void;
  loggedIn: boolean;
  onLogout: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Home({ onGetStarted, loggedIn, onLogout }: HomeProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const goToLogin = (e: React.MouseEvent) => {
    e.preventDefault();
    onGetStarted();
  };

  return (
    <div className="min-h-screen" style={{ fontFamily: "'Nunito', sans-serif" }}>

      {/* ─── NAVBAR ───────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 shadow-lg shadow-cyan-400/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <img src={logo} alt="DigiSociety" className="h-10 w-auto"
                style={{ background: "white", borderRadius: "10px", padding: "3px 8px" }} />
              <span className="text-white font-black text-xl tracking-tight"
                style={{ fontFamily: "'Pacifico', cursive" }}>DigiSociety</span>
            </div>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-1">
              {NAV_LINKS.map(link => (
                <a key={link.label} href={link.href}
                  className="px-4 py-2 text-white font-bold text-sm hover:bg-white/15 rounded-lg transition-all duration-200">
                  {link.label}
                </a>
              ))}
              {loggedIn ? (
                <div className="ml-3 flex items-center gap-2">
                  <span className="px-4 py-2 bg-white/20 text-white font-bold text-sm rounded-xl flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-200" /> Logged In
                  </span>
                  <button onClick={onLogout}
                    className="px-4 py-2 bg-white/10 border border-white/30 text-white font-bold text-sm rounded-xl hover:bg-white/20 transition-all">
                    Logout
                  </button>
                </div>
              ) : (
                <a href="#login" onClick={goToLogin}
                  className="ml-3 px-5 py-2 bg-orange-500 text-white font-bold text-sm rounded-xl hover:bg-orange-600 transition-all shadow-md">
                  Get Started
                </a>
              )}
            </div>

            {/* Mobile toggle */}
            <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden text-white p-2">
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile menu */}
          {menuOpen && (
            <div className="md:hidden pb-4 border-t border-white/20 pt-3 flex flex-col gap-1">
              {NAV_LINKS.map(link => (
                <a key={link.label} href={link.href} onClick={() => setMenuOpen(false)}
                  className="px-4 py-2 text-white font-semibold hover:bg-white/15 rounded-lg transition">
                  {link.label}
                </a>
              ))}
            </div>
          )}
        </div>
      </nav>

      {/* ─── HERO ─────────────────────────────────────────────────────────── */}
      <section id="home" className="pt-24 pb-20 px-4 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #ecfeff 0%, #f0fffe 30%, #fdf4ff 60%, #fff7ed 100%)" }}>
        <div className="absolute top-10 left-10 w-72 h-72 bg-cyan-300/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-20 right-10 w-64 h-64 bg-violet-300/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-96 h-48 bg-emerald-300/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: headline */}
            <div>
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-100 to-emerald-100 border border-cyan-200 rounded-full px-4 py-2 mb-6">
                <Star className="w-4 h-4 text-emerald-500 fill-emerald-400" />
                <span className="text-emerald-700 font-bold text-sm">India's Smartest Society Management Platform</span>
              </div>
              <h1 className="text-5xl lg:text-6xl font-black leading-tight mb-4" style={{ fontFamily: "'Raleway', sans-serif" }}>
                <span className="block" style={{ background: "linear-gradient(90deg,#06b6d4,#10b981)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", filter: "drop-shadow(0 0 20px rgba(6,182,212,0.5))" }}>DigiSociety</span>
                <span className="block text-4xl lg:text-5xl" style={{ background: "linear-gradient(90deg,#7c3aed,#ec4899)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", filter: "drop-shadow(0 0 15px rgba(124,58,237,0.4))" }}>Smart. Simple.</span>
                <span className="block" style={{ background: "linear-gradient(90deg,#f97316,#ef4444)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", filter: "drop-shadow(0 0 15px rgba(249,115,22,0.4))" }}>Digital.</span>
              </h1>
              <p className="text-slate-600 text-lg font-semibold leading-relaxed mb-8 max-w-lg">
                Manage your housing society <span className="text-cyan-600 font-bold">digitally</span> with ease.
                Members, maintenance, accounts, security — all in one place, one click away!
              </p>
              <div className="flex flex-wrap gap-4">
                <a href="#login" onClick={goToLogin}
                  className="px-8 py-3 rounded-2xl font-bold text-white text-base shadow-lg hover:scale-105 transition-transform"
                  style={{ background: "linear-gradient(135deg,#06b6d4,#10b981)", boxShadow: "0 8px 32px rgba(6,182,212,0.45)" }}>
                  Get Started Free
                </a>
                <a href="tel:7756909593"
                  className="px-8 py-3 rounded-2xl font-bold text-base border-2 border-violet-400 text-violet-600 hover:bg-violet-50 transition-all flex items-center gap-2"
                  style={{ boxShadow: "0 4px 20px rgba(124,58,237,0.2)" }}>
                  <Phone className="w-4 h-4" /> Call Now
                </a>
              </div>
            </div>

            {/* Right: Enquiry Form card */}
            <div className="relative flex justify-center lg:justify-end">
              <div className="rounded-3xl p-6 w-full max-w-md"
                style={{ background: "linear-gradient(135deg,#ffffff,#ecfeff)", boxShadow: "0 20px 60px rgba(6,182,212,0.25),0 4px 20px rgba(0,0,0,0.08)", border: "1.5px solid rgba(6,182,212,0.2)" }}>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "linear-gradient(135deg,#06b6d4,#10b981)" }}>
                    <Building2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-black text-slate-800 text-sm">Society Enquiry</p>
                    <p className="text-xs text-slate-500">Fill in your details to get started</p>
                  </div>
                  <div className="ml-auto w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse" />
                </div>
                <EnquiryForm />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── STATS ────────────────────────────────────────────────────────── */}
      <section className="py-12 px-4" style={{ background: "linear-gradient(90deg,#0891b2,#065f46)" }}>
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {STATS.map(s => (
            <div key={s.label} className="text-center">
              <p className="text-4xl font-black text-white" style={{ fontFamily: "'Raleway',sans-serif", textShadow: "0 0 30px rgba(255,255,255,0.5)" }}>{s.value}</p>
              <p className="text-cyan-100 font-semibold text-sm mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── SERVICES ─────────────────────────────────────────────────────── */}
      <section id="services" className="py-20 px-4" style={{ background: "linear-gradient(180deg,#f0fffe 0%,#fdf4ff 100%)" }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-xs font-bold tracking-widest text-emerald-600 uppercase bg-emerald-50 px-4 py-1.5 rounded-full border border-emerald-200">Our Services</span>
            <h2 className="text-4xl lg:text-5xl font-black mt-4 mb-3" style={{ fontFamily: "'Raleway',sans-serif" }}>
              <span style={{ background: "linear-gradient(90deg,#7c3aed,#ec4899)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Everything Your Society</span>{" "}
              <span style={{ background: "linear-gradient(90deg,#f97316,#ef4444)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Needs</span>
            </h2>
            <p className="text-slate-500 font-semibold max-w-xl mx-auto">6 powerful modules — one complete society management system</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {SERVICES.map(svc => (
              <div key={svc.title} className="group relative bg-white rounded-3xl p-6 transition-all duration-300 hover:-translate-y-2 cursor-default overflow-hidden"
                style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.06)", border: "1.5px solid rgba(0,0,0,0.06)" }}>
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${svc.color} flex items-center justify-center mb-4 shadow-lg`}>
                  <svc.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-lg font-black text-slate-800 mb-2" style={{ fontFamily: "'Raleway',sans-serif" }}>{svc.title}</h3>
                <p className="text-slate-500 text-sm font-semibold leading-relaxed">{svc.desc}</p>
                <div className="flex items-center gap-1 mt-4 text-emerald-600 font-bold text-sm group-hover:gap-2 transition-all">
                  Learn more <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── WHY US ───────────────────────────────────────────────────────── */}
      <section id="features" className="py-20 px-4" style={{ background: "linear-gradient(135deg,#fff7ed 0%,#fdf4ff 50%,#ecfeff 100%)" }}>
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-14 items-center">
          <div>
            <span className="text-xs font-bold tracking-widest text-orange-600 uppercase bg-orange-50 px-4 py-1.5 rounded-full border border-orange-200">Why DigiSociety?</span>
            <h2 className="text-4xl lg:text-5xl font-black mt-5 mb-6 leading-tight" style={{ fontFamily: "'Raleway',sans-serif" }}>
              <span style={{ background: "linear-gradient(90deg,#f97316,#ef4444)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Society Management</span><br />
              <span style={{ background: "linear-gradient(90deg,#06b6d4,#10b981)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Made Easy & Smart</span>
            </h2>
            <p className="text-slate-600 font-semibold text-base leading-relaxed mb-8">
              We make your society <span className="text-violet-600 font-bold">completely digital</span>. Paper-free, stress-free, worry-free management experience.
            </p>
            <a href="tel:7756909593" className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-white text-base transition-all hover:scale-105"
              style={{ background: "linear-gradient(135deg,#f97316,#ef4444)", boxShadow: "0 8px 32px rgba(249,115,22,0.4)" }}>
              <Phone className="w-5 h-5" /> Call Us: 7756909593
            </a>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {WHY_US.map((item, i) => (
              <div key={item} className="flex items-center gap-4 bg-white rounded-2xl px-5 py-4"
                style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.06)", border: "1.5px solid rgba(6,182,212,0.12)" }}>
                <CheckCircle2 className="w-6 h-6 flex-shrink-0"
                  style={{ color: ["#06b6d4","#10b981","#7c3aed","#ec4899","#f97316","#ef4444"][i % 6] }} />
                <span className="font-bold text-slate-700">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── ABOUT ────────────────────────────────────────────────────────── */}
      <section id="about" className="py-20 px-4" style={{ background: "linear-gradient(180deg,#ecfeff 0%,#fdf4ff 100%)" }}>
        <div className="max-w-4xl mx-auto text-center">
          <span className="text-xs font-bold tracking-widest text-violet-600 uppercase bg-violet-50 px-4 py-1.5 rounded-full border border-violet-200">About DigiSociety</span>
          <h2 className="text-4xl lg:text-5xl font-black mt-5 mb-6" style={{ fontFamily: "'Raleway',sans-serif" }}>
            <span style={{ background: "linear-gradient(90deg,#7c3aed,#ec4899,#f97316)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Your Society's</span><br />
            <span style={{ background: "linear-gradient(90deg,#06b6d4,#10b981)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Digital Partner</span>
          </h2>
          <p className="text-slate-600 font-semibold text-lg leading-relaxed max-w-2xl mx-auto">
            DigiSociety is a complete digital solution built specially for housing societies.
            Over <span className="text-cyan-600 font-bold">500+ societies</span> trust our platform.
            We ensure every aspect of your society — from member management to financial accounting — runs smooth, transparent, and fully digital.
          </p>
          <div className="mt-10 inline-flex items-center gap-4 rounded-2xl px-8 py-5"
            style={{ background: "linear-gradient(135deg,#ffffff,#ecfeff)", boxShadow: "0 8px 40px rgba(6,182,212,0.2)", border: "1.5px solid rgba(6,182,212,0.2)" }}>
            <div className="text-left">
              <p className="font-black text-slate-800 text-lg">digisociety.in</p>
              <p className="text-slate-500 font-semibold text-sm">Visit our website</p>
            </div>
            <div className="w-px h-10 bg-slate-200" />
            <div className="text-left">
              <p className="font-black text-emerald-600 text-lg">7756909593</p>
              <p className="text-slate-500 font-semibold text-sm">Call anytime</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CONTACT ──────────────────────────────────────────────────────── */}
      <section id="contact" className="py-20 px-4" style={{ background: "linear-gradient(135deg,#fff7ed 0%,#ecfeff 100%)" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs font-bold tracking-widest text-pink-600 uppercase bg-pink-50 px-4 py-1.5 rounded-full border border-pink-200">Get In Touch</span>
            <h2 className="text-4xl lg:text-5xl font-black mt-5" style={{ fontFamily: "'Raleway',sans-serif" }}>
              <span style={{ background: "linear-gradient(90deg,#ec4899,#f97316)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Contact Us</span>{" "}
              <span style={{ background: "linear-gradient(90deg,#06b6d4,#10b981)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Today</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {CONTACT_CARDS.map(c => (
              <div key={c.label} className={`bg-gradient-to-br ${c.bg} rounded-3xl p-6 border ${c.border} text-center`}>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: `linear-gradient(135deg,${c.color}22,${c.color}44)`, border: `1.5px solid ${c.color}44` }}>
                  <c.icon className="w-7 h-7" style={{ color: c.color }} />
                </div>
                <p className="font-black text-slate-700 text-sm mb-1">{c.label}</p>
                <p className="font-black text-lg" style={{ color: c.color }}>{c.value}</p>
                <p className="text-slate-400 text-xs font-semibold mt-1">{c.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FOOTER ───────────────────────────────────────────────────────── */}
      <footer className="py-8 px-4 text-center" style={{ background: "linear-gradient(135deg,#06b6d4,#10b981)" }}>
        <p className="text-white font-bold text-sm">
          © {new Date().getFullYear()} DigiSociety.in — All rights reserved.
        </p>
        <p className="text-white/70 text-xs mt-1 font-semibold">
          Smart Society Management Platform | India
        </p>
      </footer>

    </div>
  );
}
