import "server-only";

export function demoDataAllowed() {
  return process.env.GM_ALLOW_DEMO_DATA === "1" ||
    (process.env.NODE_ENV !== "production" && process.env.GM_ALLOW_DEMO_DATA !== "0");
}
