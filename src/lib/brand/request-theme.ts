import { getTheme, type Theme } from "@cadence/shared/brand";
import { cookies } from "next/headers";
import { parseUiStyleId, UI_STYLE_COOKIE_NAME } from "@/lib/brand/ui-style";

/** The theme this request renders: an explicit id, else the style cookie. */
export async function requestTheme(requested?: string | null): Promise<Theme> {
  const value = requested ?? (await cookies()).get(UI_STYLE_COOKIE_NAME)?.value;
  return getTheme(parseUiStyleId(value));
}
