import { FieldShell } from "@/components/field-shell";

export default function FieldLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <FieldShell>{children}</FieldShell>;
}
