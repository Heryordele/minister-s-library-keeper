import { createServerFn } from "@tanstack/react-start";
import { lookupIsbn, type LookupResult } from "./book-lookup";

export const serverLookupIsbn = createServerFn()
  .handler(async (data: string | { data: string }) => {
    try {
      // Handle both string and object parameter formats from TanStack
      const isbn = typeof data === "string" ? data : (data as any).data;

      console.log(`[DEBUG] Lookup started for ISBN: ${isbn}`);
      console.log(`[DEBUG] API Key present: ${!!process.env.GOOGLE_BOOKS_API_KEY}`);

      const result = await lookupIsbn(isbn, process.env.GOOGLE_BOOKS_API_KEY);

      console.log(`[DEBUG] Lookup result:`, result);
      return result;
    } catch (e) {
      console.error(`[ERROR] ISBN lookup failed:`, e);
      throw e;
    }
  });

// Enrich an existing book with ISBN lookup data
export const enrichBook = createServerFn()
  .handler(async (data: string | { data: string }) => {
    try {
      const isbn = typeof data === "string" ? data : (data as any).data;

      console.log(`[DEBUG] Enriching book with ISBN: ${isbn}`);

      const lookupResult = await lookupIsbn(isbn, process.env.GOOGLE_BOOKS_API_KEY);

      if (!lookupResult) {
        return {
          success: false,
          error: "No book found for this ISBN in Google Books or Open Library",
          data: null,
        };
      }

      console.log(`[DEBUG] Enrichment data found:`, lookupResult);

      return {
        success: true,
        error: null,
        data: lookupResult,
      };
    } catch (e) {
      console.error(`[ERROR] Book enrichment failed:`, e);
      return {
        success: false,
        error: e instanceof Error ? e.message : "Unknown error",
        data: null,
      };
    }
  });
