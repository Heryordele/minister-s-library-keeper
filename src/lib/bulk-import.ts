import * as XLSX from "xlsx";

import type { Category } from "@/lib/books";

export const IMPORT_COLUMNS = [
  "title",
  "author",
  "isbn",
  "publisher",
  "publication_year",
  "category",
  "purchase_date",
  "purchase_value",
] as const;

export type ImportRow = {
  title: string;
  author: string | null;
  isbn: string | null;
  publisher: string | null;
  publication_year: number | null;
  category_id: string | null;
  purchase_date: string | null;
  purchase_value: number | null;
};

export type ParsedRow =
  | { line: number; ok: true; row: ImportRow; categoryName: string | null }
  | { line: number; ok: false; title: string; errors: string[] };

function cell(raw: Record<string, unknown>, key: string): string {
  const match = Object.keys(raw).find(
    (k) => k.trim().toLowerCase().replace(/\s+/g, "_") === key,
  );
  const value = match ? raw[match] : undefined;
  if (value === undefined || value === null) return "";
  return String(value).trim();
}

function toDate(value: string): string | null {
  if (!value) return null;
  // Excel serial date
  if (/^\d{5}$/.test(value)) {
    const parsed = XLSX.SSF.parse_date_code(Number(value));
    if (parsed) {
      const pad = (n: number) => String(n).padStart(2, "0");
      return `${parsed.y}-${pad(parsed.m)}-${pad(parsed.d)}`;
    }
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

export async function parseImportFile(
  file: File,
  categories: Category[],
): Promise<ParsedRow[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) return [];
  const raws = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
  });

  const byName = new Map(
    categories.map((c) => [c.name.trim().toLowerCase(), c.id]),
  );

  return raws.map((raw, i) => {
    const line = i + 2; // header is line 1
    const errors: string[] = [];

    const title = cell(raw, "title");
    if (!title) errors.push("Title is required.");

    const yearRaw = cell(raw, "publication_year");
    let publication_year: number | null = null;
    if (yearRaw) {
      const n = Number(yearRaw);
      if (!Number.isInteger(n) || n < 1000 || n > 2200) {
        errors.push(`Publication year "${yearRaw}" is not a valid year.`);
      } else {
        publication_year = n;
      }
    }

    const valueRaw = cell(raw, "purchase_value");
    let purchase_value: number | null = null;
    if (valueRaw) {
      const n = Number(valueRaw.replace(/[^0-9.\-]/g, ""));
      if (!Number.isFinite(n) || n < 0) {
        errors.push(`Purchase value "${valueRaw}" is not a valid amount.`);
      } else {
        purchase_value = n;
      }
    }

    const dateRaw = cell(raw, "purchase_date");
    let purchase_date: string | null = null;
    if (dateRaw) {
      purchase_date = toDate(dateRaw);
      if (!purchase_date) {
        errors.push(`Purchase date "${dateRaw}" is not a valid date.`);
      }
    }

    const isbnRaw = cell(raw, "isbn").replace(/[^0-9Xx]/g, "").toUpperCase();
    if (isbnRaw && isbnRaw.length !== 10 && isbnRaw.length !== 13) {
      errors.push(`ISBN "${isbnRaw}" must be 10 or 13 characters.`);
    }

    const categoryName = cell(raw, "category");
    let category_id: string | null = null;
    if (categoryName) {
      category_id = byName.get(categoryName.toLowerCase()) ?? null;
      if (!category_id) {
        errors.push(`Category "${categoryName}" does not match any category.`);
      }
    }

    if (errors.length > 0) {
      return { line, ok: false as const, title: title || "(untitled row)", errors };
    }

    return {
      line,
      ok: true as const,
      categoryName: categoryName || null,
      row: {
        title,
        author: cell(raw, "author") || null,
        isbn: isbnRaw || null,
        publisher: cell(raw, "publisher") || null,
        publication_year,
        category_id,
        purchase_date,
        purchase_value,
      },
    };
  });
}

export function templateCsv(): string {
  return `${IMPORT_COLUMNS.join(",")}\nKnowing God,J. I. Packer,9780830816507,InterVarsity Press,1993,Systematic,2024-03-01,18.50\n`;
}
