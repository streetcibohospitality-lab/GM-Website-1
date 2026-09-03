export const OWNER_DIRECTORY = [
  { displayName: "Mueen Ahmed", email: "mueen.ahmed1922@gmail.com" },
  { displayName: "Mohammed Afridi", email: "reachafridi@gmail.com" },
  { displayName: "Mohammed Hisham", email: "md.hisham29@gmail.com" },
] as const;

export type OwnerDirectoryEntry = (typeof OWNER_DIRECTORY)[number];

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

const BY_EMAIL = new Map(OWNER_DIRECTORY.map((entry) => [normalizeEmail(entry.email), entry] as const));

export function ownerByEmail(email: string) {
  return BY_EMAIL.get(normalizeEmail(email));
}

export function isConfiguredOwnerEmail(email: string) {
  return BY_EMAIL.has(normalizeEmail(email));
}
