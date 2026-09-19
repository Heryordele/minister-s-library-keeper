import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { enrichBook } from "@/lib/book-lookup.server";
import { type LookupResult } from "@/lib/book-lookup";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface BookEnrichmentDialogProps {
  isbn: string;
  currentData: {
    title: string;
    author?: string | null;
    publisher?: string | null;
    description?: string | null;
    cover_image_url?: string | null;
    publication_year?: number | null;
  };
  onEnrich: (data: LookupResult) => void;
  onClose: () => void;
}

export function BookEnrichmentDialog({
  isbn,
  currentData,
  onEnrich,
  onClose,
}: BookEnrichmentDialogProps) {
  const [loading, setLoading] = useState(false);
  const [enrichedData, setEnrichedData] = useState<LookupResult | null>(null);
  const [selectedFields, setSelectedFields] = useState<Set<keyof LookupResult>>(
    new Set(["title", "author", "publisher", "description", "cover_image_url", "publication_year"])
  );

  const lookup = useServerFn(enrichBook);

  const handleLookup = async () => {
    try {
      setLoading(true);
      const result = await lookup(isbn);

      if (!result.success || !result.data) {
        toast.error(result.error || "Failed to look up book");
        return;
      }

      setEnrichedData(result.data);
      toast.success("Book found! Review the data below.");
    } catch (e) {
      toast.error("Error looking up book");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (!enrichedData) return;

    // Filter to only selected fields
    const filtered = Object.fromEntries(
      Object.entries(enrichedData).filter(([key]) =>
        selectedFields.has(key as keyof LookupResult)
      )
    ) as Partial<LookupResult>;

    onEnrich({ ...enrichedData, ...filtered });
    toast.success("Book enriched successfully!");
    onClose();
  };

  const toggleField = (field: keyof LookupResult) => {
    const newSet = new Set(selectedFields);
    if (newSet.has(field)) {
      newSet.delete(field);
    } else {
      newSet.add(field);
    }
    setSelectedFields(newSet);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-lg p-6 shadow-lg">
        <h2 className="text-2xl font-bold mb-4">Enrich Book from ISBN</h2>

        {!enrichedData ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              ISBN: <strong>{isbn}</strong>
            </p>
            <p className="text-sm text-muted-foreground">
              This will look up the book in Google Books and Open Library to fill in
              missing details like cover image, author, publisher, and description.
            </p>

            <div className="flex gap-2">
              <Button onClick={handleLookup} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? "Looking up..." : "Look up Book"}
              </Button>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-4">
              {/* Title */}
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={selectedFields.has("title")}
                  onChange={() => toggleField("title")}
                  className="mt-1"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium">Title</p>
                  <p className="text-sm text-muted-foreground">
                    Current: {currentData.title || "—"}
                  </p>
                  <p className="text-sm font-semibold text-green-600">
                    New: {enrichedData.title}
                  </p>
                </div>
              </div>

              {/* Author */}
              {enrichedData.author && (
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selectedFields.has("author")}
                    onChange={() => toggleField("author")}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Author</p>
                    <p className="text-sm text-muted-foreground">
                      Current: {currentData.author || "—"}
                    </p>
                    <p className="text-sm font-semibold text-green-600">
                      New: {enrichedData.author}
                    </p>
                  </div>
                </div>
              )}

              {/* Publisher */}
              {enrichedData.publisher && (
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selectedFields.has("publisher")}
                    onChange={() => toggleField("publisher")}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Publisher</p>
                    <p className="text-sm text-muted-foreground">
                      Current: {currentData.publisher || "—"}
                    </p>
                    <p className="text-sm font-semibold text-green-600">
                      New: {enrichedData.publisher}
                    </p>
                  </div>
                </div>
              )}

              {/* Publication Year */}
              {enrichedData.publication_year && (
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selectedFields.has("publication_year")}
                    onChange={() => toggleField("publication_year")}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Publication Year</p>
                    <p className="text-sm text-muted-foreground">
                      Current: {currentData.publication_year || "—"}
                    </p>
                    <p className="text-sm font-semibold text-green-600">
                      New: {enrichedData.publication_year}
                    </p>
                  </div>
                </div>
              )}

              {/* Cover Image */}
              {enrichedData.cover_image_url && (
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selectedFields.has("cover_image_url")}
                    onChange={() => toggleField("cover_image_url")}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Cover Image</p>
                    <p className="text-sm text-muted-foreground">
                      {currentData.cover_image_url ? "Has cover" : "No cover"}
                    </p>
                    <img
                      src={enrichedData.cover_image_url}
                      alt="New cover"
                      className="mt-2 h-32 w-auto rounded border"
                    />
                  </div>
                </div>
              )}

              {/* Description */}
              {enrichedData.description && (
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selectedFields.has("description")}
                    onChange={() => toggleField("description")}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Description</p>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      Current: {currentData.description || "—"}
                    </p>
                    <p className="text-sm text-green-600 line-clamp-3 mt-1">
                      New: {enrichedData.description}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2 border-t pt-4">
              <Button onClick={handleSave} disabled={selectedFields.size === 0}>
                Save Selected Changes
              </Button>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
