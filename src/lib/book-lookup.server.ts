import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { lookupIsbn, type LookupResult } from "./book-lookup";

const isbnInput = z.string().trim().min(10).max(20);

export const serverLookupIsbn = createServerFn({ method: "POST" })
  .inputValidator((data) => isbnInput.parse(data))
  .handler(async ({ data }): Promise<LookupResult | null> => {
    try {
      return await lookupIsbn(data, process.env.GOOGLE_BOOKS_API_KEY);
    } catch (e) {
      console.error("[ERROR] ISBN lookup failed:", e);
      throw e;
    }
  });

// Enrich an existing book with ISBN lookup data
export const enrichBook = createServerFn({ method: "POST" })
  .inputValidator((data) => isbnInput.parse(data))
  .handler(async ({ data }) => {
    try {
      const lookupResult = await lookupIsbn(data, process.env.GOOGLE_BOOKS_API_KEY);

      if (!lookupResult) {
        return {
          success: false,
          error: "No book found for this ISBN in Google Books or Open Library",
          data: null,
        };
      }

      return {
        success: true,
        error: null,
        data: lookupResult,
      };
    } catch (e) {
      console.error("[ERROR] Book enrichment failed:", e);
      return {
        success: false,
        error: e instanceof Error ? e.message : "Unknown error",
        data: null,
      };
    }
  });
