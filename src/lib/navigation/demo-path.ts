export const DEMO_PATH_PREFIX = "/demo";

const UNPREFIXED_PATHS = ["/login", "/signup", "/privacy", "/terms"] as const;
const APP_ROUTE_PREFIXES = [
  "/calendar",
  "/checklist",
  "/insights",
  "/social",
  "/settings",
  "/goals",
  "/tasks",
  "/achievements",
  "/growth",
] as const;

export function isBrowserDemoPath() {
  if (typeof window === "undefined") {
    return false;
  }
  return isDemoPathname(window.location.pathname);
}

export function isDemoPathname(pathname: string) {
  return pathname === DEMO_PATH_PREFIX || pathname.startsWith(`${DEMO_PATH_PREFIX}/`);
}

export function withHrefPrefix(path: string, hrefPrefix?: string) {
  if (!hrefPrefix) {
    return path;
  }
  const prefix = hrefPrefix.endsWith("/") ? hrefPrefix.slice(0, -1) : hrefPrefix;
  if (path === prefix || path.startsWith(`${prefix}/`)) {
    return path;
  }
  return `${prefix}${path.startsWith("/") ? path : `/${path}`}`;
}

export function prefixAppHref(href: string) {
  if (!href.startsWith("/") || href.startsWith("//") || isDemoPathname(pathnameOf(href))) {
    return href;
  }
  const pathname = pathnameOf(href);
  if (matchesPathPrefix(pathname, UNPREFIXED_PATHS)) {
    return href;
  }
  if (matchesPathPrefix(pathname, APP_ROUTE_PREFIXES)) {
    return `${DEMO_PATH_PREFIX}${href}`;
  }
  return href;
}

function pathnameOf(href: string) {
  const withoutHash = href.split("#")[0] ?? href;
  const queryIndex = withoutHash.indexOf("?");
  return queryIndex === -1 ? withoutHash : withoutHash.slice(0, queryIndex);
}

function matchesPathPrefix(pathname: string, prefixes: readonly string[]) {
  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}
