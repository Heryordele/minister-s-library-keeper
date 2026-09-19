/**
 * Lightweight, dependency-free email typo detection — the "mailcheck.js"
 * idea in ~40 lines. Catches the common case of a slightly mistyped
 * domain (gmial.com, gmail.con, yahooo.com) by comparing against a list
 * of common providers using edit distance, entirely client-side.
 *
 * This is NOT deliverability verification (it doesn't check the address
 * actually exists) — it just flags "this looks like a typo of a domain
 * people actually use" so the user can catch their own mistake before
 * submitting.
 */

const COMMON_DOMAINS = [
  "gmail.com",
  "yahoo.com",
  "hotmail.com",
  "outlook.com",
  "icloud.com",
  "aol.com",
  "protonmail.com",
  "live.com",
  "msn.com",
  "yahoo.co.uk",
  "hotmail.co.uk",
  "googlemail.com",
];

// Common malformed TLDs that should almost always be ".com"
const TLD_TYPOS: Record<string, string> = {
  con: "com",
  cm: "com",
  comm: "com",
  vom: "com",
  xom: "com",
  ocm: "com",
  clm: "com",
};

function levenshtein(a: string, b: string): number {
  const dp: number[][] = Array.from({ length: a.length + 1 }, (_, i) => [
    i,
    ...Array(b.length).fill(0),
  ]);
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[a.length][b.length];
}

/**
 * Returns a suggested correction for `email`, or null if the email looks
 * fine (or doesn't look close enough to any known domain to guess).
 */
export function suggestEmailCorrection(email: string): string | null {
  const trimmed = email.trim();
  const at = trimmed.lastIndexOf("@");
  if (at < 1 || at === trimmed.length - 1) return null; // no @, or nothing after it

  const local = trimmed.slice(0, at);
  const domain = trimmed.slice(at + 1).toLowerCase();
  if (!domain.includes(".")) return null;

  // 1. Exact match against a known typo'd TLD (gmail.con -> gmail.com)
  const dotIndex = domain.lastIndexOf(".");
  const domainBase = domain.slice(0, dotIndex);
  const tld = domain.slice(dotIndex + 1);
  if (TLD_TYPOS[tld] && COMMON_DOMAINS.includes(`${domainBase}.${TLD_TYPOS[tld]}`)) {
    return `${local}@${domainBase}.${TLD_TYPOS[tld]}`;
  }

  // 2. Already a known-good domain — nothing to suggest
  if (COMMON_DOMAINS.includes(domain)) return null;

  // 3. Close (1-2 edits) to a known domain — likely a typo
  let best: { domain: string; distance: number } | null = null;
  for (const known of COMMON_DOMAINS) {
    const distance = levenshtein(domain, known);
    if (distance > 0 && distance <= 2 && (!best || distance < best.distance)) {
      best = { domain: known, distance };
    }
  }
  if (!best) return null;

  return `${local}@${best.domain}`;
}
