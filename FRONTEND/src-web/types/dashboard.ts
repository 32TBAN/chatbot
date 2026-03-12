import type { LucideIcon } from "lucide-react";

export type ViewId =
  | "overview"
  | "automations"
  | "qr"
  | "appointments"
  | "catalog"
  | "history"
  | "settings"
  | "debug";

export type NavItem = {
  id: ViewId;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
};
