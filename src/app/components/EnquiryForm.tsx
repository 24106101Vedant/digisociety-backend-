import { useState } from "react";
import { Building2, Mail, User, Smartphone } from "lucide-react";
import { API_BASE } from "@/api";

export default function EnquiryForm() {
  const [societyName,  setSocietyName]  = useState("");
  const [chairmanName, setChairmanName] = useState("");
  const [email,        setEmail]        = useState("");
  const [mobile,       setMobile]       = useState("");
  const [status,       setStatus]       = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message,      setMessage]      = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // ── Basic validation ──────────────────────────────────────────
    if (!societyName.trim() || !chairmanName.trim() || !email.trim() || !mobile.trim()) {
      setStatus("error");
      setMessage("All fields are required.");
      return;
    }

    const payload = {
      society_name:  societyName.trim(),
      chairman_name: chairmanName.trim(),
      email:         email.trim().toLowerCase(),
      mobile:        mobile.trim(),
    };

    console.log("▶ Sending enquiry to:", `${API_BASE}/enquiry`);
    console.log("▶ Payload:", payload);

    setStatus("loading");
    setMessage("");

    // ── Fetch ─────────────────────────────────────────────────────
    let res: Response;
    try {
      res = await fetch(`${API_BASE}/enquiry`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });
    } catch (networkErr) {
      console.error("✖ Network error:", networkErr);
      setStatus("error");
      setMessage("Network error — could not reach the server. Check console.");
      return;
    }

    // ── Parse JSON ────────────────────────────────────────────────
    let data: { success: boolean; message?: string };
    try {
      data = await res.json();
    } catch (parseErr) {
      console.error("✖ JSON parse error:", parseErr);
      setStatus("error");
      setMessage(`Server returned status ${res.status} but no JSON.`);
      return;
    }

    console.log("◀ Response status:", res.status);
    console.log("◀ Response body:",   data);

    // ── Handle result ─────────────────────────────────────────────
    if (!res.ok || !data.success) {
      setStatus("error");
      setMessage(data.message || `Error ${res.status} — check console.`);
      return;
    }

    // ── Success ───────────────────────────────────────────────────
    setStatus("success");
    setMessage("Enquiry submitted successfully! We will contact you soon.");
    setSocietyName("");
    setChairmanName("");
    setEmail("");
    setMobile("");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3" noValidate>

      {/* Society Name */}
      <div>
        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wide">
          Society Name
        </label>
        <div className="relative">
          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={societyName}
            onChange={e => setSocietyName(e.target.value)}
            placeholder="e.g. Sunshine Co-op Society"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 outline-none"
            style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0" }}
            onFocus={e => (e.currentTarget.style.border = "1.5px solid #06b6d4")}
            onBlur={e  => (e.currentTarget.style.border = "1.5px solid #e2e8f0")}
          />
        </div>
      </div>

      {/* Chairman Name */}
      <div>
        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wide">
          Chairman Name
        </label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={chairmanName}
            onChange={e => setChairmanName(e.target.value)}
            placeholder="e.g. Rajesh Sharma"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 outline-none"
            style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0" }}
            onFocus={e => (e.currentTarget.style.border = "1.5px solid #06b6d4")}
            onBlur={e  => (e.currentTarget.style.border = "1.5px solid #e2e8f0")}
          />
        </div>
      </div>

      {/* Email */}
      <div>
        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wide">
          Email ID
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="chairman@society.com"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 outline-none"
            style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0" }}
            onFocus={e => (e.currentTarget.style.border = "1.5px solid #06b6d4")}
            onBlur={e  => (e.currentTarget.style.border = "1.5px solid #e2e8f0")}
          />
        </div>
      </div>

      {/* Mobile */}
      <div>
        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wide">
          Mobile No
        </label>
        <div className="relative">
          <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="tel"
            value={mobile}
            onChange={e => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
            placeholder="e.g. 9876543210"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 outline-none"
            style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0" }}
            onFocus={e => (e.currentTarget.style.border = "1.5px solid #06b6d4")}
            onBlur={e  => (e.currentTarget.style.border = "1.5px solid #e2e8f0")}
          />
        </div>
      </div>

      {/* Submit button */}
      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full py-3 rounded-2xl font-black text-white text-sm mt-1 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
        style={{ background: "linear-gradient(135deg, #059669, #10b981)", boxShadow: "0 8px 24px rgba(16,185,129,0.4)" }}
      >
        {status === "loading" ? "Submitting…" : "Submit Enquiry"}
      </button>

      {/* Status messages */}
      {status === "error" && (
        <p className="text-red-500 text-xs font-bold text-center bg-red-50 border border-red-200 rounded-xl py-2 px-3">
          ⚠️ {message}
        </p>
      )}
      {status === "success" && (
        <p className="text-emerald-600 text-xs font-bold text-center bg-emerald-50 border border-emerald-200 rounded-xl py-2 px-3">
          ✅ {message}
        </p>
      )}

    </form>
  );
}
