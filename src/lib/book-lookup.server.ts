import { createServerFn } from "@tanstack/react-start";
import { lookupIsbn } from "./book-lookup";

export const serverLookupIsbn = createServerFn()
  .handler(async (isbn: string) => {
    try {
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
