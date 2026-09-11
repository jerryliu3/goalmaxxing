import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  experimental: {
    viewTransition: true,
    staleTimes: {
      dynamic: 300,
      static: 300,
    },
  },
  transpilePackages: ["@cadence/shared"],
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "127.0.0.1",
      },
      {
        protocol: "http",
        hostname: "localhost",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/ux/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

const sentryAuthToken = process.env.SENTRY_AUTH_TOKEN?.trim();
const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN?.trim();

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: sentryAuthToken,
  silent: !process.env.CI,
  // Keep builds green when Sentry isn't configured yet.
  sourcemaps: {
    disable: !sentryAuthToken,
  },
  release: sentryAuthToken
    ? undefined
    : {
        create: false,
        finalize: false,
      },
  widenClientFileUpload: Boolean(sentryAuthToken),
  tunnelRoute: sentryDsn ? "/sentry-tunnel" : undefined,
  telemetry: false,
});
