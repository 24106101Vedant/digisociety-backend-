import { useState } from "react";
import React from "react";
import {
  BookOpen, Landmark, TrendingUp, Users, FileText, ReceiptText,
  ClipboardList, Building2, Menu, LogOut, Bell, ChevronDown,
  IndianRupee, UserCheck, Eye, Home, Layers,
  UserPlus, Upload, UsersRound, FolderOpen, MessageSquare,
  AlertCircle, UserCog, Lock, Edit, Network,
  Layers2, Wallet, BookMarked, PiggyBank, Percent, Settings2,
  Zap, Store, ArrowLeftRight, CreditCard, Banknote, GitCompare,
  Coins, RefreshCw, BarChart2, LayoutDashboard, ShieldCheck,
} from "lucide-react";
import logo from "@/assets/logo.png.jpg";
import ManageSociety from "@/app/pages/ManageSociety";
import MembersMasters from "@/app/pages/MembersMasters";
import UploadMembersData from "@/app/pages/UploadMembersData";
import DocumentManager from "@/app/pages/DocumentManager";
import NoticeManager from "@/app/pages/NoticeManager";
import PaymentLedgers from "@/app/pages/PaymentLedgers";
import BillingLedger from "@/app/pages/BillingLedger";
import SetCharges from "@/app/pages/SetCharges";
import BillParameter from "@/app/pages/BillParameter";
import RegularBill from "@/app/pages/RegularBill";
import SupplementaryBill from "@/app/pages/SupplementaryBill";
import Receipts from "@/app/pages/Receipts";
import Payments from "@/app/pages/Payments";
import Contra from "@/app/pages/Contra";
import GenReceipts from "@/app/pages/GenReceipts";
import DebitNote from "@/app/pages/DebitNote";
import CreditNote from "@/app/pages/CreditNote";
import UserRights from "@/app/pages/UserRights";
import SetAccountGroup from "@/app/pages/SetAccountGroup";
import ComplaintTickets from "@/app/pages/ComplaintTickets";
import BankMaster from "@/app/pages/BankMaster";
import CashMaster from "@/app/pages/CashMaster";
import AddVendors from "@/app/pages/AddVendors";
import VendorBilling from "@/app/pages/VendorBilling";
import FormIRegister      from "@/app/pages/registers/FormIRegister";
import FormJRegister      from "@/app/pages/registers/FormJRegister";
import ShareRegister      from "@/app/pages/registers/ShareRegister";
import NominationRegister from "@/app/pages/registers/NominationRegister";
import FDRegister         from "@/app/pages/registers/FDRegister";
import FixedAssetRegister from "@/app/pages/registers/FixedAssetRegister";
import VendorRegister     from "@/app/pages/registers/VendorRegister";
import RenterRegister     from "@/app/pages/registers/RenterRegister";
import LienRegister       from "@/app/pages/registers/LienRegister";

interface NavItem {
  icon: any;
  label: string;
  id: string;
  children?: NavItem[];
}

const NAV_STRUCTURE: NavItem[] = [
  { icon: Home, label: "Dashboard", id: "dashboard" },
  {
    icon: Layers, label: "Admin", id: "admin",
    children: [
      { icon: Building2, label: "Manage Society", id: "manage-society" },
      {
        icon: UserPlus, label: "Manage Member", id: "manage-member",
        children: [
          { icon: Upload,     label: "Upload Members Data", id: "upload-members"   },
          { icon: UsersRound, label: "Members Masters",     id: "members-masters"  },
        ],
      },
      { icon: FolderOpen,    label: "Document Manager",   id: "document-manager"   },
      { icon: MessageSquare, label: "Notice Manager",     id: "notice-manager"     },
      { icon: AlertCircle,   label: "Complaint Tickets",  id: "complaint-tickets"  },
    ],
  },
  {
    icon: Edit, label: "Account Master", id: "accounts",
    children: [
      {
        icon: Layers2, label: "Create Group", id: "set-groups",
        children: [
          { icon: Layers2, label: "Create Ledger", id: "set-account-group" },
        ],
      },
      {
        icon: Wallet, label: "Bank/Cash Master", id: "bank-cash-master",
        children: [
          { icon: Wallet, label: "Bank Master", id: "bank-master" },
          { icon: Wallet, label: "Cash Master", id: "cash-master" },
        ],
      },
      {
        icon: BookMarked, label: "Account Master Head", id: "account-masters",
        children: [
          { icon: BookMarked, label: "Payment Ledgers", id: "payment-ledgers" },
          { icon: BookMarked, label: "Billing Ledger",   id: "tarrif-ledgers"  },
        ],
      },
      {
        icon: Store, label: "Vendor", id: "vendor",
        children: [
          { icon: Store,      label: "Add Vendors",    id: "add-vendors"    },
          { icon: CreditCard, label: "Vendor Billing", id: "vendor-billing" },
        ],
      },
    ],
  },
  {
    icon: ReceiptText, label: "Billing Section", id: "billing",
    children: [
      { icon: Percent,   label: "Set Charges",    id: "set-charges"    },
      { icon: Settings2, label: "Bill Parameter", id: "bill-parameter" },
      {
        icon: Zap, label: "Generate Bill", id: "bill-generation",
        children: [
          { icon: Zap, label: "Regular Bill",       id: "regular-bill"       },
          { icon: Zap, label: "Supplementary Bill", id: "supplementary-bill" },
        ],
      },
    ],
  },
  {
    icon: ArrowLeftRight, label: "Transaction", id: "transaction",
    children: [
      { icon: Banknote,       label: "Receipts",     id: "receipts"          },
      { icon: CreditCard,     label: "Payments",     id: "payments"          },
      { icon: Banknote,       label: "Gen. Receipts", id: "gen-receipts"     },
      { icon: ArrowLeftRight, label: "Contra",       id: "contra"            },
      { icon: FileText,       label: "Debit Note",   id: "debit-credit-note" },
      { icon: FileText,       label: "Credit Note",  id: "credit-note"       },
    ],
  },



  {
    icon: ReceiptText, label: "Registers", id: "registers",
    children: [
      { icon: FileText,  label: "Form I Register",      id: "form-i-register"      },
      { icon: FileText,  label: "Form J Register",      id: "form-j-register"      },
      { icon: Coins,     label: "Share Register",       id: "shares-register"      },
      { icon: UserCog,   label: "Nomination Register",  id: "nominee-register"     },
      { icon: PiggyBank, label: "FD Register",          id: "fd-register"          },
      { icon: Building2, label: "Fixed Asset Register", id: "fixed-asset-register" },
      { icon: Store,     label: "Vendor Register",      id: "vendor-register"      },
      { icon: UserCheck, label: "Renter Register",      id: "renter-register"      },
      { icon: Lock,      label: "Lien Register",        id: "lien-register"        },
    ],
  },
  {
    icon: Eye, label: "Visitors", id: "visitors",
    children: [
      { icon: UserPlus,       label: "Add Daily Visitors",           id: "add-daily-visitors"          },
      { icon: ArrowLeftRight, label: "Visitors In/Out Report",       id: "visitors-inout-report"       },
      { icon: ShieldCheck,    label: "Security Attendance",          id: "security-attendance"         },
      { icon: FileText,       label: "Daily Visitors In/Out Report", id: "daily-visitors-inout-report" },
    ],
  },
];

const FINANCE_CARDS = [
  { label: "Regular Bills", value: "₹0.00", barColor: "bg-red-400",    barW: "w-1/4" },
  { label: "Suppl. Bills",  value: "₹0.00", barColor: "bg-violet-500", barW: "w-1/3" },
  { label: "Receipts",      value: "₹0.00", barColor: "bg-cyan-500",   barW: "w-1/2" },
  { label: "Payments",      value: "₹0.00", barColor: "bg-emerald-500",barW: "w-2/5" },
];

const QUICK_LINKS = ["Bank Book","Cash Book","Rec & Pay","Fund Flow","Reco.","Member Ledger","Dues / Advances","Gen. Ledger"];

interface DashboardProps { onLogout: () => void; }

export default function Dashboard({ onLogout }: DashboardProps) {
  const [activeNav,    setActiveNav]    = useState("dashboard");
  const [sidebarOpen,  setSidebarOpen]  = useState(false);
  const [expandedItems,setExpandedItems]= useState<Set<string>>(new Set(["admin"]));

  const storedUser = (() => { try { return JSON.parse(localStorage.getItem("ds_user") || "{}"); } catch { return {}; } })();
  const displayName = storedUser.name || storedUser.email || "Admin";

  function handleLogout() {
    localStorage.removeItem("ds_token");
    localStorage.removeItem("ds_user");
    onLogout();
  }

  function toggleExpanded(id: string) {
    setExpandedItems(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function renderNavItems(items: NavItem[], depth = 0): React.ReactNode[] {
    return items.map(item => {
      const isActive   = activeNav === item.id;
      const isExpanded = expandedItems.has(item.id);
      const hasChildren = !!(item.children?.length);
      return (
        <div key={item.id}>
          <button
            onClick={() => { hasChildren ? toggleExpanded(item.id) : (setActiveNav(item.id), setSidebarOpen(false)); }}
            className={`w-full flex items-center gap-3 rounded-lg text-sm font-bold transition-all duration-150 text-left mb-0.5
              ${depth === 0 ? "py-2.5 px-4" : "py-2 px-4"}
              ${depth === 0
                ? isActive ? "bg-white/25 text-white border border-white/40" : "text-white hover:bg-white/20"
                : isActive ? "bg-white/20 text-white"                        : "text-white hover:bg-white/15"
              }`}
            style={{ paddingLeft: `${1 + depth * 1.25}rem` }}
          >
            {depth === 0
              ? <item.icon className="w-[18px] h-[18px] flex-shrink-0 text-white" />
              : <span className="w-1.5 h-1.5 rounded-full bg-white/80 flex-shrink-0" />
            }
            <span className="flex-1 leading-snug">{item.label}</span>
            {hasChildren && (
              <ChevronDown className={`w-4 h-4 text-white flex-shrink-0 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
            )}
          </button>
          {hasChildren && isExpanded && (
            <div className="mt-0.5 mb-1">{renderNavItems(item.children!, depth + 1)}</div>
          )}
        </div>
      );
    });
  }

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <aside
      className={`flex flex-col h-full ${mobile ? "w-72" : "w-72 hidden lg:flex"}`}
      style={{ background: "linear-gradient(180deg, #06b6d4 0%, #14b8a6 50%, #10b981 100%)", borderRight: "1px solid rgba(255,255,255,0.08)" }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/30 flex-shrink-0">
        <img src={logo} alt="DigiSociety" className="h-9 w-auto rounded-xl" style={{ background: "white", padding: "3px 7px" }} />
        <div>
          <p className="text-white font-black text-base leading-tight drop-shadow" style={{ fontFamily: "'Pacifico', cursive" }}>DigiSociety</p>
          <p className="text-white/70 text-[10px] font-bold tracking-widest">.IN</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0">
        {renderNavItems(NAV_STRUCTURE)}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-white/30 flex-shrink-0">
        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-bold text-white hover:bg-white/20 transition-all">
          <LogOut className="w-[18px] h-[18px] flex-shrink-0 text-white" />
          Logout
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "linear-gradient(135deg,#b2f5ea 0%,#e0f7fa 25%,#e8f5e9 50%,#fdf4ff 75%,#fff7ed 100%)" }}>
      <Sidebar />

      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <div className="relative z-50 flex h-full"><Sidebar mobile /></div>
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(12px)", borderBottom: "1.5px solid rgba(6,182,212,0.12)", boxShadow: "0 2px 16px rgba(6,182,212,0.08)" }}>
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100">
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-black text-slate-800 text-lg leading-tight" style={{ fontFamily: "'Raleway', sans-serif" }}>
                Sunshine Apartments Co-operative Society
              </h1>
              <p className="text-slate-400 text-xs font-semibold">FY: 2026–27</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-slate-500 text-sm font-semibold">
              Hi, <span style={{ background: "linear-gradient(90deg,#06b6d4,#10b981)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontWeight: 800 }}>{displayName}</span>
            </span>
            <button className="relative p-2 rounded-xl bg-cyan-50 hover:bg-cyan-100 transition-colors">
              <Bell className="w-5 h-5 text-cyan-600" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-400 rounded-full" />
            </button>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-white text-sm"
              style={{ background: "linear-gradient(135deg,#06b6d4,#10b981)" }}>
              {displayName.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Main */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">

          {activeNav === "manage-society" ? (
            <ManageSociety />
          ) : activeNav === "members-masters" ? (
            <MembersMasters />
          ) : activeNav === "upload-members" ? (
            <UploadMembersData />
          ) : activeNav === "document-manager" ? (
            <DocumentManager />
          ) : activeNav === "notice-manager" ? (
            <NoticeManager />
          ) : activeNav === "payment-ledgers" ? (
            <PaymentLedgers />
          ) : activeNav === "tarrif-ledgers" ? (
            <BillingLedger />
          ) : activeNav === "set-charges" ? (
            <SetCharges />
          ) : activeNav === "bill-parameter" ? (
            <BillParameter />
          ) : activeNav === "regular-bill" ? (
            <RegularBill />
          ) : activeNav === "supplementary-bill" ? (
            <SupplementaryBill />
          ) : activeNav === "receipts" ? (
            <Receipts />
          ) : activeNav === "payments" ? (
            <Payments />
          ) : activeNav === "contra" ? (
            <Contra />
          ) : activeNav === "gen-receipts" ? (
            <GenReceipts />
          ) : activeNav === "debit-credit-note" ? (
            <DebitNote />
          ) : activeNav === "credit-note" ? (
            <CreditNote />
          ) : activeNav === "user-rights" ? (
            <UserRights />
          ) : activeNav === "set-account-group" ? (
            <SetAccountGroup />
          ) : activeNav === "complaint-tickets" ? (
            <ComplaintTickets />
          ) : activeNav === "bank-master" ? (
            <BankMaster />
          ) : activeNav === "cash-master" ? (
            <CashMaster />
          ) : activeNav === "add-vendors" ? (
            <AddVendors />
          ) : activeNav === "vendor-billing" ? (
            <VendorBilling />
          ) : activeNav === "form-i-register" ? (
            <FormIRegister />
          ) : activeNav === "form-j-register" ? (
            <FormJRegister />
          ) : activeNav === "shares-register" ? (
            <ShareRegister />
          ) : activeNav === "nominee-register" ? (
            <NominationRegister />
          ) : activeNav === "fd-register" ? (
            <FDRegister />
          ) : activeNav === "fixed-asset-register" ? (
            <FixedAssetRegister />
          ) : activeNav === "vendor-register" ? (
            <VendorRegister />
          ) : activeNav === "renter-register" ? (
            <RenterRegister />
          ) : activeNav === "lien-register" ? (
            <LienRegister />
          ) : (
            <>

          {/* Financial summary */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1 h-7 rounded-full" style={{ background: "linear-gradient(180deg,#7c3aed,#ec4899)" }} />
              <h2 className="font-black text-slate-700 text-base" style={{ fontFamily: "'Raleway', sans-serif" }}>Financial Summary</h2>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {FINANCE_CARDS.map(card => (
                <div key={card.label} className="bg-white rounded-2xl p-5"
                  style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.06)", border: "1.5px solid rgba(0,0,0,0.06)" }}>
                  <p className="text-slate-500 text-xs font-bold mb-1">{card.label}</p>
                  <p className="font-black text-2xl text-slate-800 mb-3">{card.value}</p>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${card.barColor} ${card.barW} rounded-full`} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1 h-7 rounded-full" style={{ background: "linear-gradient(180deg,#f97316,#ef4444)" }} />
              <h2 className="font-black text-slate-700 text-base" style={{ fontFamily: "'Raleway', sans-serif" }}>Quick Links</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {QUICK_LINKS.map(link => (
                <button key={link}
                  className="px-4 py-3 rounded-2xl font-bold text-sm transition-all hover:scale-[1.03] active:scale-95"
                  style={{ background: "linear-gradient(135deg,#fff0ee,#ffe4e1)", border: "1.5px solid rgba(249,115,22,0.2)", color: "#c2410c", boxShadow: "0 2px 10px rgba(249,115,22,0.1)" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "linear-gradient(135deg,#06b6d4,#10b981)"; e.currentTarget.style.color = "white"; e.currentTarget.style.border = "1.5px solid transparent"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "linear-gradient(135deg,#fff0ee,#ffe4e1)"; e.currentTarget.style.color = "#c2410c"; e.currentTarget.style.border = "1.5px solid rgba(249,115,22,0.2)"; }}>
                  {link}
                </button>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1 h-7 rounded-full" style={{ background: "linear-gradient(180deg,#06b6d4,#7c3aed)" }} />
              <h2 className="font-black text-slate-700 text-base" style={{ fontFamily: "'Raleway', sans-serif" }}>Recent Activity</h2>
            </div>
            <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.06)", border: "1.5px solid rgba(0,0,0,0.06)" }}>
              <div className="grid grid-cols-4 gap-4 px-5 py-3 text-xs font-black uppercase tracking-wide"
                style={{ background: "linear-gradient(90deg,#ecfeff,#f0fffe)", borderBottom: "1.5px solid rgba(6,182,212,0.12)", color: "#0e7490" }}>
                <span>Date</span><span>Description</span><span>Category</span><span className="text-right">Amount</span>
              </div>
              <div className="flex flex-col items-center justify-center py-14 text-center">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-3" style={{ background: "linear-gradient(135deg,#ecfeff,#f0fffe)" }}>
                  <ReceiptText className="w-8 h-8 text-cyan-400" />
                </div>
                <p className="text-slate-400 font-bold text-sm">No transactions yet</p>
                <p className="text-slate-300 text-xs font-semibold mt-1">Transactions will appear here once recorded</p>
              </div>
            </div>
          </div>

          {/* Society info strip */}
          <div className="rounded-2xl p-5 flex flex-wrap gap-6 items-center justify-between"
            style={{ background: "linear-gradient(135deg,#06b6d4,#14b8a6,#10b981)", boxShadow: "0 8px 32px rgba(6,182,212,0.25)" }}>
            <div className="flex items-center gap-4">
              <img src={logo} alt="DigiSociety" className="h-10 w-auto rounded-xl" style={{ background: "white", padding: "3px 7px" }} />
              <div>
                <p className="text-white font-black text-base">DigiSociety.in</p>
                <p className="text-white/70 text-xs font-semibold">Smart Society Management Platform</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-6 text-center">
              {[{ label:"Members",val:"128",color:"text-white"},{label:"Collected",val:"97.5%",color:"text-white"},{label:"Support",val:"24/7",color:"text-white"}].map(s=>(
                <div key={s.label}>
                  <p className={`font-black text-xl ${s.color}`}>{s.val}</p>
                  <p className="text-white/70 text-xs font-semibold">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

            </>
          )}

        </main>
      </div>
    </div>
  );
}
