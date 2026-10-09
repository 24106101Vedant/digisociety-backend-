import { useState } from "react";
import { ACCOUNT_GROUPS } from "@/app/pages/accountGroups";

type DrCr = "DR" | "CR";

interface CashEntry {
  id:           string;
  description:  string;
  accountGroup: string;
  address1:     string;
  address2:     string;
  address3:     string;
  address4:     string;
  phone:        string;
  email:        string;
  openingBal:   string;
  openingDrCr:  DrCr;
  closingBal:   string;
  closingDrCr:  DrCr;
  prevYearBal:  string;
  prevYearDrCr: DrCr;
}

const EMPTY: Omit<CashEntry, "id"> = {
  description:  "",
  accountGroup: "",
  address1:     "",
  address2:     "",
  address3:     "",
  address4:     "",
  phone:        "",
  email:        "",
  openingBal:   "",
  openingDrCr:  "DR",
  closingBal:   "",
  closingDrCr:  "DR",
  prevYearBal:  "",
  prevYearDrCr: "DR",
};

export default function CashMaster() {
  const [form,    setForm]    = useState<Omit<CashEntry, "id">>(EMPTY);
  const [records, setRecords] = useState<CashEntry[]>([]);
  const [editId,  setEditId]  = useState<string | null>(null);
  const [saved,   setSaved]   = useState(false);

  function set<K extends keyof typeof form>(key: K, val: typeof form[K]) {
    setForm(f => ({ ...f, [key]: val }));
  }

  function handleSave() {
    if (!form.description.trim()) return;
    if (editId) {
      setRecords(r => r.map(x => x.id === editId ? { ...form, id: editId } : x));
      setEditId(null);
    } else {
      setRecords(r => [...r, { ...form, id: String(Date.now()) }]);
    }
    setForm(EMPTY);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleEdit(rec: CashEntry) {
    const { id, ...rest } = rec;
    setForm(rest);
    setEditId(id);
    setSaved(false);
  }

  function handleDelete() {
    if (editId) {
      setRecords(r => r.filter(x => x.id !== editId));
      setEditId(null);
      setForm(EMPTY);
    }
  }

  function handleCancel() {
    setForm(EMPTY);
    setEditId(null);
    setSaved(false);
  }

  const DrCrRadio = ({
    label, value, onChange,
  }: { label: string; value: DrCr; onChange: (v: DrCr) => void }) => (
    <div className="flex flex-col gap-0.5 mt-1">
      {(["DR", "CR"] as DrCr[]).map(opt => (
        <label key={opt} className="flex items-center gap-1.5 cursor-pointer select-none">
          <input
            type="radio"
            name={label}
            checked={value === opt}
            onChange={() => onChange(opt)}
            className="accent-teal-500 w-3.5 h-3.5"
          />
          <span className="text-xs font-semibold text-slate-600">{opt}</span>
        </label>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">

      {/* Title */}
      <div className="flex items-center gap-2">
        <div className="w-1 h-6 rounded-full" style={{ background: "linear-gradient(180deg,#06b6d4,#10b981)" }} />
        <h2 className="font-black text-slate-800 text-lg" style={{ fontFamily: "'Raleway',sans-serif" }}>
          Cash Master
        </h2>
      </div>

      {/* Form card */}
      <div className="bg-white rounded-2xl p-6 space-y-5"
        style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.07)", border: "1.5px solid rgba(0,0,0,0.06)" }}>

        {/* Row 1 — Description + Account Group */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
              Description
            </label>
            <input
              type="text"
              placeholder="e.g. PETTY CASH"
              value={form.description}
              onChange={e => set("description", e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-semibold text-slate-700 bg-white outline-none focus:border-teal-400 transition-colors"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
              Account Group
            </label>
            <div className="relative">
              <select
                value={form.accountGroup}
                onChange={e => set("accountGroup", e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-semibold text-slate-700 bg-white outline-none focus:border-teal-400 appearance-none transition-colors"
              >
                <option value="">-- Select --</option>
                {ACCOUNT_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
              <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Row 2 — Address | Phone+Email | Opening+PrevYear | Closing */}
        <div className="grid grid-cols-1 sm:grid-cols-[2fr_2fr_auto_auto] gap-6 items-start">

          {/* Address — 4 lines */}
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
              Address
            </label>
            <div className="space-y-1.5">
              {(["address1","address2","address3","address4"] as const).map(k => (
                <input
                  key={k}
                  type="text"
                  value={form[k]}
                  onChange={e => set(k, e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-sm font-semibold text-slate-700 bg-white outline-none focus:border-teal-400 transition-colors"
                />
              ))}
            </div>
          </div>

          {/* Phone + Email */}
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                Phone No.
              </label>
              <input
                type="text"
                value={form.phone}
                onChange={e => set("phone", e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-semibold text-slate-700 bg-white outline-none focus:border-teal-400 transition-colors"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={form.email}
                onChange={e => set("email", e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-semibold text-slate-700 bg-white outline-none focus:border-teal-400 transition-colors"
              />
            </div>
          </div>

          {/* Opening Balance + Prev Year */}
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                Opening Balance
              </label>
              <div className="flex items-start gap-2">
                <input
                  type="text"
                  value={form.openingBal}
                  onChange={e => set("openingBal", e.target.value)}
                  className="w-28 px-3 py-2 rounded-lg border border-slate-300 text-sm font-semibold text-slate-700 bg-white outline-none focus:border-teal-400 transition-colors"
                />
                <DrCrRadio label="cash-opening" value={form.openingDrCr} onChange={v => set("openingDrCr", v)} />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                Prev Year Clg. Baln
              </label>
              <div className="flex items-start gap-2">
                <input
                  type="text"
                  value={form.prevYearBal}
                  onChange={e => set("prevYearBal", e.target.value)}
                  className="w-28 px-3 py-2 rounded-lg border border-slate-300 text-sm font-semibold text-slate-700 bg-white outline-none focus:border-teal-400 transition-colors"
                />
                <DrCrRadio label="cash-prevYear" value={form.prevYearDrCr} onChange={v => set("prevYearDrCr", v)} />
              </div>
            </div>
          </div>

          {/* Closing Balance */}
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
              Closing Balance
            </label>
            <div className="flex items-start gap-2">
              <input
                type="text"
                value={form.closingBal}
                onChange={e => set("closingBal", e.target.value)}
                className="w-28 px-3 py-2 rounded-lg border border-slate-300 text-sm font-semibold text-slate-700 bg-white outline-none focus:border-teal-400 transition-colors"
              />
              <DrCrRadio label="cash-closing" value={form.closingDrCr} onChange={v => set("closingDrCr", v)} />
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              className="px-6 py-2 rounded-lg text-sm font-black text-white transition-all hover:opacity-90 active:scale-95"
              style={{ background: "linear-gradient(135deg,#06b6d4,#10b981)" }}>
              {saved ? "✓ Saved" : "Save"}
            </button>
            <button
              onClick={handleCancel}
              className="px-5 py-2 rounded-lg text-sm font-bold text-slate-600 border border-slate-300 bg-white hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={!editId}
              className="px-5 py-2 rounded-lg text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: "linear-gradient(135deg,#f9a8d4,#fb7185)" }}>
              Delete
            </button>
          </div>
          <button
            onClick={handleCancel}
            className="px-5 py-2 rounded-lg text-sm font-bold text-slate-600 border border-slate-300 bg-white hover:bg-slate-50 transition-colors">
            Exit
          </button>
        </div>
      </div>

      {/* Saved records table */}
      {records.length > 0 && (
        <div className="bg-white rounded-2xl overflow-hidden"
          style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.06)", border: "1.5px solid rgba(0,0,0,0.06)" }}>
          <div className="grid grid-cols-[2fr_2fr_1fr_1fr] px-5 py-3 text-[10px] font-black uppercase tracking-widest"
            style={{ background: "linear-gradient(90deg,#ecfeff,#f0fffe)", borderBottom: "1.5px solid rgba(6,182,212,0.12)", color: "#0e7490" }}>
            <span>Description</span><span>Account Group</span><span>Opening Bal</span><span>Closing Bal</span>
          </div>
          {records.map(r => (
            <div key={r.id}
              onClick={() => handleEdit(r)}
              className="grid grid-cols-[2fr_2fr_1fr_1fr] px-5 py-3 text-sm text-slate-700 font-semibold hover:bg-cyan-50 cursor-pointer border-b border-slate-50 last:border-0 transition-colors">
              <span>{r.description}</span>
              <span className="text-slate-500">{r.accountGroup || "—"}</span>
              <span>{r.openingBal || "—"} <span className="text-xs text-slate-400">{r.openingDrCr}</span></span>
              <span>{r.closingBal || "—"} <span className="text-xs text-slate-400">{r.closingDrCr}</span></span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
