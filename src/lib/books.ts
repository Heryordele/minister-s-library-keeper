import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Book = Tables<"books">;
export type Category = Tables<"categories">;

export const READING_STATUSES = ["unread", "reading", "completed"] as const;
export const LENDING_STATUSES = [
  "available",
  "borrowed",
  "overdue",
  "returned",
  "lost",
] as const;

export const booksKey = ["books"] as const;
export const categoriesKey = ["categories"] as const;

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("parent_group")
    .order("sort_order");
  if (error) throw error;
  return data ?? [];
}

export async function fetchBooks(): Promise<Book[]> {
  const { data, error } = await supabase
    .from("books")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchBook(id: string): Promise<Book | null> {
  const { data, error } = await supabase
    .from("books")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** Covers live in a private bucket keyed by `${userId}/${file}` — resolve a signed URL. */
export async function signedCoverUrl(path: string | null): Promise<string | null> {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const { data } = await supabase.storage
    .from("book-covers")
    .createSignedUrl(path, 60 * 60);
  return data?.signedUrl ?? null;
}

export async function uploadCover(file: File): Promise<string> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) throw new Error("You must be signed in to upload a cover.");
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from("book-covers")
    .upload(path, file, { upsert: false, contentType: file.type });
  if (error) throw error;
  return path;
}

/** Purchase receipts live in a private bucket keyed by `${userId}/${file}`. */
export async function signedReceiptUrl(path: string | null): Promise<string | null> {
  if (!path) return null;
  const { data } = await supabase.storage
    .from("receipts")
    .createSignedUrl(path, 60 * 60);
  return data?.signedUrl ?? null;
}

export async function uploadReceipt(file: File): Promise<string> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) throw new Error("You must be signed in to upload a receipt.");
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "pdf";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from("receipts")
    .upload(path, file, { upsert: false, contentType: file.type });
  if (error) throw error;
  return path;
}

export async function deleteBooks(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const { error } = await supabase.from("books").delete().in("id", ids);
  if (error) throw error;
}

export function groupCategories(categories: Category[]) {
  const groups = new Map<string, Category[]>();
  for (const c of categories) {
    const list = groups.get(c.parent_group) ?? [];
    list.push(c);
    groups.set(c.parent_group, list);
  }
  return [...groups.entries()];
}
