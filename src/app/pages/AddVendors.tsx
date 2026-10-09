import { useState } from "react";
import { ACCOUNT_STRUCTURE, ACCOUNT_HEADS, AccountHead } from "@/app/pages/accountGroups";

// ── Facility options ──────────────────────────────────────────────────────────
const FACILITY_OPTIONS = [
  "Lift Maintenance",
  "Security Services",
  "Housekeeping",
  "Electrical Works",
  "Plumbing Works",
  "Pest Control",
  "Gardening",
  "CCTV / Security Systems",
  "Water Tank Cleaning",
  "Fire Safety Services",
  "Painting Works",
  "Civil Works",
  "Other",
];

const RATING_OPTIONS = ["1 - Poor", "2 - Below Average", "3 - Average", "4 - Good", "5 - Excellent"];

const CR_DR_OPTIONS = ["CR", "DR"];

// ── Empty form state ──────────────────────────────────────────────────────────
const EMPTY = {
  vendorCompanyName:  "",
  service:            "",
  contactPersonName:  "",
  phoneNumber:        "",
  panNo:              "",
  gstNo:              "",
  companyEmail:       "",
  comments:           "",
  amcStartDate:       "",
  amcEndDate:         "",
  selectFacility:     "",
  listOfSubCommittee: "",
  alertDays:          "",
  rating:             "",
  openingBalance:     "",
  crDr:               "",
  accountHead:        "" as AccountHead | "",
  accountGroup:       "",
  accountSubgroup:    "",
};

type FormState = typeof EMPTY;

interface VendorRecord extends FormState { id: string; }

export default function AddVendors() {
  const [form,    setForm]    = useState<FormState>(EMPTY);
  const [records, setRecords] = useState<VendorRecord[]>([]);
  const [editId,  setEditId]  = useState<string | null>(null);
  const [saved,   setSaved]   = useState(false);

  // ── Derived dropdowns based on accountHead selection ──────────────────────
  const groupOptions: string[] = form.accountHead
    ? Object.keys(ACCOUNT_STRUCTURE[form.accountHead as AccountHead])
    : [];

  const subgroupOptions: string[] = form.accountHead && form.accountGroup
    ? ACCOUNT_STRUCTURE[form.accountHead as AccountHead][form.accountGroup] ?? []
    : [];

  function set<K extends keyof FormState>(key: K, val: FormState[K]) {
    setForm(f => {
      const next = { ...f, [key]: val };
      // Reset cascading dropdowns when parent changes
      if (key === "accountHead")  { next.accountGroup = ""; next.accountSubgroup = ""; }
      if (key === "accountGroup") { next.accountSubgroup = ""; }
      return next;
    });
  }

  function handleSave() {
    if (!form.vendorCompanyName.trim()) return;
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

  function handleRefresh() {
    setForm(EMPTY);
    setEditId(null);
    setSaved(false);
  }

  function handleEdit(rec: VendorRecord) {
    const { id, ...rest } = rec;
    setForm(rest);
    setEditId(id);
    setSaved(false);
  }

  // ── Reusable field components ─────────────────────────────────────────────
  const Label = ({ text }: { text: string }) => (
    <label className="block text-xs font-semibold text-slate-500 mb-1.5">{text}</label>
  );

  const TextInput = ({
    value, onChange, placeholder = "",
  }: { value: string; onChange: (v: string) => void; placeholder?: string }) => (
    <input
      type="text"
      value={value}
      placeholder={placeholder}
      onChange={e => onChange(e.target.value)}
      className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-700 outline-none focus:border-teal-400 transition-colors"
    />
  );

  const SelectInput = ({
    value, onChange, options, placeholder = "Select",
  }: { value: string; onChange: (v: string) => void; options: string[]; placeholder?: string }) => (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-700 outline-none focus:border-teal-400 appearance-none transition-colors"
      >
        <option value="">{placeholder}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  );

  return (
    <div className="space-y-6">

      {/* Page title */}
      <div className="flex items-center gap-2">
        <div className="w-1 h-6 rounded-full" style={{ background: "linear-gradient(180deg,#06b6d4,#10b981)" }} />
        <h2 className="font-black text-slate-800 text-lg" style={{ fontFamily: "'Raleway',sans-serif" }}>
          Add Vendor
        </h2>
      </div>

      {/* Form card */}
      <div className="bg-white rounded-2xl p-6 space-y-5"
        style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.07)", border: "1.5px solid rgba(0,0,0,0.06)" }}>

        {/* Row 1 — Vendor Company Name | Service */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <Label text="Vendor Company Name" />
            <TextInput value={form.vendorCompanyName} onChange={v => set("vendorCompanyName", v)} />
          </div>
          <div>
            <Label text="Service" />
            <TextInput value={form.service} onChange={v => set("service", v)} />
          </div>
        </div>

        {/* Row 2 — Contact Person Name | Phone Number */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <Label text="Contact Person Name" />
            <TextInput value={form.contactPersonName} onChange={v => set("contactPersonName", v)} />
          </div>
          <div>
            <Label text="Phone Number" />
            <TextInput value={form.phoneNumber} onChange={v => set("phoneNumber", v)} />
          </div>
        </div>

        {/* Row 3 — PAN No | GST No */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <Label text="PAN No" />
            <TextInput value={form.panNo} onChange={v => set("panNo", v)} />
          </div>
          <div>
            <Label text="GST No" />
            <TextInput value={form.gstNo} onChange={v => set("gstNo", v)} />
          </div>
        </div>

        {/* Row 4 — Company Email Address | Comments */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <Label text="Company Email Address" />
            <TextInput value={form.companyEmail} onChange={v => set("companyEmail", v)} />
          </div>
          <div>
            <Label text="Comments" />
            <TextInput value={form.comments} onChange={v => set("comments", v)} />
          </div>
        </div>

        {/* Row 5 — AMC Start Date | AMC End Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <Label text="AMC Start Date" />
            <input
              type="date"
              value={form.amcStartDate}
              onChange={e => set("amcStartDate", e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-700 outline-none focus:border-teal-400 transition-colors"
            />
          </div>
          <div>
            <Label text="AMC End Date" />
            <input
              type="date"
              value={form.amcEndDate}
              onChange={e => set("amcEndDate", e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-700 outline-none focus:border-teal-400 transition-colors"
            />
          </div>
        </div>

        {/* Row 6 — Select Facility | List of Sub Committee (textarea) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <Label text="Select Facility" />
            <SelectInput
              value={form.selectFacility}
              onChange={v => set("selectFacility", v)}
              options={FACILITY_OPTIONS}
              placeholder="Select"
            />
          </div>
          <div>
            <Label text="List of Sub Committee" />
            <textarea
              rows={3}
              value={form.listOfSubCommittee}
              onChange={e => set("listOfSubCommittee", e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-700 outline-none focus:border-teal-400 resize-none transition-colors"
            />
          </div>
        </div>

        {/* Row 7 — Alert Days | Rating */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <Label text="Alert Days" />
            <TextInput value={form.alertDays} onChange={v => set("alertDays", v)} />
          </div>
          <div>
            <Label text="Rating" />
            <SelectInput
              value={form.rating}
              onChange={v => set("rating", v)}
              options={RATING_OPTIONS}
              placeholder="Select"
            />
          </div>
        </div>

        {/* Row 8 — Opening Balance | CR/DR */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <Label text="Opening Balance" />
            <TextInput value={form.openingBalance} onChange={v => set("openingBalance", v)} />
          </div>
          <div>
            <Label text="CR/DR" />
            <SelectInput
              value={form.crDr}
              onChange={v => set("crDr", v)}
              options={CR_DR_OPTIONS}
              placeholder="Select"
            />
          </div>
        </div>

        {/* Row 9 — Account Head | Account Group | Account Subgroup */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div>
            <Label text="Account Head" />
            <SelectInput
              value={form.accountHead}
              onChange={v => set("accountHead", v as AccountHead | "")}
              options={ACCOUNT_HEADS}
              placeholder="Select Tally Name"
            />
          </div>
          <div>
            <Label text="Account Group" />
            <SelectInput
              value={form.accountGroup}
              onChange={v => set("accountGroup", v)}
              options={groupOptions}
              placeholder="Select Group"
            />
          </div>
          <div>
            <Label text="Account Subgroup" />
            <SelectInput
              value={form.accountSubgroup}
              onChange={v => set("accountSubgroup", v)}
              options={subgroupOptions}
              placeholder="Select Group"
            />
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-100 pt-4 flex items-center gap-3">
          <button
            onClick={handleSave}
            className="px-7 py-2.5 rounded-lg text-sm font-black text-white transition-all hover:opacity-90 active:scale-95"
            style={{ background: "linear-gradient(135deg,#06b6d4,#10b981)" }}>
            {saved ? "✓ Saved" : "Save"}
          </button>
          <button
            onClick={handleRefresh}
            className="px-7 py-2.5 rounded-lg text-sm font-black text-white transition-all hover:opacity-90 active:scale-95"
            style={{ background: "linear-gradient(135deg,#64748b,#475569)" }}>
            Refresh
          </button>
        </div>
      </div>

      {/* Saved records table */}
      {records.length > 0 && (
        <div className="bg-white rounded-2xl overflow-hidden"
          style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.06)", border: "1.5px solid rgba(0,0,0,0.06)" }}>
          <div className="grid grid-cols-[2fr_2fr_1fr_1fr_1fr] px-5 py-3 text-[10px] font-black uppercase tracking-widest"
            style={{ background: "linear-gradient(90deg,#ecfeff,#f0fffe)", borderBottom: "1.5px solid rgba(6,182,212,0.12)", color: "#0e7490" }}>
            <span>Company Name</span>
            <span>Service</span>
            <span>Contact</span>
            <span>Phone</span>
            <span>Rating</span>
          </div>
          {records.map(r => (
            <div key={r.id}
              onClick={() => handleEdit(r)}
              className="grid grid-cols-[2fr_2fr_1fr_1fr_1fr] px-5 py-3 text-sm text-slate-700 font-semibold hover:bg-cyan-50 cursor-pointer border-b border-slate-50 last:border-0 transition-colors">
              <span className="truncate">{r.vendorCompanyName}</span>
              <span className="text-slate-500 truncate">{r.service || "—"}</span>
              <span className="truncate">{r.contactPersonName || "—"}</span>
              <span>{r.phoneNumber || "—"}</span>
              <span>{r.rating || "—"}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
