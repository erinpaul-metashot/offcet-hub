/* ─── Mock Data for SurplusLink Demo ───────────────────────────── */

/* ── The Lot ── */
export const DEMO_LOT = {
  title: "Premium Organic Cotton — 2,400 kg Surplus",
  category: "Textiles & Fabrics",
  quantity: "2,400",
  unit: "kg",
  expectedPrice: 18500,
  location: "Mumbai, India",
  description:
    "High-grade organic cotton surplus from seasonal overproduction. GOTS certified, suitable for premium apparel manufacturing.",
  expiresIn: "45 days",
  id: "LOT-00417",
} as const;

/* ── Cast of Characters ── */
export const SUPPLIER = {
  name: "Arjun Mehta",
  email: "arjun@greenweave.in",
  phone: "+91 98765 43210",
  company: "GreenWeave Textiles",
  taxId: "GSTIN29ABCDE",
  warehouse: "Plot 14, Textile Park, Surat",
  password: "••••••••••",
  role: "supplier" as const,
};

export const ADMIN = {
  name: "Priya Sharma",
  email: "priya@surpluslink.com",
  role: "admin" as const,
};

export const BUYER_1 = {
  name: "Liam Chen",
  email: "liam@pacificgarments.com",
  business: "Pacific Garments Co.",
  role: "buyer" as const,
  categories: ["Textiles & Fabrics", "Raw Materials"],
  isSmartMatch: true,
};

export const BUYER_2 = {
  name: "Sofia Rivera",
  email: "sofia@ecothread.co",
  business: "EcoThread Studios",
  role: "buyer" as const,
  categories: ["Fabrics", "Organic Materials"],
  isSmartMatch: true,
};

export const AGENT = {
  name: "Raj Patel",
  email: "raj@apextrade.in",
  business: "Apex Trade Solutions",
  role: "agent" as const,
  categories: ["Textiles", "Machinery", "Electronics"],
  isSmartMatch: true,
};

export const NON_MATCH_USERS = [
  { name: "Marco Rossi",    business: "Alpine Hardware",         role: "buyer" as const, categories: ["Electronics", "Hardware"],      isSmartMatch: false },
  { name: "Yuki Tanaka",    business: "Sakura Industrial",       role: "buyer" as const, categories: ["Machinery", "Auto Parts"],      isSmartMatch: false },
  { name: "Anna Kowalski",  business: "Baltic Trading Group",    role: "agent" as const, categories: ["Chemicals", "Raw Materials"],   isSmartMatch: false },
  { name: "David Okonkwo",  business: "West African Exports",    role: "agent" as const, categories: ["Agriculture", "Food Products"], isSmartMatch: false },
];

/* ── Admin Dashboard Metrics ── */
export const ADMIN_METRICS = {
  totalUsers: 147,
  liveLots: 38,
  assignments: 84,
  interested: 61,
};

export const ADMIN_TREND_DATA = [
  { label: "Oct", value: 4 },
  { label: "Nov", value: 7 },
  { label: "Dec", value: 5 },
  { label: "Jan", value: 9 },
  { label: "Feb", value: 12 },
  { label: "Mar", value: 8 },
];

export const ADMIN_STATUS_CHART = [
  { label: "Approved",       value: 18, tone: "accent" as const },
  { label: "Assigned",       value: 12, tone: "accent" as const },
  { label: "Pending Review", value: 5,  tone: "default" as const },
  { label: "Draft",          value: 3,  tone: "default" as const },
];

export const ADMIN_ROLE_CHART = [
  { label: "Suppliers", value: 42, tone: "accent" as const },
  { label: "Buyers",    value: 68, tone: "default" as const },
  { label: "Agents",    value: 37, tone: "default" as const },
];

export const ADMIN_PENDING_LOTS = [
  { key: "lot-organic",  title: DEMO_LOT.title,                          subtitle: "GreenWeave Textiles — " + DEMO_LOT.category, meta: "Just now",    status: "pending_review" as const, amount: DEMO_LOT.expectedPrice },
  { key: "lot-steel",    title: "Galvanised Steel Sheets — 500 units",   subtitle: "SteelCorp India — Metals",                    meta: "2 hours ago", status: "pending_review" as const, amount: 32000 },
  { key: "lot-plastic",  title: "Recycled HDPE Granules — 1,200 kg",     subtitle: "GreenCycle Plastics — Polymers",               meta: "4 hours ago", status: "pending_review" as const, amount: 8400 },
];

/* ── Buyer Dashboard Metrics ── */
export const BUYER_METRICS = {
  assignedLots: 6,
  active: 4,
  interested: 3,
  expiringSoon: 1,
};

export const BUYER_TREND_DATA = [
  { label: "Oct", value: 1 },
  { label: "Nov", value: 0 },
  { label: "Dec", value: 2 },
  { label: "Jan", value: 1 },
  { label: "Feb", value: 1 },
  { label: "Mar", value: 2 },
];

export const BUYER_RECENT_ASSIGNMENTS = [
  { key: "ba-cotton",    title: DEMO_LOT.title,                            subtitle: "GreenWeave Textiles",      meta: "Just now",     status: "assigned" as const, amount: DEMO_LOT.expectedPrice },
  { key: "ba-silk",      title: "Mulberry Silk Yarn — 800 kg",             subtitle: "Eastern Silk Mills",       meta: "2 days ago",   status: "interested" as const, amount: 24000 },
  { key: "ba-denim",     title: "Surplus Denim Rolls — 1,500 m",           subtitle: "BlueThread Fabrics",       meta: "1 week ago",   status: "interested" as const, amount: 11200 },
];

/* ── Categories for the dropdown ── */
export const LOT_CATEGORIES = [
  "Electronics",
  "Machinery",
  "Textiles & Fabrics",
  "Raw Materials",
  "Auto Parts",
  "Chemicals",
  "Food Products",
  "Agriculture",
];

/* ── Assignment note ── */
export const ASSIGNMENT_NOTE =
  "High-quality textile surplus — strong match for your categories. Please review and respond.";

/* ── Closing Metrics ── */
export const CLOSING_METRICS = [
  { label: "Businesses", value: "147" },
  { label: "Pipeline",   value: "$2.4M" },
  { label: "Active Lots", value: "38" },
];

/* ── Nav Items per Role ── */
export const SUPPLIER_NAV = [
  { label: "Overview",    href: "/supplier/dashboard",  icon: "overview" },
  { label: "My Lots",     href: "/supplier/lots",       icon: "lots" },
  { label: "New Lot",     href: "/supplier/lots/new",   icon: "new_lot" },
];

export const ADMIN_NAV = [
  { label: "Overview",          href: "/admin/dashboard",    icon: "overview" },
  { label: "User Management",   href: "/admin/users",        icon: "users" },
  { label: "Supply Management", href: "/admin/lots",         icon: "lots" },
  { label: "Assignments",       href: "/admin/assignments",  icon: "requests" },
];

export const BUYER_NAV = [
  { label: "Overview",      href: "/buyer/dashboard", icon: "overview" },
  { label: "Assigned Lots", href: "/buyer/lots",      icon: "lots" },
];
