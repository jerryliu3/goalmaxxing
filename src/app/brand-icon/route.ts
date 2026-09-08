import { cookies } from "next/headers";
import { buildAppIconSvg } from "@/lib/brand/app-icon";
import { getUiStyle, parseUiStyleId, UI_STYLE_COOKIE_NAME } from "@/lib/brand/ui-style";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const requested = searchParams.get("style");
  const styleId = parseUiStyleId(
    requested ?? (await cookies()).get(UI_STYLE_COOKIE_NAME)?.value
  );
  return new Response(buildAppIconSvg(getUiStyle(styleId).themeColor), {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "private, no-store",
    },
  });
}
