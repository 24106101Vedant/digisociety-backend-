import { useState } from "react";
import {
  AlertCircle, Plus, X, CheckCircle2, Clock, CircleDot,
  ChevronDown, Send, Paperclip, Search, Filter,
} from "lucide-react";

type Priority = "Low" | "Medium" | "High" | "Urgent";
type Status   = "Open" | "In Progress" | "Resolved" | "Closed";

interface Complaint {
  id:          string;
  ticketNo:    string;
  category:    string;
  subject:     string;
  description: string;
  priority:    Priority;
  status:      Status;
  filedBy:     string;
  flat:        string;
  filedOn:     string;
  updatedOn:   string;
}

const CATEGORIES = [
  "Maintenance & Repair",
  "Cleanliness & Hygiene",
  "Noise Complaint",
  "Parking Issue",
  "Water Supply",
  "Electricity / Power",
  "Lift / Elevator",
  "Security Concern",
  "Common Area",
  "Billing Dispute",
  "Neighbour Dispute",
  "Other",
];

const PRIORITIES: Priority[] = ["Low", "Medium", "High", "Urgent"];

const PRIORITY_STYLES: Record<Priority, string> = {
  Low:    "bg-slate-100 text-slate-600",
  Medium: "bg-yellow-100 text-yellow-700",
  High:   "bg-orange-100 text-orange-700",
  Urgent: "bg-red-100 text-red-700",
};

const STATUS_STYLES: Record<Status, string> = {
  "Open":        "bg-blue-100 text-blue-700",
  "In Progress": "bg-yellow-100 text-yellow-700",
  "Resolved":    "bg-emerald-100 text-emerald-700",
  "Closed":      "bg-slate-100 text-slate-500",
};

const STATUS_ICONS: Record<Status, React.ReactNode> = {
  "Open":        <CircleDot   className="w-3.5 h-3.5" />,
  "In Progress": <Clock       className="w-3.5 h-3.5" />,
  "Resolved":    <CheckCircle2 className="w-3.5 h-3.5" />,
  "Closed":      <X           className="w-3.5 h-3.5" />,
};

// Sample seed data
const SEED: Complaint[] = [
  {
    id: "1", ticketNo: "TKT-001",
    category: "Water Supply", subject: "No water supply on 3rd floor since morning",
    description: "The water pump has not been working since 6 AM. All flats on the 3rd floor are affected.",
    priority: "Urgent", status: "In Progress",
    filedBy: "Rajesh Sharma", flat: "301", filedOn: "2026-10-07", updatedOn: "2026-10-08",
  },
  {
    id: "2", ticketNo: "TKT-002",
    category: "Lift / Elevator", subject: "Lift making unusual noise",
    description: "The main lift has been making grinding noises for the past two days. Needs inspection.",
    priority: "High", status: "Open",
    filedBy: "Priya Mehta", flat: "502", filedOn: "2026-10-08", updatedOn: "2026-10-08",
  },
  {
    id: "3", ticketNo: "TKT-003",
    category: "Cleanliness & Hygiene", subject: "Garbage not collected from B wing",
    description: "The garbage bins in B wing have not been emptied for 3 days.",
    priority: "Medium", status: "Resolved",
    filedBy: "Anita Desai", flat: "204", filedOn: "2026-10-05", updatedOn: "2026-10-06",
  },
];

function genTicketNo(count: number) {
  return `TKT-${String(count + 1).padStart(3, "0")}`;
}

export default function ComplaintTickets() {
  const [complaints, setComplaints]   = useState<Complaint[]>(SEED);
  const [showForm,   setShowForm]     = useState(false);
  const [search,     setSearch]       = useState("");
  const [filterStatus, setFilterStatus] = useState<Status | "All">("All");
  const [viewTicket, setViewTicket]   = useState<Complaint | null>(null);

  // Form state
  const [form, setForm] = useState({
    category:    "",
    subject:     "",
    description: "",
    priority:    "Medium" as Priority,
    filedBy:     "",
    flat:        "",
  });
  const [errors,     setErrors]     = useState<Record<string, string>>({});
  const [submitted,  setSubmitted]  = useState(false);

  function validate() {
    const e: Record<string, string> = {};
    if (!form.category)    e.category    = "Please select a category.";
    if (!form.subject.trim())    e.subject    = "Subject is required.";
    if (form.subject.trim().length < 5) e.subject = "Subject must be at least 5 characters.";
    if (!form.description.trim()) e.description = "Description is required.";
    if (form.description.trim().length < 20) e.description = "Please provide at least 20 characters.";
    if (!form.filedBy.trim()) e.filedBy = "Your name is required.";
    if (!form.flat.trim())   e.flat    = "Flat / Unit number is required.";
    return e;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    const now = new Date().toISOString().split("T")[0];
    const newComplaint: Complaint = {
      id:          String(Date.now()),
      ticketNo:    genTicketNo(complaints.length),
      category:    form.category,
      subject:     form.subject.trim(),
      description: form.description.trim(),
      priority:    form.priority,
      status:      "Open",
      filedBy:     form.filedBy.trim(),
      flat:        form.flat.trim(),
      filedOn:     now,
      updatedOn:   now,
    };

    setComplaints(prev => [newComplaint, ...prev]);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setShowForm(false);
      setForm({ category: "", subject: "", description: "", priority: "Medium", filedBy: "", flat: "" });
      setErrors({});
    }, 2000);
  }

  function resetForm() {
    setShowForm(false);
    setForm({ category: "", subject: "", description: "", priority: "Medium", filedBy: "", flat: "" });
    setErrors({});
    setSubmitted(false);
  }

  const filtered = complaints.filter(c => {
    const matchSearch = !search ||
      c.subject.toLowerCase().includes(search.toLowerCase()) ||
      c.ticketNo.toLowerCase().includes(search.toLowerCase()) ||
      c.filedBy.toLowerCase().includes(search.toLowerCase()) ||
      c.flat.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "All" || c.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const counts = {
    total:      complaints.length,
    open:       complaints.filter(c => c.status === "Open").length,
    inProgress: complaints.filter(c => c.status === "In Progress").length,
    resolved:   complaints.filter(c => c.status === "Resolved").length,
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,#f97316,#ef4444)" }}>
            <AlertCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-black text-slate-800 text-xl" style={{ fontFamily: "'Raleway',sans-serif" }}>
              Complaint Tickets
            </h1>
            <p className="text-slate-400 text-xs font-semibold">File and track society complaints</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95"
          style={{ background: "linear-gradient(135deg,#06b6d4,#10b981)" }}>
          <Plus className="w-4 h-4" /> File a Complaint
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total",       val: counts.total,      color: "from-slate-400 to-slate-600"   },
          { label: "Open",        val: counts.open,       color: "from-blue-400 to-blue-600"     },
          { label: "In Progress", val: counts.inProgress, color: "from-yellow-400 to-orange-500" },
          { label: "Resolved",    val: counts.resolved,   color: "from-emerald-400 to-teal-600"  },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-4"
            style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1.5px solid rgba(0,0,0,0.06)" }}>
            <p className="text-slate-500 text-xs font-bold mb-1">{s.label}</p>
            <p className={`font-black text-2xl bg-gradient-to-r ${s.color} bg-clip-text text-transparent`}>
              {s.val}
            </p>
          </div>
        ))}
      </div>

      {/* File Complaint Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}>
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">

            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg,#f97316,#ef4444)" }}>
                  <AlertCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-black text-slate-800 text-base">File a Complaint</h2>
                  <p className="text-slate-400 text-xs font-semibold">All fields marked * are required</p>
                </div>
              </div>
              <button onClick={resetForm}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Success state */}
            {submitted ? (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                  style={{ background: "linear-gradient(135deg,#10b981,#06b6d4)" }}>
                  <CheckCircle2 className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-black text-slate-800 text-lg mb-1">Complaint Filed!</h3>
                <p className="text-slate-500 text-sm font-semibold">
                  Your ticket has been submitted. The management team will review it shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-6 space-y-5">

                {/* Row 1: Name + Flat */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-slate-600 mb-1.5 uppercase tracking-wide">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Rajesh Sharma"
                      value={form.filedBy}
                      onChange={e => setForm(f => ({ ...f, filedBy: e.target.value }))}
                      className={`w-full px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 outline-none transition-all
                        border ${errors.filedBy ? "border-red-400 bg-red-50" : "border-slate-200 bg-slate-50 focus:border-cyan-400 focus:bg-white"}`}
                    />
                    {errors.filedBy && <p className="text-red-500 text-xs font-semibold mt-1">{errors.filedBy}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-600 mb-1.5 uppercase tracking-wide">
                      Flat / Unit No. *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 301, A-204"
                      value={form.flat}
                      onChange={e => setForm(f => ({ ...f, flat: e.target.value }))}
                      className={`w-full px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 outline-none transition-all
                        border ${errors.flat ? "border-red-400 bg-red-50" : "border-slate-200 bg-slate-50 focus:border-cyan-400 focus:bg-white"}`}
                    />
                    {errors.flat && <p className="text-red-500 text-xs font-semibold mt-1">{errors.flat}</p>}
                  </div>
                </div>

                {/* Row 2: Category + Priority */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-slate-600 mb-1.5 uppercase tracking-wide">
                      Category *
                    </label>
                    <div className="relative">
                      <select
                        value={form.category}
                        onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                        className={`w-full px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 outline-none appearance-none transition-all
                          border ${errors.category ? "border-red-400 bg-red-50" : "border-slate-200 bg-slate-50 focus:border-cyan-400 focus:bg-white"}`}
                      >
                        <option value="">Select category…</option>
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                    {errors.category && <p className="text-red-500 text-xs font-semibold mt-1">{errors.category}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-600 mb-1.5 uppercase tracking-wide">
                      Priority *
                    </label>
                    <div className="flex gap-2 flex-wrap">
                      {PRIORITIES.map(p => (
                        <button
                          key={p} type="button"
                          onClick={() => setForm(f => ({ ...f, priority: p }))}
                          className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all border
                            ${form.priority === p
                              ? "border-transparent " + PRIORITY_STYLES[p]
                              : "border-slate-200 text-slate-400 bg-white hover:border-slate-300"
                            }`}>
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-xs font-black text-slate-600 mb-1.5 uppercase tracking-wide">
                    Subject *
                  </label>
                  <input
                    type="text"
                    placeholder="Brief summary of the issue…"
                    value={form.subject}
                    onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                    className={`w-full px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 outline-none transition-all
                      border ${errors.subject ? "border-red-400 bg-red-50" : "border-slate-200 bg-slate-50 focus:border-cyan-400 focus:bg-white"}`}
                  />
                  {errors.subject && <p className="text-red-500 text-xs font-semibold mt-1">{errors.subject}</p>}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-black text-slate-600 mb-1.5 uppercase tracking-wide">
                    Description *
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Describe the issue in detail — when it started, how it affects you, any previous attempts to resolve it…"
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    className={`w-full px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 outline-none resize-none transition-all
                      border ${errors.description ? "border-red-400 bg-red-50" : "border-slate-200 bg-slate-50 focus:border-cyan-400 focus:bg-white"}`}
                  />
                  <div className="flex items-center justify-between mt-1">
                    {errors.description
                      ? <p className="text-red-500 text-xs font-semibold">{errors.description}</p>
                      : <span />
                    }
                    <span className={`text-xs font-semibold ${form.description.length < 20 ? "text-slate-300" : "text-emerald-500"}`}>
                      {form.description.length} chars
                    </span>
                  </div>
                </div>

                {/* Attachment note */}
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200">
                  <Paperclip className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <p className="text-slate-400 text-xs font-semibold">
                    Photo/video attachments can be added after the ticket is created via Document Manager.
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={resetForm}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-50 transition-colors">
                    Cancel
                  </button>
                  <button type="submit"
                    className="flex-1 py-2.5 rounded-xl text-white text-sm font-black flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-95"
                    style={{ background: "linear-gradient(135deg,#f97316,#ef4444)" }}>
                    <Send className="w-4 h-4" /> Submit Complaint
                  </button>
                </div>

              </form>
            )}
          </div>
        </div>
      )}

      {/* View Ticket Modal */}
      {viewTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}>
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-wide">{viewTicket.ticketNo}</p>
                <h2 className="font-black text-slate-800 text-base mt-0.5">{viewTicket.subject}</h2>
              </div>
              <button onClick={() => setViewTicket(null)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex gap-2 flex-wrap">
                <span className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black ${STATUS_STYLES[viewTicket.status]}`}>
                  {STATUS_ICONS[viewTicket.status]} {viewTicket.status}
                </span>
                <span className={`px-2.5 py-1 rounded-lg text-xs font-black ${PRIORITY_STYLES[viewTicket.priority]}`}>
                  {viewTicket.priority}
                </span>
                <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-slate-100 text-slate-600">
                  {viewTicket.category}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-wide mb-0.5">Filed By</p>
                  <p className="font-bold text-slate-700">{viewTicket.filedBy}</p>
                </div>
                <div>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-wide mb-0.5">Flat / Unit</p>
                  <p className="font-bold text-slate-700">{viewTicket.flat}</p>
                </div>
                <div>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-wide mb-0.5">Filed On</p>
                  <p className="font-bold text-slate-700">{viewTicket.filedOn}</p>
                </div>
                <div>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-wide mb-0.5">Last Updated</p>
                  <p className="font-bold text-slate-700">{viewTicket.updatedOn}</p>
                </div>
              </div>
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-wide mb-1.5">Description</p>
                <p className="text-sm text-slate-600 font-semibold leading-relaxed bg-slate-50 rounded-xl p-4 border border-slate-100">
                  {viewTicket.description}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by subject, ticket no, member name…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 outline-none focus:border-cyan-400 transition-colors"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as Status | "All")}
            className="pl-10 pr-8 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 outline-none focus:border-cyan-400 appearance-none transition-colors"
          >
            <option value="All">All Statuses</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Tickets Table */}
      <div className="bg-white rounded-2xl overflow-hidden"
        style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.06)", border: "1.5px solid rgba(0,0,0,0.06)" }}>

        {/* Table header */}
        <div className="hidden sm:grid grid-cols-[1fr_2fr_1fr_1fr_1fr_auto] gap-4 px-5 py-3 text-xs font-black uppercase tracking-wide"
          style={{ background: "linear-gradient(90deg,#fff7ed,#fff0fb)", borderBottom: "1.5px solid rgba(249,115,22,0.1)", color: "#c2410c" }}>
          <span>Ticket No.</span>
          <span>Subject</span>
          <span>Category</span>
          <span>Priority</span>
          <span>Status</span>
          <span>Action</span>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
              style={{ background: "linear-gradient(135deg,#fff7ed,#fef3c7)" }}>
              <AlertCircle className="w-7 h-7 text-orange-300" />
            </div>
            <p className="text-slate-400 font-bold text-sm">No complaints found</p>
            <p className="text-slate-300 text-xs font-semibold mt-1">
              {search || filterStatus !== "All" ? "Try adjusting your search or filter." : "Click 'File a Complaint' to get started."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {filtered.map(c => (
              <div key={c.id}
                className="hidden sm:grid grid-cols-[1fr_2fr_1fr_1fr_1fr_auto] gap-4 px-5 py-4 items-center hover:bg-slate-50/60 transition-colors">
                <span className="text-xs font-black text-slate-500">{c.ticketNo}</span>
                <div>
                  <p className="text-sm font-bold text-slate-700 leading-snug line-clamp-1">{c.subject}</p>
                  <p className="text-xs text-slate-400 font-semibold mt-0.5">{c.filedBy} · Flat {c.flat}</p>
                </div>
                <span className="text-xs font-semibold text-slate-500">{c.category}</span>
                <span className={`px-2.5 py-1 rounded-lg text-xs font-black w-fit ${PRIORITY_STYLES[c.priority]}`}>
                  {c.priority}
                </span>
                <span className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black w-fit ${STATUS_STYLES[c.status]}`}>
                  {STATUS_ICONS[c.status]} {c.status}
                </span>
                <button
                  onClick={() => setViewTicket(c)}
                  className="text-xs font-black text-cyan-600 hover:text-cyan-800 transition-colors px-3 py-1.5 rounded-lg hover:bg-cyan-50">
                  View
                </button>
              </div>
            ))}

            {/* Mobile cards */}
            {filtered.map(c => (
              <div key={`m-${c.id}`} className="sm:hidden p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-slate-400">{c.ticketNo}</p>
                    <p className="text-sm font-bold text-slate-700 mt-0.5 leading-snug">{c.subject}</p>
                    <p className="text-xs text-slate-400 font-semibold mt-0.5">{c.filedBy} · Flat {c.flat}</p>
                  </div>
                  <button onClick={() => setViewTicket(c)}
                    className="text-xs font-black text-cyan-600 hover:text-cyan-800 px-3 py-1.5 rounded-lg hover:bg-cyan-50 flex-shrink-0">
                    View
                  </button>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <span className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-black ${STATUS_STYLES[c.status]}`}>
                    {STATUS_ICONS[c.status]} {c.status}
                  </span>
                  <span className={`px-2 py-1 rounded-lg text-xs font-black ${PRIORITY_STYLES[c.priority]}`}>
                    {c.priority}
                  </span>
                  <span className="px-2 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-500">
                    {c.category}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
