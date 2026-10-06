import { buildAppIconSvg } from "@/lib/brand/app-icon";
import { requestTheme } from "@/lib/brand/request-theme";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const requested = searchParams.get("style");
  const theme = await requestTheme(requested);
  return new Response(buildAppIconSvg(theme.themeColor), {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "private, no-store",
    },
  });
}
