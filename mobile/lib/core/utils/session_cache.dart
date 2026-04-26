class SessionCache {
  SessionCache._();

  static final Map<String, _CacheEntry<dynamic>> _cache = <String, _CacheEntry<dynamic>>{};

  static T? read<T>(String key, Duration ttl) {
    final entry = _cache[key];
    if (entry == null) return null;
    if (DateTime.now().difference(entry.timestamp) > ttl) {
      _cache.remove(key);
      return null;
    }
    return entry.payload as T;
  }

  static void write<T>(String key, T payload) {
    _cache[key] = _CacheEntry<T>(payload: payload, timestamp: DateTime.now());
  }

  static void remove(String key) => _cache.remove(key);

  static void clear() => _cache.clear();
}

class _CacheEntry<T> {
  const _CacheEntry({required this.payload, required this.timestamp});

  final T payload;
  final DateTime timestamp;
}
