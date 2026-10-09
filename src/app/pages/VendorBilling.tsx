import { useState, useMemo } from "react";
import { Plus, Trash2, Search } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
interface BillingRow {
  id:          string;
  particular:  string;
  amount:      string;
  sgstAmt:     string;
  sgstPct:     string;
  cgstAmt:     string;
  cgstPct:     string;
  igstAmt:     string;
  hsnSac:      string;
}

interface BillRecord {
  id:           string;
  billNo:       string;
  vendorName:   string;
  billType:     string;
  billDate:     string;
  dueDate:      string;
  poNo:         string;
  title:        string;
  remarks:      string;
  rows:         BillingRow[];
  tdsPercent:   string;
  tds:          number;
  deduct:       string;
  totalBill:    number;
  roundedOff:   number;
}

// ── Constants ─────────────────────────────────────────────────────────────────
const BILL_TYPES = [
  "Purchase Bill",
  "Service Bill",
  "AMC Bill",
  "Repair Bill",
  "Maintenance Bill",
  "Other",
];

const PARTICULARS = [
  "Labour Charges",
  "Material Cost",
  "Service Charges",
  "Consultation Fees",
  "AMC Charges",
  "Repair Charges",
  "Transportation",
  "Miscellaneous",
];

const SHOW_OPTIONS = ["All", "10", "25", "50", "100"];

const EMPTY_ROW = (): BillingRow => ({
  id:       String(Date.now() + Math.random()),
  particular: "",
  amount:   "",
  sgstAmt:  "",
  sgstPct:  "",
  cgstAmt:  "",
  cgstPct:  "",
  igstAmt:  "",
  hsnSac:   "",
});

const EMPTY_FORM = {
  vendorName: "",
  billType:   "",
  billNo:     "",
  billDate:   "",
  dueDate:    "",
  poNo:       "",
  title:      "",
  remarks:    "",
  tdsPercent: "",
  deduct:     "",
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function toNum(s: string) { const n = parseFloat(s); return isNaN(n) ? 0 : n; }

function calcTotals(rows: BillingRow[], tdsPercent: string, deduct: string) {
  const totalAmt  = rows.reduce((s, r) => s + toNum(r.amount),  0);
  const totalSgst = rows.reduce((s, r) => s + toNum(r.sgstAmt), 0);
  const totalCgst = rows.reduce((s, r) => s + toNum(r.cgstAmt), 0);
  const totalIgst = rows.reduce((s, r) => s + toNum(r.igstAmt), 0);
  const gross     = totalAmt + totalSgst + totalCgst + totalIgst;
  const tds       = (gross * toNum(tdsPercent)) / 100;
  const totalBill = gross - tds - toNum(deduct);
  const rounded   = Math.round(totalBill);
  return { totalAmt, totalSgst, totalCgst, totalIgst, tds, totalBill, rounded };
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function VendorBilling() {
  const [form,    setForm]    = useState(EMPTY_FORM);
  const [rows,    setRows]    = useState<BillingRow[]>([EMPTY_ROW()]);
  const [records, setRecords] = useState<BillRecord[]>([]);
  const [editId,  setEditId]  = useState<string | null>(null);
  const [saved,   setSaved]   = useState(false);

  // Table controls
  const [search,   setSearch]  = useState("");
  const [showSize, setShowSize] = useState("All");

  function setF<K extends keyof typeof EMPTY_FORM>(key: K, val: string) {
    setForm(f => ({ ...f, [key]: val }));
  }

  // ── Row helpers ──────────────────────────────────────────────────────────
  function updateRow<K extends keyof BillingRow>(id: string, key: K, val: string) {
    setRows(rs => rs.map(r => r.id === id ? { ...r, [key]: val } : r));
  }

  function addRow() {
    setRows(rs => [...rs, EMPTY_ROW()]);
  }

  function removeRow(id: string) {
    setRows(rs => rs.length > 1 ? rs.filter(r => r.id !== id) : rs);
  }

  // ── Computed totals ──────────────────────────────────────────────────────
  const totals = useMemo(
    () => calcTotals(rows, form.tdsPercent, form.deduct),
    [rows, form.tdsPercent, form.deduct]
  );

  // ── Save / Reset ─────────────────────────────────────────────────────────
  function handleSave() {
    if (!form.vendorName.trim() || !form.billNo.trim()) return;
    const record: BillRecord = {
      id:         editId ?? String(Date.now()),
      billNo:     form.billNo,
      vendorName: form.vendorName,
      billType:   form.billType,
      billDate:   form.billDate,
      dueDate:    form.dueDate,
      poNo:       form.poNo,
      title:      form.title,
      remarks:    form.remarks,
      rows:       rows,
      tdsPercent: form.tdsPercent,
      tds:        totals.tds,
      deduct:     form.deduct,
      totalBill:  totals.totalBill,
      roundedOff: totals.rounded,
    };
    if (editId) {
      setRecords(rs => rs.map(r => r.id === editId ? record : r));
      setEditId(null);
    } else {
      setRecords(rs => [record, ...rs]);
    }
    handleRefresh();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleRefresh() {
    setForm(EMPTY_FORM);
    setRows([EMPTY_ROW()]);
    setEditId(null);
    setSaved(false);
  }

  function handleEdit(rec: BillRecord) {
    setForm({
      vendorName: rec.vendorName,
      billType:   rec.billType,
      billNo:     rec.billNo,
      billDate:   rec.billDate,
      dueDate:    rec.dueDate,
      poNo:       rec.poNo,
      title:      rec.title,
      remarks:    rec.remarks,
      tdsPercent: rec.tdsPercent,
      deduct:     rec.deduct,
    });
    setRows(rec.rows);
    setEditId(rec.id);
    setSaved(false);
  }

  function handleDelete(id: string) {
    setRecords(rs => rs.filter(r => r.id !== id));
    if (editId === id) handleRefresh();
  }

  // ── Filtered + paginated table rows ──────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return records.filter(r =>
      !q ||
      r.billNo.toLowerCase().includes(q) ||
      r.vendorName.toLowerCase().includes(q) ||
      r.billType.toLowerCase().includes(q)
    );
  }, [records, search]);

  const displayed = showSize === "All" ? filtered : filtered.slice(0, parseInt(showSize));

  // ── Small reusable inputs ─────────────────────────────────────────────────
  const TxtInput = ({ value, onChange, placeholder = "" }: {
    value: string; onChange: (v: string) => void; placeholder?: string;
  }) => (
    <input type="text" value={value} placeholder={placeholder}
      onChange={e => onChange(e.target.value)}
      className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-700 outline-none focus:border-teal-400 transition-colors" />
  );

  const NumInput = ({ value, onChange, placeholder = "0.00" }: {
    value: string; onChange: (v: string) => void; placeholder?: string;
  }) => (
    <input type="number" value={value} placeholder={placeholder} min={0} step="0.01"
      onChange={e => onChange(e.target.value)}
      className="w-full px-2 py-1.5 rounded-md border border-slate-200 bg-white text-xs font-semibold text-slate-700 outline-none focus:border-teal-400 transition-colors text-right" />
  );

  return (
    <div className="space-y-6">

      {/* Title */}
      <div className="flex items-center gap-2">
        <div className="w-1 h-6 rounded-full" style={{ background: "linear-gradient(180deg,#06b6d4,#10b981)" }} />
        <h2 className="font-black text-slate-800 text-lg" style={{ fontFamily: "'Raleway',sans-serif" }}>
          Vendor Billings
        </h2>
      </div>

      {/* ── Form card ─────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl p-6 space-y-5"
        style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.07)", border: "1.5px solid rgba(0,0,0,0.06)" }}>

        {/* Row 1 — Select Vendor | Select Bill Type */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Select Vendor</label>
            <input
              type="text"
              placeholder="Vendor name"
              value={form.vendorName}
              onChange={e => setF("vendorName", e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-700 outline-none focus:border-teal-400 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Select Bill Type</label>
            <div className="relative">
              <select value={form.billType} onChange={e => setF("billType", e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-700 outline-none focus:border-teal-400 appearance-none transition-colors">
                <option value="">Select</option>
                {BILL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Row 2 — Bill No | Bill Date | Due Date | PO No */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Bill No</label>
            <TxtInput value={form.billNo} onChange={v => setF("billNo", v)} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Bill Date</label>
            <input type="date" value={form.billDate} onChange={e => setF("billDate", e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-700 outline-none focus:border-teal-400 transition-colors" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Due Date</label>
            <input type="date" value={form.dueDate} onChange={e => setF("dueDate", e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-700 outline-none focus:border-teal-400 transition-colors" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">PO No</label>
            <TxtInput value={form.poNo} onChange={v => setF("poNo", v)} />
          </div>
        </div>

        {/* Row 3 — Title | Remarks */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Title</label>
            <TxtInput value={form.title} onChange={v => setF("title", v)} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Remarks</label>
            <TxtInput value={form.remarks} onChange={v => setF("remarks", v)} />
          </div>
        </div>

        {/* ── Billing Details ─────────────────────────────────────────────── */}
        <div>
          <h3 className="text-center text-sm font-black text-slate-700 tracking-widest uppercase mb-3">
            Billing Details
          </h3>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-3 py-2 text-left font-black text-slate-600 uppercase tracking-wide whitespace-nowrap">Bill Particulars</th>
                  <th className="px-2 py-2 text-center font-black text-slate-600 uppercase tracking-wide" colSpan={2}>Amount</th>
                  <th className="px-2 py-2 text-center font-black text-slate-600 uppercase tracking-wide" colSpan={2}>SGST</th>
                  <th className="px-2 py-2 text-center font-black text-slate-600 uppercase tracking-wide" colSpan={2}>CGST</th>
                  <th className="px-2 py-2 text-center font-black text-slate-600 uppercase tracking-wide" colSpan={2}>IGST</th>
                  <th className="px-2 py-2 text-center font-black text-slate-600 uppercase tracking-wide whitespace-nowrap">HSN/SAC</th>
                  <th className="px-2 py-2 text-center font-black text-slate-600 uppercase tracking-wide">Action</th>
                </tr>
                <tr className="bg-slate-50/50 border-b border-slate-200 text-slate-400">
                  <th className="px-3 py-1"></th>
                  <th className="px-2 py-1 font-semibold">Amt</th>
                  <th className="px-2 py-1 font-semibold">%</th>
                  <th className="px-2 py-1 font-semibold">Amt</th>
                  <th className="px-2 py-1 font-semibold">%</th>
                  <th className="px-2 py-1 font-semibold">Amt</th>
                  <th className="px-2 py-1 font-semibold">%</th>
                  <th className="px-2 py-1 font-semibold">Amt</th>
                  <th className="px-2 py-1"></th>
                  <th className="px-2 py-1"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50/40">
                    {/* Particular */}
                    <td className="px-2 py-2 min-w-[130px]">
                      <div className="relative">
                        <select value={row.particular}
                          onChange={e => updateRow(row.id, "particular", e.target.value)}
                          className="w-full px-2 py-1.5 rounded-md border border-slate-200 bg-white text-xs font-semibold text-slate-700 outline-none focus:border-teal-400 appearance-none transition-colors">
                          <option value="">Select</option>
                          {PARTICULARS.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                        <svg className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none"
                          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </td>
                    <td className="px-2 py-2 w-20"><NumInput value={row.amount}  onChange={v => updateRow(row.id,"amount",v)}  /></td>
                    <td className="px-2 py-2 w-16"><NumInput value={row.sgstPct} onChange={v => updateRow(row.id,"sgstPct",v)} placeholder="%" /></td>
                    <td className="px-2 py-2 w-20"><NumInput value={row.sgstAmt} onChange={v => updateRow(row.id,"sgstAmt",v)} /></td>
                    <td className="px-2 py-2 w-16"><NumInput value={row.cgstPct} onChange={v => updateRow(row.id,"cgstPct",v)} placeholder="%" /></td>
                    <td className="px-2 py-2 w-20"><NumInput value={row.cgstAmt} onChange={v => updateRow(row.id,"cgstAmt",v)} /></td>
                    <td className="px-2 py-2 w-16"><NumInput value={row.igstAmt} onChange={v => updateRow(row.id,"igstAmt",v)} placeholder="%" /></td>
                    <td className="px-2 py-2 w-20"><NumInput value={row.igstAmt} onChange={v => updateRow(row.id,"igstAmt",v)} /></td>
                    <td className="px-2 py-2 w-20"><NumInput value={row.hsnSac}  onChange={v => updateRow(row.id,"hsnSac",v)}  placeholder="" /></td>
                    <td className="px-2 py-2 text-center">
                      {rows.indexOf(row) === rows.length - 1 ? (
                        <button onClick={addRow}
                          className="w-7 h-7 rounded-full flex items-center justify-center text-white transition-all hover:opacity-80"
                          style={{ background: "linear-gradient(135deg,#06b6d4,#10b981)" }}>
                          <Plus className="w-4 h-4" />
                        </button>
                      ) : (
                        <button onClick={() => removeRow(row.id)}
                          className="w-7 h-7 rounded-full flex items-center justify-center text-white bg-red-400 hover:bg-red-500 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}

                {/* Totals row */}
                <tr className="bg-slate-50 font-black text-sm border-t-2 border-slate-200">
                  <td className="px-3 py-2 text-slate-700">Total</td>
                  <td className="px-2 py-2 text-right text-slate-700" colSpan={2}>{totals.totalAmt.toFixed(2)}</td>
                  <td className="px-2 py-2 text-right text-slate-700" colSpan={2}>{totals.totalSgst.toFixed(2)}</td>
                  <td className="px-2 py-2 text-right text-slate-700" colSpan={2}>{totals.totalCgst.toFixed(2)}</td>
                  <td className="px-2 py-2 text-right text-slate-700" colSpan={3}>{totals.totalIgst.toFixed(2)}</td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ── TDS / Deduct / Total row ─────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">TDS %</label>
            <TxtInput value={form.tdsPercent} onChange={v => setF("tdsPercent", v)} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">TDS</label>
            <input type="text" readOnly value={totals.tds.toFixed(2)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-700 outline-none text-right" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Deduct</label>
            <TxtInput value={form.deduct} onChange={v => setF("deduct", v)} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Total Bill</label>
            <input type="text" readOnly value={totals.totalBill.toFixed(2)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm font-black text-slate-800 outline-none text-right" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Rounded Off</label>
            <input type="text" readOnly value={totals.rounded.toFixed(2)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm font-black text-slate-800 outline-none text-right" />
          </div>
        </div>

        {/* ── Actions ──────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 pt-1 border-t border-slate-100">
          <button onClick={handleSave}
            className="px-7 py-2.5 rounded-lg text-sm font-black text-white transition-all hover:opacity-90 active:scale-95"
            style={{ background: "linear-gradient(135deg,#06b6d4,#10b981)" }}>
            {saved ? "✓ Saved" : "Save"}
          </button>
          <button onClick={handleRefresh}
            className="px-7 py-2.5 rounded-lg text-sm font-black text-white transition-all hover:opacity-90 active:scale-95"
            style={{ background: "linear-gradient(135deg,#64748b,#475569)" }}>
            Refresh
          </button>
        </div>
      </div>

      {/* ── Records table ─────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl overflow-hidden"
        style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.06)", border: "1.5px solid rgba(0,0,0,0.06)" }}>

        {/* Table controls */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-wrap gap-3">
          <div className="flex items-center gap-2 text-sm text-slate-500 font-semibold">
            Show
            <select value={showSize} onChange={e => setShowSize(e.target.value)}
              className="px-2 py-1 rounded-md border border-slate-200 text-sm font-semibold text-slate-700 outline-none focus:border-teal-400">
              {SHOW_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
            entries
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500 font-semibold">Search:</span>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-md border border-slate-200 text-sm font-semibold text-slate-700 outline-none focus:border-teal-400 w-44 transition-colors" />
            </div>
          </div>
        </div>

        {/* Header row */}
        <div className="grid grid-cols-[1fr_1.5fr_1fr_1fr_1.2fr_1fr_1fr_1fr_auto_auto_auto] px-4 py-3 text-[10px] font-black uppercase tracking-widest"
          style={{ background: "linear-gradient(90deg,#ecfeff,#f0fffe)", borderBottom: "1.5px solid rgba(6,182,212,0.12)", color: "#0e7490" }}>
          <span>Bill Number</span>
          <span>Vendor Name</span>
          <span>Bill Type</span>
          <span>Bill Date</span>
          <span>Total Net Amount</span>
          <span>Total Paid</span>
          <span>Balance</span>
          <span>Due Date</span>
          <span>Update</span>
          <span>Delete</span>
          <span>View Bill</span>
        </div>

        {displayed.length === 0 ? (
          <div className="py-12 text-center text-sm font-semibold text-slate-400">
            No data found
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {displayed.map(r => (
              <div key={r.id}
                className="grid grid-cols-[1fr_1.5fr_1fr_1fr_1.2fr_1fr_1fr_1fr_auto_auto_auto] px-4 py-3 text-xs text-slate-700 font-semibold items-center hover:bg-slate-50/60 transition-colors">
                <span className="truncate">{r.billNo}</span>
                <span className="truncate">{r.vendorName}</span>
                <span className="truncate text-slate-500">{r.billType || "—"}</span>
                <span>{r.billDate || "—"}</span>
                <span className="font-black text-slate-800">{r.roundedOff.toFixed(2)}</span>
                <span className="text-emerald-600 font-black">0.00</span>
                <span className="text-orange-500 font-black">{r.roundedOff.toFixed(2)}</span>
                <span>{r.dueDate || "—"}</span>
                <button onClick={() => handleEdit(r)}
                  className="px-2.5 py-1 rounded-md text-xs font-black text-white transition-all hover:opacity-80"
                  style={{ background: "linear-gradient(135deg,#06b6d4,#10b981)" }}>
                  Update
                </button>
                <button onClick={() => handleDelete(r.id)}
                  className="px-2.5 py-1 rounded-md text-xs font-black text-white bg-red-400 hover:bg-red-500 transition-colors">
                  Delete
                </button>
                <button
                  className="px-2.5 py-1 rounded-md text-xs font-black text-teal-600 border border-teal-200 hover:bg-teal-50 transition-colors">
                  View
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 text-xs text-slate-400 font-semibold">
          Showing {displayed.length} of {filtered.length} entries
        </div>
      </div>
    </div>
  );
}
