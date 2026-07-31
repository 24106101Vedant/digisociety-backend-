import { useState } from "react";
import { Building2, Mail, User, Smartphone, CheckCircle2 } from "lucide-react";
import { API_BASE } from "@/api";

export default function EnquiryForm() {
  const [form, setForm] = useState({
    societyName: "", chairmanName: "", email: "", mobile: "",
  });
  const [showPopup, setShowPopup]   = useState(false);
  const [errors, setErrors]         = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError]     = useState("");

  function validate() {
    const e: Record<string, string> = {};
    if (!form.societyName.trim())  e.societyName  = "Society name is required";
    if (!form.chairmanName.trim()) e.chairmanName = "Chairman name is required";
    if (!form.email.trim())        e.email        = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email";
    if (!form.mobile.trim())       e.mobile       = "Mobile number is required";
    else if (!/^[6-9]\d{9}$/.test(form.mobile.trim())) e.mobile = "Enter a valid 10-digit mobile";
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSubmitting(true);
    setApiError("");

    try {
      console.log("Submitting enquiry to:", `${API_BASE}/enquiry`);

      const res = await fetch(`${API_BASE}/enquiry`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          society_name:  form.societyName.trim(),
          chairman_name: form.chairmanName.trim(),
          email:         form.email.trim().toLowerCase(),
          mobile:        form.mobile.trim(),
        }),
      });

      const data = await res.json();
      console.log("Response:", data);

      if (!data.success) {
        setApiError(data.message || "Something went wrong. Please try again.");
        return;
      }

      // Success
      setShowPopup(true);
      setForm({ societyName: "", chairmanName: "", email: "", mobile: "" });
      setErrors({});
    } catch (err) {
      console.error("Fetch error:", err);
      setApiError("Unable to submit. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleChange(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: "" }));
    setApiError("");
  }

  const inputStyle = (field: string) => ({
    background: "#f8fafc",
    border: errors[field] ? "1.5px solid #ef4444" : "1.5px solid #e2e8f0",
  });

  return (
    <>
      {/* ── Thank You Popup ─────────────────────────────────────── */}
      {showPopup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
          onClick={() => setShowPopup(false)}
        >
          <div
            className="relative w-full max-w-sm rounded-3xl p-8 text-center"
            style={{
              background: "linear-gradient(135deg, #ffffff, #ecfeff)",
              boxShadow: "0 24px 64px rgba(6,182,212,0.3), 0 4px 24px rgba(0,0,0,0.1)",
              border: "1.5px solid rgba(16,185,129,0.25)",
            }}
            onClick={e => e.stopPropagation()}
          >
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5"
              style={{ background: "linear-gradient(135deg, #059669, #10b981)", boxShadow: "0 8px 32px rgba(16,185,129,0.45)" }}
            >
              <CheckCircle2 className="w-10 h-10 text-white" />
            </div>
            <h3 className="font-black text-slate-800 text-xl mb-2" style={{ fontFamily: "'Raleway', sans-serif" }}>
              Thank You for Contacting Us!
            </h3>
            <p className="text-slate-500 font-semibold text-sm leading-relaxed mb-6">
              We have received your enquiry. Our team will contact you soon.
            </p>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-slate-100" />
              <span className="text-slate-300 text-xs font-bold">DigiSociety.in</span>
              <div className="flex-1 h-px bg-slate-100" />
            </div>
            <button
              onClick={() => setShowPopup(false)}
              className="w-full py-3 rounded-2xl font-black text-white text-sm transition-all hover:scale-[1.02] active:scale-95"
              style={{ background: "linear-gradient(135deg, #059669, #10b981)", boxShadow: "0 8px 24px rgba(16,185,129,0.4)" }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ── Form ────────────────────────────────────────────────── */}
      <form onSubmit={handleSubmit} className="space-y-3">

        {/* Society Name */}
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wide">Society Name</label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text" value={form.societyName}
              onChange={e => handleChange("societyName", e.target.value)}
              placeholder="e.g. Sunshine Co-op Society"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 outline-none transition-all"
              style={inputStyle("societyName")}
              onFocus={e => (e.currentTarget.style.border = "1.5px solid #06b6d4")}
              onBlur={e  => (e.currentTarget.style.border = errors.societyName ? "1.5px solid #ef4444" : "1.5px solid #e2e8f0")}
            />
          </div>
          {errors.societyName && <p className="text-red-500 text-[11px] font-bold mt-0.5">{errors.societyName}</p>}
        </div>

        {/* Chairman Name */}
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wide">Chairman Name</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text" value={form.chairmanName}
              onChange={e => handleChange("chairmanName", e.target.value)}
              placeholder="e.g. Rajesh Sharma"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 outline-none transition-all"
              style={inputStyle("chairmanName")}
              onFocus={e => (e.currentTarget.style.border = "1.5px solid #06b6d4")}
              onBlur={e  => (e.currentTarget.style.border = errors.chairmanName ? "1.5px solid #ef4444" : "1.5px solid #e2e8f0")}
            />
          </div>
          {errors.chairmanName && <p className="text-red-500 text-[11px] font-bold mt-0.5">{errors.chairmanName}</p>}
        </div>

        {/* Email */}
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wide">Email ID</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="email" value={form.email}
              onChange={e => handleChange("email", e.target.value)}
              placeholder="chairman@society.com"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 outline-none transition-all"
              style={inputStyle("email")}
              onFocus={e => (e.currentTarget.style.border = "1.5px solid #06b6d4")}
              onBlur={e  => (e.currentTarget.style.border = errors.email ? "1.5px solid #ef4444" : "1.5px solid #e2e8f0")}
            />
          </div>
          {errors.email && <p className="text-red-500 text-[11px] font-bold mt-0.5">{errors.email}</p>}
        </div>

        {/* Mobile */}
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wide">Mobile No</label>
          <div className="relative">
            <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="tel" value={form.mobile}
              onChange={e => handleChange("mobile", e.target.value.replace(/\D/g, "").slice(0, 10))}
              placeholder="e.g. 9876543210"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 outline-none transition-all"
              style={inputStyle("mobile")}
              onFocus={e => (e.currentTarget.style.border = "1.5px solid #06b6d4")}
              onBlur={e  => (e.currentTarget.style.border = errors.mobile ? "1.5px solid #ef4444" : "1.5px solid #e2e8f0")}
            />
          </div>
          {errors.mobile && <p className="text-red-500 text-[11px] font-bold mt-0.5">{errors.mobile}</p>}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 rounded-2xl font-black text-white text-sm mt-1 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
          style={{ background: "linear-gradient(135deg, #059669, #10b981)", boxShadow: "0 8px 24px rgba(16,185,129,0.4)" }}
        >
          {submitting
            ? <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
                Submitting…
              </span>
            : "Submit Enquiry"
          }
        </button>

        {/* API Error */}
        {apiError && (
          <div className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold"
            style={{ background: "#fef2f2", border: "1.5px solid #fecaca", color: "#ef4444" }}>
            ⚠️ {apiError}
          </div>
        )}

      </form>
    </>
  );
}
