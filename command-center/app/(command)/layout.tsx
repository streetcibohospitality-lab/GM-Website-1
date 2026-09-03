import { redirect } from "next/navigation";
import { CommandShell } from "@/components/command-shell";
import { requirePageProfile } from "@/lib/access-control";
import { hasRecentMfaVerification, mfaMaxAges } from "@/lib/mfa";
import { getAlerts, getReportingContext } from "@/lib/command-data";
import { demoDataAllowed } from "@/lib/runtime-mode";

export const dynamic = "force-dynamic";

export default async function CommandLayout({ children }: { children: React.ReactNode }) {
  const profile = await requirePageProfile("/overview");
  if (!profile.mfa_enabled) redirect("/security/setup");
  if (!(await hasRecentMfaVerification(mfaMaxAges.appSeconds))) redirect("/security/verify?next=/overview");

  const [reporting, alerts] = await Promise.all([getReportingContext(), getAlerts()]);
  const label = `${profile.role.replaceAll("_", " ").toUpperCase()} / ${profile.display_name}`;

  return (
    <CommandShell
      userLabel={label}
      demo={reporting.dataMode === "demo" && demoDataAllowed()}
      periodLabel={reporting.label}
      alertCount={alerts.length}
      alerts={alerts.slice(0, 5)}
    >
      {children}
    </CommandShell>
  );
}
