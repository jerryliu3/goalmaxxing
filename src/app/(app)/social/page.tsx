import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SocialPageBody } from "@/features/social/social-page-body";
import { isFeatureEnabled } from "@/lib/feature-flags";

function firstParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

export default async function SocialPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (!isFeatureEnabled("socialEnabled")) {
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Social is not enabled yet</CardTitle>
          <CardDescription>
            Social surfaces are staged behind `SOCIAL_ENABLED`.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const params = await searchParams;
  return <SocialPageBody initialTab={firstParam(params.tab)} />;
}
