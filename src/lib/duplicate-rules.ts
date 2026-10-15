export type DuplicateCandidate = {
  title: string;
  author?: string | null;
  isbn?: string | null;
};

export type ExistingBook = {
  id: string;
  title: string;
  author: string | null;
  isbn: string | null;
};

export type DuplicateMatch = {
  book: ExistingBook;
  reason: "isbn" | "title_author";
};

/** Digits and X only, uppercase; ISBN-10 converted to ISBN-13 so the two forms match. */
export function normalizeIsbn(value: string | null | undefined): string | null {
  if (!value) return null;
  const s = value.toUpperCase().replace(/[^0-9X]/g, "");
  if (s.length === 13 && /^\d{13}$/.test(s)) return s;
  if (s.length === 10 && /^\d{9}[\dX]$/.test(s)) {
    const body = `978${s.slice(0, 9)}`;
    const sum = [...body].reduce((acc, d, i) => acc + Number(d) * (i % 2 === 0 ? 1 : 3), 0);
    return `${body}${(10 - (sum % 10)) % 10}`;
  }
  return null;
}

/** Lowercase, no accents or punctuation, no leading article, single spaces. */
export function normalizeText(value: string | null | undefined): string {
  if (!value) return "";
  const cleaned = value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned.replace(/^(the|a|an) /, "");
}

function authorTokens(value: string | null | undefined): Set<string> {
  return new Set(
    normalizeText(value)
      .split(" ")
      .filter((t) => t.length >= 3),
  );
}

function authorsOverlap(a: string | null | undefined, b: string | null | undefined): boolean {
  const ta = authorTokens(a);
  const tb = authorTokens(b);
  if (ta.size === 0 || tb.size === 0) return true; // missing author: don't rule it out
  for (const t of ta) if (tb.has(t)) return true;
  return false;
}

/**
 * A book is a duplicate when it has the same ISBN, or the same title with an
 * author that overlaps (or either side has no author recorded).
 */
export function findDuplicateMatches(
  candidate: DuplicateCandidate,
  existing: ExistingBook[],
): DuplicateMatch[] {
  const isbn = normalizeIsbn(candidate.isbn);
  const title = normalizeText(candidate.title);
  const matches: DuplicateMatch[] = [];

  for (const book of existing) {
    if (isbn && normalizeIsbn(book.isbn) === isbn) {
      matches.push({ book, reason: "isbn" });
      continue;
    }
    if (
      title &&
      normalizeText(book.title) === title &&
      authorsOverlap(candidate.author, book.author)
    ) {
      matches.push({ book, reason: "title_author" });
    }
  }
  return matches;
}
