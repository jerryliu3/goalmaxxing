import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  // Pin the workspace root: a stray lockfile above the repo makes Turbopack infer
  // the home directory instead, which balloons compile times.
  turbopack: {
    root: process.cwd(),
  },
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
  async redirects() {
    return ["", "/demo"].flatMap((prefix) => [
      { source: `${prefix}/achievements`, destination: `${prefix}/growth`, permanent: true },
      { source: `${prefix}/insights`, destination: `${prefix}/growth`, permanent: true },
      { source: `${prefix}/insights/more`, destination: `${prefix}/growth#stats`, permanent: true },
      {
        source: `${prefix}/insights/folios`,
        has: [{ type: "query" as const, key: "view", value: "past" }],
        destination: `${prefix}/goals#past-goals`,
        permanent: true,
      },
      { source: `${prefix}/insights/folios`, destination: `${prefix}/goals`, permanent: true },
      { source: `${prefix}/goals/library`, destination: `${prefix}/goals`, permanent: true },
    ]);
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
  // The after-compile hook still warns when authToken is missing, even with
  // release.create=false. Keep the hook off unless we can actually publish.
  ...(sentryAuthToken ? {} : { useRunAfterProductionCompileHook: false }),
});
