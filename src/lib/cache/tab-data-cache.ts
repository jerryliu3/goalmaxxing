const TAB_DATA_CACHE_STORAGE_PREFIX = "tab-data-cache:v1";
const DEFAULT_TAB_DATA_CACHE_SCOPE = "anonymous";
export const TAB_DATA_CACHE_TTL_MS = 5 * 60 * 1000;

interface TabDataCacheRecord<TValue> {
  freshUntil: number;
  value: TValue;
}

interface PersistedTabDataCacheRecord<TValue> extends TabDataCacheRecord<TValue> {
  expiresAt?: number;
}

const tabDataCache = new Map<string, TabDataCacheRecord<unknown>>();
const pendingLoads = new Map<string, Promise<unknown>>();
let tabDataCacheScope = DEFAULT_TAB_DATA_CACHE_SCOPE;

function isBrowser() {
  return typeof window !== "undefined";
}

function sessionStorageGet(key: string) {
  if (!isBrowser()) {
    return null;
  }
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function sessionStorageSet(key: string, value: string) {
  if (!isBrowser()) {
    return;
  }
  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    // Ignore quota/private-mode failures and continue with memory cache.
  }
}

function sessionStorageRemove(key: string) {
  if (!isBrowser()) {
    return;
  }
  try {
    window.sessionStorage.removeItem(key);
  } catch {
    // Ignore storage failures.
  }
}

function sessionStorageKeys() {
  if (!isBrowser()) {
    return [] as string[];
  }
  try {
    return Array.from(
      { length: window.sessionStorage.length },
      (_, index) => window.sessionStorage.key(index) ?? ""
    ).filter((key) => key.length > 0);
  } catch {
    return [];
  }
}

function buildStorageKey(cacheKey: string) {
  return `${TAB_DATA_CACHE_STORAGE_PREFIX}:${tabDataCacheScope}:${cacheKey}`;
}

function normalizeTabDataCacheScope(scope: string | null | undefined) {
  const normalized = scope?.trim();
  return normalized && normalized.length > 0
    ? normalized
    : DEFAULT_TAB_DATA_CACHE_SCOPE;
}

function normalizeRecord<TValue>(
  parsed: PersistedTabDataCacheRecord<TValue> | null
): TabDataCacheRecord<TValue> | null {
  if (!parsed || parsed.value === undefined) {
    return null;
  }
  const freshUntil =
    typeof parsed.freshUntil === "number"
      ? parsed.freshUntil
      : typeof parsed.expiresAt === "number"
        ? parsed.expiresAt
        : 0;
  return { freshUntil, value: parsed.value };
}

function readPersistentRecord<TValue>(cacheKey: string) {
  try {
    const raw = sessionStorageGet(buildStorageKey(cacheKey));
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as PersistedTabDataCacheRecord<TValue> | null;
    return normalizeRecord(parsed);
  } catch {
    return null;
  }
}

function writePersistentRecord<TValue>(
  cacheKey: string,
  record: TabDataCacheRecord<TValue>
) {
  sessionStorageSet(buildStorageKey(cacheKey), JSON.stringify(record));
}

function removePersistentRecord(cacheKey: string) {
  sessionStorageRemove(buildStorageKey(cacheKey));
}

function purgePersistentStorageForOtherScopes(activeScope: string) {
  const storagePrefix = `${TAB_DATA_CACHE_STORAGE_PREFIX}:`;
  const activeScopePrefix = `${storagePrefix}${activeScope}:`;
  for (const storageKey of sessionStorageKeys()) {
    if (!storageKey.startsWith(storagePrefix)) {
      continue;
    }
    if (!storageKey.startsWith(activeScopePrefix)) {
      sessionStorageRemove(storageKey);
    }
  }
}

function readRecord<TValue>(cacheKey: string) {
  const inMemory = tabDataCache.get(cacheKey) as TabDataCacheRecord<TValue> | undefined;
  if (inMemory) {
    return inMemory;
  }

  const fromStorage = readPersistentRecord<TValue>(cacheKey);
  if (!fromStorage) {
    return null;
  }

  tabDataCache.set(cacheKey, fromStorage);
  return fromStorage;
}

export function readTabDataCache<TValue>(cacheKey: string) {
  return readRecord<TValue>(cacheKey)?.value ?? null;
}

export function isTabDataCacheFresh(cacheKey: string) {
  const record = readRecord(cacheKey);
  return Boolean(record && record.freshUntil > Date.now());
}

export function writeTabDataCache<TValue>(
  cacheKey: string,
  value: TValue,
  ttlMs = TAB_DATA_CACHE_TTL_MS
) {
  pendingLoads.delete(cacheKey);
  const record: TabDataCacheRecord<TValue> = {
    freshUntil: Date.now() + ttlMs,
    value,
  };
  tabDataCache.set(cacheKey, record);
  writePersistentRecord(cacheKey, record);
}

/** Share a background warmup with foreground readers of the same scoped data. */
export function loadTabDataCache<TValue>(
  cacheKey: string,
  load: () => Promise<TValue>,
  { forceRefresh = false, ttlMs = TAB_DATA_CACHE_TTL_MS } = {}
): Promise<TValue> {
  const cached = readTabDataCache<TValue>(cacheKey);
  if (!forceRefresh && cached && isTabDataCacheFresh(cacheKey)) {
    return Promise.resolve(cached);
  }
  const pending = pendingLoads.get(cacheKey);
  if (!forceRefresh && pending) return pending as Promise<TValue>;

  const request: Promise<TValue> = Promise.resolve().then(load).then(value => {
    // Invalidation/user switching detaches old requests, so they cannot refill
    // the cache with a pre-mutation snapshot or another user's data.
    if (pendingLoads.get(cacheKey) === request) writeTabDataCache(cacheKey, value, ttlMs);
    return value;
  }).finally(() => {
    if (pendingLoads.get(cacheKey) === request) pendingLoads.delete(cacheKey);
  });
  pendingLoads.set(cacheKey, request);
  return request;
}

/** Keep one active date-window snapshot; remove old memory, storage and pending fills. */
export function retainTabDataCacheKeyByPrefix(prefix: string, keepKey: string) {
  const keys = new Set([...tabDataCache.keys(), ...pendingLoads.keys()]);
  const storagePrefix = buildStorageKey(prefix);
  const scopePrefix = `${TAB_DATA_CACHE_STORAGE_PREFIX}:${tabDataCacheScope}:`;
  for (const storageKey of sessionStorageKeys()) {
    if (storageKey.startsWith(storagePrefix)) keys.add(storageKey.slice(scopePrefix.length));
  }
  for (const key of keys) {
    if (key.startsWith(prefix) && key !== keepKey) invalidateTabDataCache(key);
  }
}

export function invalidateTabDataCache(cacheKey: string) {
  pendingLoads.delete(cacheKey);
  tabDataCache.delete(cacheKey);
  removePersistentRecord(cacheKey);
}

function markRecordStale(cacheKey: string) {
  const record = readRecord(cacheKey);
  if (!record) {
    return;
  }
  const staleRecord = { ...record, freshUntil: 0 };
  tabDataCache.set(cacheKey, staleRecord);
  writePersistentRecord(cacheKey, staleRecord);
}

export function markTabDataCacheStaleByPrefix(prefix: string) {
  for (const key of pendingLoads.keys()) {
    if (key.startsWith(prefix)) pendingLoads.delete(key);
  }
  const matchingKeys = new Set<string>();
  for (const key of tabDataCache.keys()) {
    if (key.startsWith(prefix)) {
      matchingKeys.add(key);
    }
  }
  const storagePrefix = buildStorageKey(prefix);
  for (const storageKey of sessionStorageKeys()) {
    if (!storageKey.startsWith(storagePrefix)) {
      continue;
    }
    const cacheKey = storageKey.slice(
      `${TAB_DATA_CACHE_STORAGE_PREFIX}:${tabDataCacheScope}:`.length
    );
    if (cacheKey.startsWith(prefix)) {
      matchingKeys.add(cacheKey);
    }
  }
  for (const cacheKey of matchingKeys) {
    markRecordStale(cacheKey);
  }
}

export function invalidateTabDataCacheByPrefix(prefix: string) {
  for (const key of pendingLoads.keys()) {
    if (key.startsWith(prefix)) pendingLoads.delete(key);
  }
  for (const key of tabDataCache.keys()) {
    if (key.startsWith(prefix)) invalidateTabDataCache(key);
  }
  const storagePrefix = buildStorageKey(prefix);
  for (const storageKey of sessionStorageKeys()) {
    if (storageKey.startsWith(storagePrefix)) sessionStorageRemove(storageKey);
  }
}

export function setTabDataCacheScope(scope: string | null | undefined) {
  if (!isBrowser()) {
    return;
  }
  const nextScope = normalizeTabDataCacheScope(scope);
  if (tabDataCacheScope === nextScope) {
    return;
  }
  tabDataCacheScope = nextScope;
  tabDataCache.clear();
  pendingLoads.clear();
  purgePersistentStorageForOtherScopes(nextScope);
}

export function resetTabDataCacheForTests() {
  tabDataCache.clear();
  pendingLoads.clear();
  tabDataCacheScope = DEFAULT_TAB_DATA_CACHE_SCOPE;
  for (const storageKey of sessionStorageKeys()) {
    if (storageKey.startsWith(`${TAB_DATA_CACHE_STORAGE_PREFIX}:`)) {
      sessionStorageRemove(storageKey);
    }
  }
}
