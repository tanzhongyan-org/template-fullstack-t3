/**
 * Shared shapes for tenant-owned content tables (notes, examples, and every
 * `make new-feature` slice): the patch builder for optional title/body updates.
 */

export interface ContentPatch {
  title?: string;
  body?: string;
}

/** Build a Drizzle set-patch from optional title/body input, skipping absent keys. */
export function contentValues(input: ContentPatch): ContentPatch {
  const values: ContentPatch = {};
  if (input.title !== undefined) values.title = input.title;
  if (input.body !== undefined) values.body = input.body;
  return values;
}
