import { useEffect, useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileText, Loader2, Upload, X } from "lucide-react";

import {
  categoriesKey,
  fetchCategories,
  groupCategories,
  signedReceiptUrl,
  uploadCover,
  uploadReceipt,
  type Book,
} from "@/lib/books";
import { BookCover } from "@/components/book-cover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type BookFormValues = {
  title: string;
  author: string | null;
  isbn: string | null;
  publisher: string | null;
  publication_year: number | null;
  category_id: string | null;
  edition: string | null;
  description: string | null;
  cover_image_url: string | null;
  receipt_url: string | null;
  purchase_date: string | null;
  purchase_value: number | null;
};

const NONE = "__none__";

function initial(book?: Partial<Book> | null): BookFormValues {
  return {
    title: book?.title ?? "",
    author: book?.author ?? null,
    isbn: book?.isbn ?? null,
    publisher: book?.publisher ?? null,
    publication_year: book?.publication_year ?? null,
    category_id: book?.category_id ?? null,
    edition: book?.edition ?? null,
    description: book?.description ?? null,
    cover_image_url: book?.cover_image_url ?? null,
    receipt_url: book?.receipt_url ?? null,
    purchase_date: book?.purchase_date ?? null,
    purchase_value: book?.purchase_value ?? null,
  };
}

export function BookForm({
  book,
  submitLabel,
  submitting,
  onSubmit,
  onCancel,
  error,
}: {
  book?: Partial<Book> | null;
  submitLabel: string;
  submitting: boolean;
  onSubmit: (values: BookFormValues) => void;
  onCancel?: () => void;
  error?: string | null;
}) {
  const [values, setValues] = useState<BookFormValues>(() => initial(book));
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [receiptUploading, setReceiptUploading] = useState(false);
  const [receiptError, setReceiptError] = useState<string | null>(null);
  const [receiptLink, setReceiptLink] = useState<string | null>(null);

  const { data: categories = [] } = useQuery({
    queryKey: categoriesKey,
    queryFn: fetchCategories,
  });

  useEffect(() => {
    let cancelled = false;
    if (!values.receipt_url) {
      setReceiptLink(null);
      return;
    }
    signedReceiptUrl(values.receipt_url)
      .then((url) => {
        if (!cancelled) setReceiptLink(url);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [values.receipt_url]);

  function set<K extends keyof BookFormValues>(key: K, value: BookFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setUploadError(null);
    setUploading(true);
    try {
      const path = await uploadCover(file);
      set("cover_image_url", path);
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function handleReceipt(file: File | undefined) {
    if (!file) return;
    setReceiptError(null);
    setReceiptUploading(true);
    try {
      const path = await uploadReceipt(file);
      set("receipt_url", path);
    } catch (e) {
      setReceiptError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setReceiptUploading(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!values.title.trim()) return;
    onSubmit({ ...values, title: values.title.trim() });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <section className="grid gap-5 sm:grid-cols-2">
        <Field className="sm:col-span-2" id="title" label="Title" required>
          <Input
            id="title"
            required
            value={values.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="Knowing God"
          />
        </Field>

        <Field id="author" label="Author">
          <Input
            id="author"
            value={values.author ?? ""}
            onChange={(e) => set("author", e.target.value || null)}
            placeholder="J. I. Packer"
          />
        </Field>

        <Field id="isbn" label="ISBN">
          <Input
            id="isbn"
            value={values.isbn ?? ""}
            onChange={(e) => set("isbn", e.target.value || null)}
            placeholder="9780830816507"
          />
        </Field>

        <Field id="publisher" label="Publisher">
          <Input
            id="publisher"
            value={values.publisher ?? ""}
            onChange={(e) => set("publisher", e.target.value || null)}
          />
        </Field>

        <Field id="publication_year" label="Publication year">
          <Input
            id="publication_year"
            type="number"
            inputMode="numeric"
            min={1000}
            max={2200}
            value={values.publication_year ?? ""}
            onChange={(e) =>
              set(
                "publication_year",
                e.target.value ? Number(e.target.value) : null,
              )
            }
          />
        </Field>

        <Field id="category" label="Category">
          <Select
            value={values.category_id ?? NONE}
            onValueChange={(v) => set("category_id", v === NONE ? null : v)}
          >
            <SelectTrigger id="category">
              <SelectValue placeholder="Choose a category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>Uncategorised</SelectItem>
              {groupCategories(categories).map(([group, items]) => (
                <SelectGroup key={group}>
                  <SelectLabel>{group}</SelectLabel>
                  {items.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field id="edition" label="Edition">
          <Input
            id="edition"
            value={values.edition ?? ""}
            onChange={(e) => set("edition", e.target.value || null)}
            placeholder="2nd edition"
          />
        </Field>

        <Field id="purchase_date" label="Purchase date">
          <Input
            id="purchase_date"
            type="date"
            value={values.purchase_date ?? ""}
            onChange={(e) => set("purchase_date", e.target.value || null)}
          />
        </Field>

        <Field id="purchase_value" label="Purchase value">
          <Input
            id="purchase_value"
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            value={values.purchase_value ?? ""}
            onChange={(e) =>
              set("purchase_value", e.target.value ? Number(e.target.value) : null)
            }
          />
        </Field>

        <Field className="sm:col-span-2" id="description" label="Description">
          <Textarea
            id="description"
            rows={4}
            value={values.description ?? ""}
            onChange={(e) => set("description", e.target.value || null)}
            placeholder="A short summary, or what this book is for in your ministry."
          />
        </Field>
      </section>



      <section className="space-y-3 border-t border-border pt-6">
        <Label>Cover image</Label>
        <div className="flex items-start gap-4">
          <BookCover
            path={values.cover_image_url}
            title={values.title || "this book"}
            className="w-24 shrink-0 border border-border"
          />
          <div className="space-y-2">
            <input
              id="cover"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => void handleFile(e.target.files?.[0])}
            />
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploading}
                onClick={() => document.getElementById("cover")?.click()}
              >
                {uploading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                {values.cover_image_url ? "Replace cover" : "Upload cover"}
              </Button>
              {values.cover_image_url && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => set("cover_image_url", null)}
                >
                  <X className="mr-2 h-4 w-4" /> Remove
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              JPG or PNG. Optional — a placeholder is shown if you skip it.
            </p>
            {uploadError && (
              <p className="text-xs text-destructive">{uploadError}</p>
            )}
          </div>
        </div>
      </section>

      <section className="space-y-3 border-t border-border pt-6">
        <Label>Purchase receipt</Label>
        <input
          id="receipt"
          type="file"
          accept="image/*,application/pdf"
          className="hidden"
          onChange={(e) => void handleReceipt(e.target.files?.[0])}
        />
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={receiptUploading}
            onClick={() => document.getElementById("receipt")?.click()}
          >
            {receiptUploading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            {values.receipt_url ? "Replace receipt" : "Upload receipt"}
          </Button>
          {values.receipt_url && receiptLink && (
            <Button asChild variant="ghost" size="sm">
              <a href={receiptLink} target="_blank" rel="noreferrer">
                <FileText className="mr-2 h-4 w-4" /> View receipt
              </a>
            </Button>
          )}
          {values.receipt_url && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => set("receipt_url", null)}
            >
              <X className="mr-2 h-4 w-4" /> Remove
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          PDF or photo. Kept privately with this book for your records.
        </p>
        {receiptError && <p className="text-xs text-destructive">{receiptError}</p>}
      </section>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex flex-wrap gap-2 border-t border-border pt-6">
        <Button
          type="submit"
          disabled={submitting || uploading || receiptUploading}
        >
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}

function Field({
  id,
  label,
  required,
  className,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <Label htmlFor={id} className="mb-1.5 block">
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      {children}
    </div>
  );
}
