import { ShieldCheck } from "lucide-react";
import Link from "next/link";
import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <main className="login-page">
      <section className="login-visual">
        <Link className="brand" href="/field/login">
          <span className="brand-mark">Z</span>
          <span>
            <p className="brand-title">Zivira Labs</p>
            <p className="brand-subtitle">Medical Representative Portal</p>
          </span>
        </Link>
        <h1>Medical Representative Portal</h1>
        <p>Your daily companion for DCR submissions, doctor visits, attendance, and tour planning.</p>
      </section>
      <section className="login-panel">
        <div className="login-card">
          <ShieldCheck size={34} color="var(--brand)" />
          <h2>Sign in</h2>
          <p className="muted">Seed user: mr-001</p>
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
