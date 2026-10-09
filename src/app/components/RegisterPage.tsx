/**
 * RegisterPage — reusable shell for every register page.
 *
 * Props:
 *   title       — page heading (e.g. "Form I Register")
 *   columns     — column definitions  { key, label, width? }
 *   emptyRow    — factory that returns a blank record
 *   children?   — optional extra UI below the toolbar
 */
import { useState, useRef } from "react";
import { Download, Upload, Plus, Trash2, Save, Search } from "lucide-react";

export interface ColDef {
  key:    string;
  label:  string;
  width?: string;
  type?:  "text" | "date" | "number" | "select";
  options?: string[];
}

interface Props<T extends Record<string, string>> {
  title:     string;
  columns:   ColDef[];
  emptyRow:  () => T;
  children?: React.ReactNode;
}

/** Convert array-of-objects to CSV string */
function toCSV<T extends Record<string, string>>(cols: ColDef[], rows: T[]): string {
  const header = cols.map(c => `"${c.label}"`).join(",");
  const body   = rows.map(row =>
    cols.map(c => `"${(row[c.key] ?? "").replace(/"/g, '""')}`).join(",")
  );
  return [header, ...body].join("\r\n");
}

/** Trigger browser download */
function downloadFile(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Parse CSV string back to rows */
function parseCSV(text: string): string[][] {
  return text
    .split(/\r?\n/)
    .filter(l => l.trim())
    .map(line => {
      const cells: string[] = [];
      let cur = "", inQ = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
          if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
          else inQ = !inQ;
        } else if (ch === "," && !inQ) { cells.push(cur); cur = ""; }
        else cur += ch;
      }
      cells.push(cur);
      return cells;
    });
}

export default function RegisterPage<T extends Record<string, string>>({
  title, columns, emptyRow, children,
}: Props<T>) {
  const [rows,   setRows]   = useState<T[]>([]);
  const [search, setSearch] = useState("");
  const [saved,  setSaved]  = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  /* ── CRUD ── */
  function addRow() {
    setRows(rs => [...rs, { ...emptyRow(), id: String(Date.now()) } as T]);
  }

  function updateCell(idx: number, key: string, val: string) {
    setRows(rs => rs.map((r, i) => i === idx ? { ...r, [key]: val } : r));
  }

  function deleteRow(idx: number) {
    setRows(rs => rs.filter((_, i) => i !== idx));
  }

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  /* ── Excel (CSV) download ── */
  function handleDownload() {
    const template = rows.length ? rows : [emptyRow()];
    downloadFile(toCSV(columns, template as T[]), `${title.replace(/\s+/g, "_")}.csv`);
  }

  /* ── Upload CSV ── */
  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const text   = (ev.target?.result as string) ?? "";
      const matrix = parseCSV(text);
      if (matrix.length < 2) return;
      const headers = matrix[0].map(h => h.trim());
      const newRows = matrix.slice(1).map(cells => {
        const row = emptyRow() as Record<string, string>;
        headers.forEach((h, i) => {
          const col = columns.find(c => c.label === h || c.key === h);
          if (col) row[col.key] = cells[i]?.trim() ?? "";
        });
        row.id = String(Date.now() + Math.random());
        return row as T;
      });
      setRows(prev => [...prev, ...newRows]);
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  /* ── Filtered rows ── */
  const q        = search.toLowerCase();
  const filtered = rows.filter(r =>
    !q || Object.values(r).some(v => v.toLowerCase().includes(q))
  );

  return (
    <div className="space-y-5">

      {/* Title */}
      <div className="flex items-center gap-2">
        <div className="w-1 h-6 rounded-full"
          style={{ background: "linear-gradient(180deg,#06b6d4,#10b981)" }} />
        <h2 className="font-black text-slate-800 text-lg"
          style={{ fontFamily: "'Raleway',sans-serif" }}>{title}</h2>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-2xl px-5 py-4 flex flex-wrap items-center gap-3"
        style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.06)", border: "1.5px solid rgba(0,0,0,0.06)" }}>

        {/* Download template */}
        <button onClick={handleDownload}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-black text-white transition-all hover:opacity-90 active:scale-95"
          style={{ background: "linear-gradient(135deg,#06b6d4,#10b981)" }}>
          <Download className="w-4 h-4" /> Download Excel
        </button>

        {/* Upload CSV */}
        <button onClick={() => fileRef.current?.click()}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-black text-white transition-all hover:opacity-90 active:scale-95"
          style={{ background: "linear-gradient(135deg,#7c3aed,#ec4899)" }}>
          <Upload className="w-4 h-4" /> Upload Excel
        </button>
        <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls"
          className="hidden" onChange={handleUpload} />

        {/* Add row */}
        <button onClick={addRow}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-black text-white transition-all hover:opacity-90 active:scale-95"
          style={{ background: "linear-gradient(135deg,#f97316,#ef4444)" }}>
          <Plus className="w-4 h-4" /> Add Row
        </button>

        {/* Save */}
        <button onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-black text-white transition-all hover:opacity-90 active:scale-95"
          style={{ background: "linear-gradient(135deg,#10b981,#06b6d4)" }}>
          <Save className="w-4 h-4" /> {saved ? "✓ Saved" : "Save"}
        </button>

        {/* Search */}
        <div className="relative ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Search…" value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 outline-none focus:border-teal-400 w-48 transition-colors" />
        </div>
      </div>

      {/* Optional extra UI */}
      {children}

      {/* Table */}
      <div className="bg-white rounded-2xl overflow-hidden"
        style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.06)", border: "1.5px solid rgba(0,0,0,0.06)" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ background: "linear-gradient(90deg,#ecfeff,#f0fffe)", borderBottom: "1.5px solid rgba(6,182,212,0.15)" }}>
                <th className="px-3 py-3 text-left font-black text-teal-700 uppercase tracking-wide whitespace-nowrap w-12">#</th>
                {columns.map(c => (
                  <th key={c.key}
                    className="px-3 py-3 text-left font-black text-teal-700 uppercase tracking-wide whitespace-nowrap"
                    style={{ minWidth: c.width ?? "120px" }}>
                    {c.label}
                  </th>
                ))}
                <th className="px-3 py-3 text-center font-black text-teal-700 uppercase tracking-wide w-16">Del</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 2}
                    className="py-12 text-center text-sm font-semibold text-slate-400">
                    No records yet — click <strong>Add Row</strong> or <strong>Upload Excel</strong>.
                  </td>
                </tr>
              ) : (
                filtered.map((row, idx) => (
                  <tr key={(row as any).id ?? idx}
                    className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                    <td className="px-3 py-2 text-slate-400 font-black">{idx + 1}</td>
                    {columns.map(c => (
                      <td key={c.key} className="px-2 py-1.5">
                        {c.type === "select" ? (
                          <select value={row[c.key] ?? ""}
                            onChange={e => updateCell(rows.indexOf(row), c.key, e.target.value)}
                            className="w-full px-2 py-1 rounded-md border border-slate-200 text-xs font-semibold text-slate-700 outline-none focus:border-teal-400 bg-white">
                            <option value="">—</option>
                            {c.options?.map(o => <option key={o} value={o}>{o}</option>)}
                          </select>
                        ) : (
                          <input
                            type={c.type === "date" ? "date" : c.type === "number" ? "number" : "text"}
                            value={row[c.key] ?? ""}
                            onChange={e => updateCell(rows.indexOf(row), c.key, e.target.value)}
                            className="w-full px-2 py-1 rounded-md border border-slate-200 text-xs font-semibold text-slate-700 outline-none focus:border-teal-400 bg-white transition-colors"
                          />
                        )}
                      </td>
                    ))}
                    <td className="px-2 py-1.5 text-center">
                      <button onClick={() => deleteRow(rows.indexOf(row))}
                        className="w-7 h-7 rounded-full bg-red-100 hover:bg-red-500 text-red-500 hover:text-white transition-all flex items-center justify-center mx-auto">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-slate-100 text-xs text-slate-400 font-semibold">
            {filtered.length} record{filtered.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>
    </div>
  );
}
