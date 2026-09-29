import { CalendarDays, CalendarOff, ClipboardPlus, FileBarChart, MapPinned, Stethoscope, UserCheck, UserCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type FieldNavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
};

export const fieldNav: FieldNavItem[] = [
  { title: "Today", href: "/field/today", icon: CalendarDays },
  { title: "DCR", href: "/field/dcr", icon: ClipboardPlus },
  { title: "Doctors", href: "/field/doctors", icon: Stethoscope },
  { title: "Tour", href: "/field/tour-plan", icon: MapPinned },
  { title: "Attend", href: "/field/attendance", icon: UserCheck },
  // New tab — "Leave Apply": lets the MR submit a leave request straight
  // from the field portal, which routes to their reporting manager for
  // approval (see /field/leave-applications + the Manager portal's new
  // Leave Requests page).
  { title: "Leave", href: "/field/leave", icon: CalendarOff },
  // Round 18 — new top-level "Reports" destination: a hub of read-only
  // "my own data" views over admin-managed Activities/Options screens
  // (Slides, Leave Entitlement, Activity Status, Tasks, Expenses, Manuals),
  // modeled on sanpharma's own Activity Reports / MIS Reports nav pattern.
  // An 8th bottom tab rather than folding it into Profile, since the
  // coordinator asked for a real top-level destination and the existing
  // bar (7 items) still fits one more icon+label at this width.
  { title: "Reports", href: "/field/reports", icon: FileBarChart },
  { title: "Profile", href: "/field/profile", icon: UserCircle }
];
