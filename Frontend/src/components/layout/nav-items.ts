import {
  ChartPie,
  House,
  ShieldCheck,
  Sparkles,
  Split,
  TrendingUp,
  Wallet,
} from "lucide-react";

export const navItems = [
  { href: "/dashboard", label: "Home", icon: House },
  { href: "/accounts", label: "Accounts", icon: Wallet },
  { href: "/transactions", label: "Activity", icon: Sparkles },
  { href: "/flows", label: "Flows", icon: Split },
  { href: "/invest", label: "Invest", icon: TrendingUp },
  { href: "/insights", label: "Insights", icon: ChartPie },
  { href: "/security", label: "Security", icon: ShieldCheck },
] as const;

/** The four that fit a mobile tab bar without crowding the touch targets. */
export const mobileNavItems = navItems.filter((item) =>
  ["/dashboard", "/accounts", "/flows", "/invest"].includes(item.href),
);
