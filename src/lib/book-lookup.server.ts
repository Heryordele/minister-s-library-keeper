import { createServerFn } from "@tanstack/react-start";
import { lookupIsbn } from "./book-lookup";

export const serverLookupIsbn = createServerFn()
  .handler(async (isbn: string) => {
    return await lookupIsbn(isbn, process.env.GOOGLE_BOOKS_API_KEY);
  });
