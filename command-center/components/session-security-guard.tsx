"use client";

import { useEffect, useRef } from "react";
import { useAuth, useClerk } from "@clerk/nextjs";
import { usePathname, useRouter } from "next/navigation";

const LOCK_AFTER_MS = 10 * 60 * 1000;
const SIGN_OUT_AFTER_MS = 30 * 60 * 1000;

export function SessionSecurityGuard() {
  const { isSignedIn } = useAuth();
  const { signOut } = useClerk();
  const router = useRouter();
  const pathname = usePathname();
  const lastActivity = useRef(Date.now());
  const lockSent = useRef(false);

  useEffect(() => {
    const active = () => { lastActivity.current = Date.now(); lockSent.current = false; };
    const events: Array<keyof WindowEventMap> = ["pointerdown", "keydown", "touchstart", "scroll"];
    for (const event of events) window.addEventListener(event, active, { passive: true });

    const timer = window.setInterval(() => {
      if (!isSignedIn) { lastActivity.current = Date.now(); lockSent.current = false; return; }
      const idle = Date.now() - lastActivity.current;
      if (idle >= SIGN_OUT_AFTER_MS) {
        void signOut({ redirectUrl: "/sign-in?reason=idle_timeout" });
        return;
      }
      const alreadyAtGate = pathname.startsWith("/security/") || pathname.startsWith("/device/") || pathname.startsWith("/access-denied");
      if (idle >= LOCK_AFTER_MS && !lockSent.current && !alreadyAtGate) {
        lockSent.current = true;
        void fetch("/api/security/session/lock", { method: "POST", cache: "no-store" }).finally(() => {
          router.replace(`/security/verify?next=${encodeURIComponent(pathname || "/overview")}&reason=idle_lock`);
          router.refresh();
        });
      }
    }, 5000);

    const absoluteTimer = window.setInterval(() => {
      if (!isSignedIn) return;
      const atGate = pathname.startsWith("/sign-in") || pathname.startsWith("/security/") || pathname.startsWith("/device/") || pathname.startsWith("/access-denied");
      if (atGate) return;
      void fetch("/api/security/session/status", { cache: "no-store" }).then(async (response) => {
        if (response.status === 401) await signOut({ redirectUrl: "/sign-in?reason=session_expired" });
      }).catch(() => undefined);
    }, 60000);

    return () => {
      window.clearInterval(timer);
      window.clearInterval(absoluteTimer);
      for (const event of events) window.removeEventListener(event, active);
    };
  }, [isSignedIn, pathname, router, signOut]);

  return null;
}
