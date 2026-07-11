import { useState } from "react";
import {
  Building2,
  Users,
  IndianRupee,
  ShieldCheck,
  Eye,
  EyeOff,
  Mail,
  Lock,
  ArrowLeft,
  CheckCircle2,
  Phone,
} from "lucide-react";
import logo from "@/assets/logo.png.jpg";

// ── Valid credentials ──────────────────────────────────────────────────────
// These are used for direct login (no backend required).
// When a backend is running on API_BASE, it is tried first and these act as fallback.
const VALID_EMAIL    = "digisociety.in@gmail.com";
const VALID_PASSWORD = "digisociety";
const API_BASE       = "http://localhost:4001/api";

interface LoginPageProps {
  onBack: () => void;
  onLoginSuccess: () => void;
}

const FEATURES = [
  { icon: Users, text: "Manage all member records digitally" },
  { icon: IndianRupee, text: "Track maintenance & payments easily" },
  { icon: ShieldCheck, text: "Secure gate & facility management" },
  { icon: Building2, text: "500+ societies trust DigiSociety" },
];

export default function LoginPage({ onBack, onLoginSuccess }: LoginPageProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ── Forgot password state ─────────────────────────────────────────────────
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotError, setForgotError] = useState("");

  // ── Login handler ─────────────────────────────────────────────────────────
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const emailInput = username.trim().toLowerCase();

    try {
      // Attempt backend first (timeout after 2 seconds so we don't hang)
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
        setLoading(false);
        onLoginSuccess();
        return;
      }
      // Backend returned an error (wrong credentials via API)
      setError(data.message || "Invalid email or password.");
      setLoading(false);
      return;
    } catch {
      // Backend is unreachable — use local credential check
    }

    // ── Local credential fallback ──────────────────────────────────────────
    await new Promise((r) => setTimeout(r, 600)); // small UX delay
    if (
      emailInput === VALID_EMAIL.toLowerCase() &&
      password === VALID_PASSWORD
    ) {
      const user = {
        id: 1,
        email: VALID_EMAIL,
        full_name: "DigiSociety Admin",
        role: "admin",
      };
      localStorage.setItem("ds_token", "LOCAL_AUTH");
      localStorage.setItem("ds_user", JSON.stringify(user));
      setLoading(false);
      onLoginSuccess();
    } else {
      setError("Invalid email or password. Please try again.");
      setLoading(false);
    }
  }

  // ── Forgot password handler — calls the backend API ─────────────────────
  async function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    setForgotError("");
    if (!forgotEmail.trim()) {
      setForgotError("Please enter your registered email address.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail)) {
      setForgotError("Please enter a valid email address.");
      return;
    }

    try {
      await fetch(`${API_BASE}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail.trim() }),
      });
    } catch {
      // We still show success to prevent email enumeration
    }

    setForgotSent(true);
  }

  return (
    <div
      className="min-h-screen flex"
      style={{
        background: "linear-gradient(135deg, #ecfeff 0%, #f0fffe 50%, #fdf4ff 100%)",
      }}
    >
      {/* ── LEFT PANEL ─── brand + features ──────────────────────────────── */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden"
        style={{
          background:
            "linear-gradient(160deg, #e0f7fa 0%, #b2ebf2 30%, #e8f5e9 60%, #f3e5f5 100%)",
        }}
      >
        {/* Decorative blobs */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-cyan-200/40 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-violet-200/30 rounded-full blur-3xl pointer-events-none translate-x-1/3 translate-y-1/3" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-emerald-200/25 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2" />

        {/* Logo + Brand */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <img
              src={logo}
              alt="DigiSociety Logo"
              className="h-12 w-auto"
              style={{
                background: "white",
                borderRadius: "12px",
                padding: "4px 10px",
                boxShadow: "0 4px 16px rgba(6,182,212,0.2)",
              }}
            />
            <div>
              <p
                className="font-black text-2xl text-cyan-700 leading-tight"
                style={{ fontFamily: "'Pacifico', cursive" }}
              >
                DigiSociety
              </p>
              <p className="text-xs text-teal-600 font-bold tracking-widest uppercase">.in</p>
            </div>
          </div>
          <button
            onClick={onBack}
            className="mt-4 inline-flex items-center gap-1.5 text-sm text-teal-700 font-bold hover:text-teal-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </button>
        </div>

        {/* Hero text */}
        <div className="relative z-10 flex-1 flex flex-col justify-center py-10">
          <h2
            className="text-4xl xl:text-5xl font-black leading-tight mb-4"
            style={{ fontFamily: "'Raleway', sans-serif" }}
          >
            <span
              style={{
                background: "linear-gradient(90deg, #06b6d4, #10b981)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Smart Society
            </span>
            <br />
            <span
              style={{
                background: "linear-gradient(90deg, #7c3aed, #ec4899)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Management
            </span>
            <br />
            <span
              style={{
                background: "linear-gradient(90deg, #f97316, #ef4444)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Platform
            </span>
          </h2>
          <p className="text-slate-600 font-semibold text-base leading-relaxed max-w-sm mb-8">
            India's most trusted digital solution for housing societies. Manage members,
            maintenance, accounts and security — all from one dashboard.
          </p>

          {/* Feature list */}
          <div className="space-y-3">
            {FEATURES.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: "linear-gradient(135deg, #06b6d4, #10b981)",
                    boxShadow: "0 4px 12px rgba(6,182,212,0.3)",
                  }}
                >
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <span className="text-slate-700 font-semibold text-sm">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom contact strip */}
        <div
          className="relative z-10 flex items-center gap-4 rounded-2xl px-5 py-3 mt-4"
          style={{
            background: "rgba(255,255,255,0.7)",
            border: "1px solid rgba(6,182,212,0.2)",
            backdropFilter: "blur(10px)",
          }}
        >
          <Phone className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span className="text-slate-700 font-bold text-sm">
            Need help?{" "}
            <a href="tel:7756909593" className="text-cyan-600 hover:underline">
              7756909593
            </a>
          </span>
          <span className="text-slate-400 text-xs ml-auto font-semibold">Mon–Sat, 9am–7pm</span>
        </div>
      </div>

      {/* ── RIGHT PANEL ─── login / forgot password form ─────────────────── */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center px-6 py-12 relative">
        {/* Mobile back button */}
        <button
          onClick={onBack}
          className="lg:hidden absolute top-5 left-5 inline-flex items-center gap-1.5 text-sm text-teal-700 font-bold hover:text-teal-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <img
              src={logo}
              alt="DigiSociety Logo"
              className="h-10 w-auto"
              style={{
                background: "white",
                borderRadius: "10px",
                padding: "3px 8px",
                boxShadow: "0 4px 12px rgba(6,182,212,0.2)",
              }}
            />
            <span
              className="font-black text-xl text-cyan-700"
              style={{ fontFamily: "'Pacifico', cursive" }}
            >
              DigiSociety
            </span>
          </div>

          {/* ── FORGOT PASSWORD VIEW ──────────────────────────────────────── */}
          {showForgot ? (
            <div
              className="rounded-3xl p-8"
              style={{
                background: "rgba(255,255,255,0.92)",
                boxShadow:
                  "0 20px 60px rgba(6,182,212,0.15), 0 4px 20px rgba(0,0,0,0.06)",
                border: "1.5px solid rgba(6,182,212,0.18)",
                backdropFilter: "blur(16px)",
              }}
            >
              {forgotSent ? (
                /* Success state */
                <div className="text-center py-4">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                    style={{ background: "linear-gradient(135deg, #d1fae5, #a7f3d0)" }}
                  >
                    <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h3
                    className="text-2xl font-black text-slate-800 mb-2"
                    style={{ fontFamily: "'Raleway', sans-serif" }}
                  >
                    Email Sent!
                  </h3>
                  <p className="text-slate-500 font-semibold text-sm mb-6">
                    If <span className="text-cyan-600 font-bold">{forgotEmail}</span> is
                    registered, you'll receive a password reset link shortly.
                  </p>
                  <button
                    onClick={() => {
                      setShowForgot(false);
                      setForgotSent(false);
                      setForgotEmail("");
                    }}
                    className="w-full py-3 rounded-2xl font-bold text-white text-sm transition-all hover:scale-[1.02]"
                    style={{
                      background: "linear-gradient(135deg, #06b6d4, #10b981)",
                      boxShadow: "0 8px 24px rgba(6,182,212,0.35)",
                    }}
                  >
                    Back to Login
                  </button>
                </div>
              ) : (
                /* Forgot password form */
                <>
                  <button
                    onClick={() => {
                      setShowForgot(false);
                      setForgotError("");
                      setForgotEmail("");
                    }}
                    className="inline-flex items-center gap-1.5 text-sm text-teal-700 font-bold hover:text-teal-900 mb-6 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Login
                  </button>

                  <h2
                    className="text-2xl font-black text-slate-800 mb-1"
                    style={{ fontFamily: "'Raleway', sans-serif" }}
                  >
                    Forgot Password?
                  </h2>
                  <p className="text-slate-500 font-semibold text-sm mb-6">
                    Enter your registered email and we'll send you a reset link.
                  </p>

                  <form onSubmit={handleForgot} className="space-y-5">
                    {/* Email field */}
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
                        Registered Email
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="email"
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          placeholder="your@email.com"
                          className="w-full pl-10 pr-4 py-3 rounded-xl text-sm font-semibold text-slate-700 outline-none transition-all"
                          style={{
                            background: "#f8fafc",
                            border: forgotError
                              ? "1.5px solid #ef4444"
                              : "1.5px solid #e2e8f0",
                          }}
                          onFocus={(e) =>
                            (e.currentTarget.style.border = "1.5px solid #06b6d4")
                          }
                          onBlur={(e) =>
                            (e.currentTarget.style.border = forgotError
                              ? "1.5px solid #ef4444"
                              : "1.5px solid #e2e8f0")
                          }
                        />
                      </div>
                      {forgotError && (
                        <p className="text-red-500 text-xs font-bold mt-1.5">{forgotError}</p>
                      )}
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 rounded-2xl font-bold text-white text-sm transition-all hover:scale-[1.02] active:scale-95"
                      style={{
                        background: "linear-gradient(135deg, #7c3aed, #ec4899)",
                        boxShadow: "0 8px 24px rgba(124,58,237,0.35)",
                      }}
                    >
                      Send Reset Link
                    </button>
                  </form>
                </>
              )}
            </div>
          ) : (
            /* ── LOGIN FORM ──────────────────────────────────────────────── */
            <div
              className="rounded-3xl p-8"
              style={{
                background: "rgba(255,255,255,0.92)",
                boxShadow:
                  "0 20px 60px rgba(6,182,212,0.15), 0 4px 20px rgba(0,0,0,0.06)",
                border: "1.5px solid rgba(6,182,212,0.18)",
                backdropFilter: "blur(16px)",
              }}
            >
              {/* Header */}
              <div className="mb-7">
                <h2
                  className="text-3xl font-black text-slate-800 mb-1"
                  style={{ fontFamily: "'Raleway', sans-serif" }}
                >
                  Welcome Back!
                </h2>
                <p className="text-slate-500 font-semibold text-sm">
                  Sign in to your DigiSociety account
                </p>
              </div>

              {/* Error banner */}
              {error && (
                <div
                  className="flex items-center gap-2 rounded-xl px-4 py-3 mb-5 text-sm font-bold"
                  style={{
                    background: "#fef2f2",
                    border: "1.5px solid #fecaca",
                    color: "#ef4444",
                  }}
                >
                  <span>⚠️</span>
                  {error}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-5">
                {/* Username / Email */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
                    Username / Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value);
                        setError("");
                      }}
                      placeholder="Enter your email"
                      required
                      autoComplete="username"
                      className="w-full pl-10 pr-4 py-3 rounded-xl text-sm font-semibold text-slate-700 outline-none transition-all"
                      style={{
                        background: "#f8fafc",
                        border: error ? "1.5px solid #ef4444" : "1.5px solid #e2e8f0",
                      }}
                      onFocus={(e) =>
                        (e.currentTarget.style.border = "1.5px solid #06b6d4")
                      }
                      onBlur={(e) =>
                        (e.currentTarget.style.border = error
                          ? "1.5px solid #ef4444"
                          : "1.5px solid #e2e8f0")
                      }
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError("");
                      }}
                      placeholder="Enter your password"
                      required
                      autoComplete="current-password"
                      className="w-full pl-10 pr-11 py-3 rounded-xl text-sm font-semibold text-slate-700 outline-none transition-all"
                      style={{
                        background: "#f8fafc",
                        border: error ? "1.5px solid #ef4444" : "1.5px solid #e2e8f0",
                      }}
                      onFocus={(e) =>
                        (e.currentTarget.style.border = "1.5px solid #06b6d4")
                      }
                      onBlur={(e) =>
                        (e.currentTarget.style.border = error
                          ? "1.5px solid #ef4444"
                          : "1.5px solid #e2e8f0")
                      }
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Login button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-2xl font-bold text-white text-base transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 mt-2"
                  style={{
                    background: "linear-gradient(135deg, #06b6d4, #10b981)",
                    boxShadow: "0 8px 32px rgba(6,182,212,0.4)",
                  }}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg
                        className="animate-spin w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v8H4z"
                        />
                      </svg>
                      Signing in…
                    </span>
                  ) : (
                    "Login"
                  )}
                </button>
              </form>

              {/* Forgot password link */}
              <div className="mt-5 text-center">
                <button
                  onClick={() => {
                    setShowForgot(true);
                    setError("");
                  }}
                  className="text-sm font-bold text-violet-600 hover:text-violet-800 transition-colors hover:underline underline-offset-2"
                >
                  Forgot Password?
                </button>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-slate-400 text-xs font-bold">OR</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              {/* Contact support */}
              <div
                className="rounded-2xl px-4 py-3 text-center"
                style={{
                  background: "linear-gradient(135deg, #ecfeff, #f0fffe)",
                  border: "1.5px solid rgba(6,182,212,0.2)",
                }}
              >
                <p className="text-slate-500 text-xs font-semibold mb-1">
                  Having trouble logging in?
                </p>
                <a
                  href="tel:7756909593"
                  className="text-sm font-bold text-cyan-600 hover:text-cyan-800 flex items-center justify-center gap-1.5"
                >
                  <Phone className="w-3.5 h-3.5" />
                  Call Support: 7756909593
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
