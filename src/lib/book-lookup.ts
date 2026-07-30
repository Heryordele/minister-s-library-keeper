export type LookupResult = {
  isbn: string;
  title: string;
  author: string | null;
  publisher: string | null;
  publication_year: number | null;
  description: string | null;
  cover_image_url: string | null;
  source: "Google Books" | "Open Library";
};

export function normaliseIsbn(raw: string): string {
  return raw.replace(/[^0-9Xx]/g, "").toUpperCase();
}

export function isValidIsbn(isbn: string): boolean {
  const v = normaliseIsbn(isbn);
  return v.length === 10 || v.length === 13;
}

async function fromGoogleBooks(isbn: string): Promise<LookupResult | null> {
  const res = await fetch(
    `https://www.googleapis.com/books/v1/volumes?q=isbn:${encodeURIComponent(isbn)}`,
  );
  if (!res.ok) return null;
  const json = await res.json();
  const info = json?.items?.[0]?.volumeInfo;
  if (!info) return null;
  const year = info.publishedDate
    ? Number(String(info.publishedDate).slice(0, 4))
    : null;
  const thumb: string | undefined =
    info.imageLinks?.thumbnail ?? info.imageLinks?.smallThumbnail;
  return {
    isbn,
    title: info.title ?? "",
    author: Array.isArray(info.authors) ? info.authors.join(", ") : null,
    publisher: info.publisher ?? null,
    publication_year: Number.isFinite(year) ? year : null,
    description: info.description ?? null,
    cover_image_url: thumb ? thumb.replace(/^http:/, "https:") : null,
    source: "Google Books",
  };
}

async function fromOpenLibrary(isbn: string): Promise<LookupResult | null> {
  const res = await fetch(
    `https://openlibrary.org/api/books?bibkeys=ISBN:${encodeURIComponent(isbn)}&format=json&jscmd=data`,
  );
  if (!res.ok) return null;
  const json = await res.json();
  const info = json?.[`ISBN:${isbn}`];
  if (!info) return null;
  const year = info.publish_date
    ? Number(String(info.publish_date).match(/\d{4}/)?.[0])
    : null;
  return {
    isbn,
    title: info.title ?? "",
    author: Array.isArray(info.authors)
      ? info.authors.map((a: { name: string }) => a.name).join(", ")
      : null,
    publisher: Array.isArray(info.publishers)
      ? info.publishers.map((p: { name: string }) => p.name).join(", ")
      : null,
    publication_year: Number.isFinite(year) ? (year as number) : null,
    description:
      typeof info.notes === "string"
        ? info.notes
        : (info.notes?.value ?? null),
    cover_image_url: info.cover?.medium ?? info.cover?.large ?? null,
    source: "Open Library",
  };
}

/** Google Books first, Open Library as fallback. Returns null when neither has a match. */
export async function lookupIsbn(rawIsbn: string): Promise<LookupResult | null> {
  const isbn = normaliseIsbn(rawIsbn);
  if (!isbn) return null;
  try {
    const google = await fromGoogleBooks(isbn);
    if (google?.title) return google;
  } catch {
    /* fall through to Open Library */
  }
  try {
    const open = await fromOpenLibrary(isbn);
    if (open?.title) return open;
  } catch {
    /* no match */
  }
  return null;
}
