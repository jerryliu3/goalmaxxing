import { z } from "zod";

export const DIGEST_ITEM_LIMIT = 5;

export const digestCreditStateSchema = z.enum(["completed", "open"]);

export const digestFactItemSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    date: z.iso.date(),
    state: digestCreditStateSchema,
  })
  .strict();

export const digestWindowFactsSchema = z
  .object({
    label: z.string().trim().min(1).max(40),
    start: z.iso.date(),
    end: z.iso.date(),
    placed: z.number().int().nonnegative(),
    completed: z.number().int().nonnegative(),
    items: z.array(digestFactItemSchema).max(DIGEST_ITEM_LIMIT),
  })
  .strict();

export const digestFactsSchema = z
  .object({
    recap: digestWindowFactsSchema,
    ahead: digestWindowFactsSchema,
  })
  .strict();

export const digestSuggestionActionSchema = z.enum([
  "plan",
  "today",
  "progress",
]);

export const digestSuggestionSchema = z
  .object({
    title: z.string().trim().min(1).max(80),
    body: z.string().trim().min(1).max(240),
    action: digestSuggestionActionSchema.nullable(),
  })
  .strict();

export const digestSuggestionsSchema = z
  .object({
    motivation: z.string().trim().min(1).max(280),
    suggestions: z.array(digestSuggestionSchema).max(3),
  })
  .strict();

export type DigestFacts = z.infer<typeof digestFactsSchema>;
export type DigestFactItem = z.infer<typeof digestFactItemSchema>;
export type DigestSuggestions = z.infer<typeof digestSuggestionsSchema>;
export type DigestSuggestionAction = z.infer<typeof digestSuggestionActionSchema>;
