import { useState } from "react";
import {
  Building2, Users, IndianRupee, ShieldCheck,
  Eye, EyeOff, Mail, Lock, ArrowLeft, CheckCircle2, Phone, UserPlus,
} from "lucide-react";
import logo from "@/assets/logo.png.jpg";
import { API_BASE } from "@/api";

// Fallback admin credentials (used only when backend is unreachable)
const VALID_EMAIL    = "digisociety.in@gmail.com";
const VALID_PASSWORD = "digisociety";

// Registered users stored in memory (persisted in localStorage)
function getRegisteredUsers(): { email: string; password: string }[] {
  try { return JSON.parse(localStorage.getItem("ds_registered_users") || "[]"); }
  catch { return []; }
}
function saveRegisteredUsers(users: { email: string; password: string }[]) {
  localStorage.setItem("ds_registered_users", JSON.stringify(users));
}

interface LoginPageProps {
  onBack: () => void;
  onLoginSuccess: () => void;
}

const FEATURES = [
  { icon: Users,       text: "Manage all member records digitally"  },
  { icon: IndianRupee, text: "Track maintenance & payments easily"  },
  { icon: ShieldCheck, text: "Secure gate & facility management"    },
  { icon: Building2,   text: "500+ societies trust DigiSociety"     },
];

type View = "login" | "register" | "forgot";

export default function LoginPage({ onBack, onLoginSuccess }: LoginPageProps) {
  const [view, setView] = useState<View>("login");

  // ── Login state ──────────────────────────────────────────────────────────
  const [username,     setUsername]     = useState("");
  const [password,     setPassword]     = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError,   setLoginError]   = useState("");
  const [loading,      setLoading]      = useState(false);

  // ── Register state ───────────────────────────────────────────────────────
  const [regEmail,       setRegEmail]       = useState("");
  const [regPassword,    setRegPassword]    = useState("");
  const [regConfirm,     setRegConfirm]     = useState("");
  const [showRegPass,    setShowRegPass]    = useState(false);
  const [showRegConfirm, setShowRegConfirm] = useState(false);
  const [regErrors,      setRegErrors]      = useState<Record<string,string>>({});
  const [regSuccess,     setRegSuccess]     = useState(false);

  // ── Forgot password state ────────────────────────────────────────────────
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent,  setForgotSent]  = useState(false);
  const [forgotError, setForgotError] = useState("");

  // ── Login handler ────────────────────────────────────────────────────────
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError("");
    setLoading(true);
    const emailInput = username.trim().toLowerCase();

    // Check registered users first
    const registered = getRegisteredUsers();
    const found = registered.find(
      u => u.email.toLowerCase() === emailInput && u.password === password
    );
    if (found) {
      const user = { id: Date.now(), email: found.email, name: found.email.split("@")[0], role: "member" };
      localStorage.setItem("ds_token", "LOCAL_AUTH");
      localStorage.setItem("ds_user", JSON.stringify(user));
      setLoading(false);
      onLoginSuccess();
      return;
    }

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailInput, password }),
        signal: controller.signal,
      });
      clearTimeout(timer);
      const data = await res.json();
      if (data.success && data.token) {
        localStorage.setItem("ds_token", data.token);
        localStorage.setItem("ds_user", JSON.stringify(data.user));
        setLoading(false); onLoginSuccess(); return;
      }
      setLoginError(data.message || "Invalid email or password.");
      setLoading(false); return;
    } catch { /* backend unreachable */ }

    await new Promise(r => setTimeout(r, 600));
    if (emailInput === VALID_EMAIL.toLowerCase() && password === VALID_PASSWORD) {
      const user = { id: 1, email: VALID_EMAIL, name: "DigiSociety Admin", role: "admin" };
      localStorage.setItem("ds_token", "LOCAL_AUTH");
      localStorage.setItem("ds_user", JSON.stringify(user));
      setLoading(false); onLoginSuccess();
    } else {
      setLoginError("Invalid email or password. Please try again.");
      setLoading(false);
    }
  }

  // ── Register handler ─────────────────────────────────────────────────────
  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string,string> = {};
    if (!regEmail.trim()) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail)) errs.email = "Enter a valid email";
    if (!regPassword) errs.password = "Password is required";
    else if (regPassword.length < 6) errs.password = "Minimum 6 characters";
    if (!regConfirm) errs.confirm = "Please confirm your password";
    else if (regPassword !== regConfirm) errs.confirm = "Passwords do not match";
    if (Object.keys(errs).length) { setRegErrors(errs); return; }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:     regEmail.split("@")[0], // derive name from email prefix
          email:    regEmail.trim().toLowerCase(),
          password: regPassword,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        if (res.status === 409) setRegErrors({ email: "This email is already registered." });
        else setRegErrors({ email: data.message || "Registration failed. Please try again." });
        setLoading(false);
        return;
      }
    } catch {
      // Backend unreachable — fall back to localStorage only
      const users = getRegisteredUsers();
      if (users.find(u => u.email.toLowerCase() === regEmail.trim().toLowerCase())) {
        setRegErrors({ email: "This email is already registered" });
        setLoading(false);
        return;
      }
      users.push({ email: regEmail.trim().toLowerCase(), password: regPassword });
      saveRegisteredUsers(users);
    }

    setLoading(false);
    setRegSuccess(true);
    setRegEmail(""); setRegPassword(""); setRegConfirm(""); setRegErrors({});
  }

  // ── Forgot password handler ──────────────────────────────────────────────
  async function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    setForgotError("");
    if (!forgotEmail.trim()) { setForgotError("Please enter your email address."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail)) { setForgotError("Enter a valid email."); return; }
    try {
      await fetch(`${API_BASE}/auth/forgot-password`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail.trim() }),
      });
    } catch { /* show success anyway */ }
    setForgotSent(true);
  }

  // ── Shared input style helper ────────────────────────────────────────────
  const inp = (err?: string) => ({
    background: "#f8fafc",
    border: err ? "1.5px solid #ef4444" : "1.5px solid #e2e8f0",
  });
  const focusCyan  = (e: React.FocusEvent<HTMLInputElement>) => (e.currentTarget.style.border = "1.5px solid #06b6d4");
  const blurBorder = (err?: string) => (e: React.FocusEvent<HTMLInputElement>) =>
    (e.currentTarget.style.border = err ? "1.5px solid #ef4444" : "1.5px solid #e2e8f0");

  // ── Left panel (same for all views) ─────────────────────────────────────
  const LeftPanel = () => (
    <div
      className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden"
      style={{ background: "linear-gradient(160deg,#e0f7fa 0%,#b2ebf2 30%,#e8f5e9 60%,#f3e5f5 100%)" }}
    >
      <div className="absolute top-0 left-0 w-72 h-72 bg-cyan-200/40 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-violet-200/30 rounded-full blur-3xl pointer-events-none translate-x-1/3 translate-y-1/3" />
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-2">
          <img src={logo} alt="DigiSociety" className="h-12 w-auto rounded-xl"
            style={{ background:"white", padding:"4px 10px", boxShadow:"0 4px 16px rgba(6,182,212,0.2)" }} />
          <div>
            <p className="font-black text-2xl text-cyan-700 leading-tight" style={{ fontFamily:"'Pacifico',cursive" }}>DigiSociety</p>
            <p className="text-xs text-teal-600 font-bold tracking-widest uppercase">.in</p>
          </div>
        </div>
        <button onClick={onBack} className="mt-4 inline-flex items-center gap-1.5 text-sm text-teal-700 font-bold hover:text-teal-900 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </button>
      </div>
      <div className="relative z-10 flex-1 flex flex-col justify-center py-10">
        <h2 className="text-4xl xl:text-5xl font-black leading-tight mb-4" style={{ fontFamily:"'Raleway',sans-serif" }}>
          <span style={{ background:"linear-gradient(90deg,#06b6d4,#10b981)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent" }}>Smart Society</span><br />
          <span style={{ background:"linear-gradient(90deg,#7c3aed,#ec4899)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent" }}>Management</span><br />
          <span style={{ background:"linear-gradient(90deg,#f97316,#ef4444)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent" }}>Platform</span>
        </h2>
        <p className="text-slate-600 font-semibold text-base leading-relaxed max-w-sm mb-8">
          India's most trusted digital solution for housing societies.
        </p>
        <div className="space-y-3">
          {FEATURES.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background:"linear-gradient(135deg,#06b6d4,#10b981)", boxShadow:"0 4px 12px rgba(6,182,212,0.3)" }}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              <span className="text-slate-700 font-semibold text-sm">{text}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="relative z-10 flex items-center gap-4 rounded-2xl px-5 py-3 mt-4"
        style={{ background:"rgba(255,255,255,0.7)", border:"1px solid rgba(6,182,212,0.2)", backdropFilter:"blur(10px)" }}>
        <Phone className="w-4 h-4 text-emerald-600 flex-shrink-0" />
        <span className="text-slate-700 font-bold text-sm">
          Need help? <a href="tel:7756909593" className="text-cyan-600 hover:underline">7756909593</a>
        </span>
        <span className="text-slate-400 text-xs ml-auto font-semibold">Mon–Sat, 9am–7pm</span>
      </div>
    </div>
  );

  const cardStyle = {
    background: "rgba(255,255,255,0.92)",
    boxShadow: "0 20px 60px rgba(6,182,212,0.15), 0 4px 20px rgba(0,0,0,0.06)",
    border: "1.5px solid rgba(6,182,212,0.18)",
    backdropFilter: "blur(16px)",
  };

  return (
    <div className="min-h-screen flex" style={{ background:"linear-gradient(135deg,#ecfeff 0%,#f0fffe 50%,#fdf4ff 100%)" }}>
      <LeftPanel />

      {/* Right panel */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center px-6 py-12 relative">
        <button onClick={onBack} className="lg:hidden absolute top-5 left-5 inline-flex items-center gap-1.5 text-sm text-teal-700 font-bold">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
          <img src={logo} alt="DigiSociety" className="h-10 w-auto rounded-xl"
            style={{ background:"white", padding:"3px 8px", boxShadow:"0 4px 12px rgba(6,182,212,0.2)" }} />
          <span className="font-black text-xl text-cyan-700" style={{ fontFamily:"'Pacifico',cursive" }}>DigiSociety</span>
        </div>

        <div className="w-full max-w-md">

          {/* ══ FORGOT PASSWORD VIEW ══════════════════════════════════════ */}
          {view === "forgot" && (
            <div className="rounded-3xl p-8" style={cardStyle}>
              {forgotSent ? (
                <div className="text-center py-4">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                    style={{ background:"linear-gradient(135deg,#d1fae5,#a7f3d0)" }}>
                    <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-800 mb-2" style={{ fontFamily:"'Raleway',sans-serif" }}>Email Sent!</h3>
                  <p className="text-slate-500 font-semibold text-sm mb-6">
                    If <span className="text-cyan-600 font-bold">{forgotEmail}</span> is registered, you'll receive a reset link shortly.
                  </p>
                  <button onClick={() => { setView("login"); setForgotSent(false); setForgotEmail(""); }}
                    className="w-full py-3 rounded-2xl font-bold text-white text-sm"
                    style={{ background:"linear-gradient(135deg,#06b6d4,#10b981)", boxShadow:"0 8px 24px rgba(6,182,212,0.35)" }}>
                    Back to Login
                  </button>
                </div>
              ) : (
                <>
                  <button onClick={() => { setView("login"); setForgotError(""); setForgotEmail(""); }}
                    className="inline-flex items-center gap-1.5 text-sm text-teal-700 font-bold hover:text-teal-900 mb-6">
                    <ArrowLeft className="w-4 h-4" /> Back to Login
                  </button>
                  <h2 className="text-2xl font-black text-slate-800 mb-1" style={{ fontFamily:"'Raleway',sans-serif" }}>Forgot Password?</h2>
                  <p className="text-slate-500 font-semibold text-sm mb-6">Enter your email and we'll send you a reset link.</p>
                  <form onSubmit={handleForgot} className="space-y-5">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Registered Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} placeholder="your@email.com"
                          className="w-full pl-10 pr-4 py-3 rounded-xl text-sm font-semibold text-slate-700 outline-none"
                          style={inp(forgotError)} onFocus={focusCyan} onBlur={blurBorder(forgotError)} />
                      </div>
                      {forgotError && <p className="text-red-500 text-xs font-bold mt-1.5">{forgotError}</p>}
                    </div>
                    <button type="submit" className="w-full py-3 rounded-2xl font-bold text-white text-sm"
                      style={{ background:"linear-gradient(135deg,#7c3aed,#ec4899)", boxShadow:"0 8px 24px rgba(124,58,237,0.35)" }}>
                      Send Reset Link
                    </button>
                  </form>
                </>
              )}
            </div>
          )}

          {/* ══ REGISTER VIEW ════════════════════════════════════════════ */}
          {view === "register" && (
            <div className="rounded-3xl p-8" style={cardStyle}>
              {regSuccess ? (
                <div className="text-center py-4">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                    style={{ background:"linear-gradient(135deg,#d1fae5,#a7f3d0)" }}>
                    <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-800 mb-2" style={{ fontFamily:"'Raleway',sans-serif" }}>Registration Successful!</h3>
                  <p className="text-slate-500 font-semibold text-sm mb-6">Your account has been created. You can now log in.</p>
                  <button onClick={() => { setRegSuccess(false); setView("login"); }}
                    className="w-full py-3 rounded-2xl font-bold text-white text-sm"
                    style={{ background:"linear-gradient(135deg,#06b6d4,#10b981)", boxShadow:"0 8px 24px rgba(6,182,212,0.35)" }}>
                    Go to Login
                  </button>
                </div>
              ) : (
                <>
                  <button onClick={() => { setView("login"); setRegErrors({}); }}
                    className="inline-flex items-center gap-1.5 text-sm text-teal-700 font-bold hover:text-teal-900 mb-6">
                    <ArrowLeft className="w-4 h-4" /> Back to Login
                  </button>
                  <div className="mb-6">
                    <h2 className="text-3xl font-black text-slate-800 mb-1" style={{ fontFamily:"'Raleway',sans-serif" }}>Create Account</h2>
                    <p className="text-slate-500 font-semibold text-sm">Register for DigiSociety</p>
                  </div>
                  <form onSubmit={handleRegister} className="space-y-5">
                    {/* Email */}
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Email ID</label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input type="email" value={regEmail} onChange={e => { setRegEmail(e.target.value); setRegErrors(p=>({...p,email:""})); }}
                          placeholder="Enter your email"
                          className="w-full pl-10 pr-4 py-3 rounded-xl text-sm font-semibold text-slate-700 outline-none"
                          style={inp(regErrors.email)} onFocus={focusCyan} onBlur={blurBorder(regErrors.email)} />
                      </div>
                      {regErrors.email && <p className="text-red-500 text-xs font-bold mt-1.5">{regErrors.email}</p>}
                    </div>
                    {/* New Password */}
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">New Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input type={showRegPass ? "text" : "password"} value={regPassword}
                          onChange={e => { setRegPassword(e.target.value); setRegErrors(p=>({...p,password:""})); }}
                          placeholder="Min. 6 characters"
                          className="w-full pl-10 pr-11 py-3 rounded-xl text-sm font-semibold text-slate-700 outline-none"
                          style={inp(regErrors.password)} onFocus={focusCyan} onBlur={blurBorder(regErrors.password)} />
                        <button type="button" onClick={() => setShowRegPass(!showRegPass)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                          {showRegPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {regErrors.password && <p className="text-red-500 text-xs font-bold mt-1.5">{regErrors.password}</p>}
                    </div>
                    {/* Confirm Password */}
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Confirm Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input type={showRegConfirm ? "text" : "password"} value={regConfirm}
                          onChange={e => { setRegConfirm(e.target.value); setRegErrors(p=>({...p,confirm:""})); }}
                          placeholder="Re-enter password"
                          className="w-full pl-10 pr-11 py-3 rounded-xl text-sm font-semibold text-slate-700 outline-none"
                          style={inp(regErrors.confirm)} onFocus={focusCyan} onBlur={blurBorder(regErrors.confirm)} />
                        <button type="button" onClick={() => setShowRegConfirm(!showRegConfirm)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                          {showRegConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {regErrors.confirm && <p className="text-red-500 text-xs font-bold mt-1.5">{regErrors.confirm}</p>}
                    </div>
                    {/* Register button */}
                    <button type="submit" className="w-full py-3.5 rounded-2xl font-bold text-white text-base mt-2 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all"
                      style={{ background:"linear-gradient(135deg,#06b6d4,#10b981)", boxShadow:"0 8px 32px rgba(6,182,212,0.4)" }}>
                      <UserPlus className="w-4 h-4" /> Register
                    </button>
                  </form>
                  <div className="mt-5 text-center">
                    <span className="text-slate-400 text-sm font-semibold">Already have an account? </span>
                    <button onClick={() => setView("login")} className="text-sm font-bold text-cyan-600 hover:text-cyan-800 hover:underline underline-offset-2">
                      Login
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ══ LOGIN VIEW ═══════════════════════════════════════════════ */}
          {view === "login" && (
            <div className="rounded-3xl p-8" style={cardStyle}>
              <div className="mb-7">
                <h2 className="text-3xl font-black text-slate-800 mb-1" style={{ fontFamily:"'Raleway',sans-serif" }}>Welcome Back!</h2>
                <p className="text-slate-500 font-semibold text-sm">Sign in to your DigiSociety account</p>
              </div>

              {loginError && (
                <div className="flex items-center gap-2 rounded-xl px-4 py-3 mb-5 text-sm font-bold"
                  style={{ background:"#fef2f2", border:"1.5px solid #fecaca", color:"#ef4444" }}>
                  <span>⚠️</span> {loginError}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Username / Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="text" value={username} onChange={e => { setUsername(e.target.value); setLoginError(""); }}
                      placeholder="Enter your email" required autoComplete="username"
                      className="w-full pl-10 pr-4 py-3 rounded-xl text-sm font-semibold text-slate-700 outline-none"
                      style={inp(loginError)} onFocus={focusCyan} onBlur={blurBorder(loginError)} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type={showPassword ? "text" : "password"} value={password}
                      onChange={e => { setPassword(e.target.value); setLoginError(""); }}
                      placeholder="Enter your password" required autoComplete="current-password"
                      className="w-full pl-10 pr-11 py-3 rounded-xl text-sm font-semibold text-slate-700 outline-none"
                      style={inp(loginError)} onFocus={focusCyan} onBlur={blurBorder(loginError)} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={loading}
                  className="w-full py-3.5 rounded-2xl font-bold text-white text-base mt-2 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                  style={{ background:"linear-gradient(135deg,#06b6d4,#10b981)", boxShadow:"0 8px 32px rgba(6,182,212,0.4)" }}>
                  {loading
                    ? <span className="flex items-center justify-center gap-2"><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Signing in…</span>
                    : "Login"
                  }
                </button>
              </form>

              {/* Forgot password */}
              <div className="mt-5 text-center">
                <button onClick={() => { setView("forgot"); setLoginError(""); }}
                  className="text-sm font-bold text-violet-600 hover:text-violet-800 hover:underline underline-offset-2">
                  Forgot Password?
                </button>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-slate-400 text-xs font-bold">OR</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              {/* Register button */}
              <button onClick={() => setView("register")}
                className="w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all"
                style={{ background:"linear-gradient(135deg,#f0fffe,#ecfeff)", border:"2px solid rgba(6,182,212,0.35)", color:"#0e7490", boxShadow:"0 4px 16px rgba(6,182,212,0.12)" }}>
                <UserPlus className="w-4 h-4" />
                New here? Register
              </button>

              {/* Support */}
              <div className="mt-4 rounded-2xl px-4 py-3 text-center"
                style={{ background:"linear-gradient(135deg,#ecfeff,#f0fffe)", border:"1.5px solid rgba(6,182,212,0.2)" }}>
                <p className="text-slate-500 text-xs font-semibold mb-1">Having trouble logging in?</p>
                <a href="tel:7756909593" className="text-sm font-bold text-cyan-600 hover:text-cyan-800 flex items-center justify-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" /> Call Support: 7756909593
                </a>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
