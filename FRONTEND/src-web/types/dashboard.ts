import type { LucideIcon } from "lucide-react";

export type ViewId =
  | "overview"
  | "automations"
  | "qr"
  | "appointments"
  | "catalog"
  | "history"
  | "settings";

export type NavItem = {
  id: ViewId;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
};
