export const readCache = (key, ttlMs) => {
  try {
    const cached = sessionStorage.getItem(key);
    if (!cached) {
      return null;
    }

    const parsed = JSON.parse(cached);
    if (!parsed || typeof parsed.ts !== 'number' || !Object.prototype.hasOwnProperty.call(parsed, 'data')) {
      return null;
    }

    if (Date.now() - parsed.ts > ttlMs) {
      sessionStorage.removeItem(key);
      return null;
    }

    return parsed.data;
  } catch {
    return null;
  }
};

export const writeCache = (key, payload) => {
  try {
    sessionStorage.setItem(key, JSON.stringify({
      data: payload,
      ts: Date.now(),
    }));
  } catch {
    // Ignore storage errors.
  }
};