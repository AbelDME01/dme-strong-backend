/**
 * Accepts any UUID-shaped identifier (8-4-4-4-12 hex), regardless of the
 * version/variant nibbles. This is intentionally looser than class-validator's
 * `@IsUUID()` because the seeded `exercises` rows use deterministic IDs whose
 * version digit is `0` (not a spec version 1-5), and they must remain usable as
 * references from routines, workout sets and records.
 */
export const UUID_LIKE_REGEX =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
