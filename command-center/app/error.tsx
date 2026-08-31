"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error("GM Command Center render failure", error); }, [error]);
  return (
    <main className="fatal-data-state" role="alert" aria-live="assertive">
      <section>
        <span>GM / DATA HEALTH</span>
        <h1>DATA CONNECTION ERROR</h1>
        <p>The Command Center could not verify live business data. No zero-value fallback has been substituted.</p>
        <button type="button" onClick={reset}>RETRY LIVE DATA <b>↻</b></button>
        {error.digest ? <small>REFERENCE {error.digest}</small> : null}
      </section>
    </main>
  );
}
