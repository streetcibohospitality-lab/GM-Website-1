import "server-only";
import { createHash } from "node:crypto";
import { headers } from "next/headers";

function sha(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export async function requestMeta() {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for") || "";
  const ip = forwarded.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
  const userAgent = h.get("user-agent") || "unknown";
  return {
    ipHash: sha(ip),
    userAgentHash: sha(userAgent),
    country: h.get("x-vercel-ip-country") || "",
    requestId: h.get("x-vercel-id") || h.get("x-request-id") || ""
  };
}
