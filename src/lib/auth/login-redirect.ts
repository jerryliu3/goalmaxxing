const DEFAULT_POST_LOGIN_PATH = "/calendar";
const LOGIN_PATH = "/login";
const SENTINEL_BASE_URL = "http://resolution.local";

function isSafeRelativePath(path: string) {
  if (!path.startsWith("/") || path.startsWith("//")) {
    return false;
  }
  if (path.includes("\\")) {
    return false;
  }
  try {
    const resolved = new URL(path, SENTINEL_BASE_URL);
    return resolved.origin === SENTINEL_BASE_URL;
  } catch {
    return false;
  }
}

function normalizeSafePath(path: string) {
  const resolved = new URL(path, SENTINEL_BASE_URL);
  return `${resolved.pathname}${resolved.search}${resolved.hash}`;
}

function isLoginPath(path: string) {
  return path === LOGIN_PATH || path.startsWith(`${LOGIN_PATH}/`);
}

function isDemoPath(path: string) {
  return path === "/demo" || path.startsWith("/demo/");
}

export function resolveSafePostLoginPath(candidatePath?: string | null) {
  const normalized = candidatePath?.trim();
  if (!normalized || !isSafeRelativePath(normalized)) {
    return DEFAULT_POST_LOGIN_PATH;
  }
  const safePath = normalizeSafePath(normalized);
  const pathname = new URL(safePath, SENTINEL_BASE_URL).pathname;
  if (pathname === "/" || isLoginPath(pathname) || isDemoPath(pathname)) {
    return DEFAULT_POST_LOGIN_PATH;
  }
  return safePath;
}

export function buildLoginHref(nextPath?: string | null) {
  const safeNextPath = resolveSafePostLoginPath(nextPath);
  const query = new URLSearchParams({
    next: safeNextPath,
  });
  return `/login?${query.toString()}`;
}
