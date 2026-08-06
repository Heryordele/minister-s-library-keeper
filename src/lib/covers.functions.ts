import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

/**
 * Copies a remote cover thumbnail (Google Books / Open Library) into our own
 * storage bucket so the image survives if the source ever disappears.
 * Returns the storage path, or the original URL if the copy could not be made.
 */
export const mirrorRemoteCover = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ url: z.string().url().max(2000) }).parse(data))
  .handler(async ({ data, context }) => {
    const { url } = data;
    if (!/^https:\/\//i.test(url)) return { path: url, mirrored: false };

    try {
      const res = await fetch(url);
      if (!res.ok) return { path: url, mirrored: false };

      const contentType = (res.headers.get("content-type") ?? "").split(";")[0]!.trim();
      const ext = EXT_BY_TYPE[contentType.toLowerCase()];
      if (!ext) return { path: url, mirrored: false };

      const bytes = new Uint8Array(await res.arrayBuffer());
      if (bytes.byteLength === 0 || bytes.byteLength > 5_000_000) {
        return { path: url, mirrored: false };
      }

      const path = `${context.userId}/${crypto.randomUUID()}.${ext}`;
      const { error } = await context.supabase.storage
        .from("book-covers")
        .upload(path, bytes, { contentType, upsert: false });
      if (error) return { path: url, mirrored: false };

      return { path, mirrored: true };
    } catch {
      return { path: url, mirrored: false };
    }
  });
