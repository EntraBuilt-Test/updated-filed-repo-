import { CalendarDays, CalendarOff, ClipboardPlus, FileBarChart, LayoutGrid, MapPinned, Megaphone, PlaySquare, Pill, Stethoscope, UserCheck, UserCircle } from "lucide-react";
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
  // Phase 1 of the "Call Manager" reference build — Campaign Planning &
  // Execution gets its own top-level nav entry (mirroring the reference
  // app's own "Campaign" menu group with its two Planning/Execution
  // sub-tabs), placed right next to Tour Plan per the coordinator's
  // guidance. A 9th bottom tab — tight at mobile width but still legible
  // with the existing text-[10px] label size the bar already uses.
  { title: "Campaign", href: "/field/campaign", icon: Megaphone },
  // Phase 5 — chemist campaign planning/execution, reusing the exact same
  // Campaign Planning/Execution components with entityType="chemist"
  // (see app/field/chemist-campaign/page.tsx).
  { title: "Chemist", href: "/field/chemist-campaign", icon: Pill },
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
  // Phase 4 — new top-level "Master" (E-Detailing Download, moved out of
  // Reports/My Slides) and "My Activity" (E-Detailing Practice)
  // destinations, mirroring the reference app's own Master / My Activity
  // sidebar menu groups. With Campaign (Phase 1) this bar is now 11 tabs,
  // too many for a fixed grid at mobile width — field-shell.tsx scrolls
  // it horizontally instead.
  { title: "Master", href: "/field/master", icon: LayoutGrid },
  { title: "Activity", href: "/field/activity", icon: PlaySquare },
  { title: "Profile", href: "/field/profile", icon: UserCircle }
];
