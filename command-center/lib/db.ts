import "server-only";
import postgres from "postgres";

let client: ReturnType<typeof postgres> | null = null;

export function db() {
  if (!client) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not configured");
    client = postgres(url, { ssl: "require", prepare: false });
  }
  return client;
}
