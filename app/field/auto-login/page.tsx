"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { setToken } from "@/lib/api-client";

// Receiving end of the Admin portal's "Vacant MR Login - Access" (and
// "Login Into FieldForce") hand-off: Admin issues a real JWT for this
// employee's own FIELD_FORCE account and opens
// /field/auto-login?token=<jwt> in a new tab. This page stores that token
// exactly the way a normal sign-in does (setToken -> localStorage) and
// lands the admin on the employee's real Today screen, already
// authenticated as that employee — no separate embedded shell, this IS
// the Field portal.
function AutoLoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState("");

  useEffect(() => {
    const token = params.get("token");
    if (!token) {
      setError("Missing login token.");
      return;
    }
    setToken(token);
    router.replace("/field/today");
  }, [params, router]);

  if (error) {
    return (
      <main className="login-page">
        <section className="login-panel">
          <div className="login-card">
            <h2>Sign-in link invalid</h2>
            <p className="muted">{error}</p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="login-page">
      <section className="login-panel">
        <div className="login-card">
          <h2>Signing in…</h2>
        </div>
      </section>
    </main>
  );
}

export default function AutoLoginPage() {
  return (
    <Suspense fallback={null}>
      <AutoLoginInner />
    </Suspense>
  );
}
