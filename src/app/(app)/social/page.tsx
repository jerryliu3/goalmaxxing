import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SocialPageBody } from "@/features/social/social-page-body";
import { isFeatureEnabled } from "@/lib/feature-flags";

export default function SocialPage() {
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

  return <SocialPageBody />;
}
