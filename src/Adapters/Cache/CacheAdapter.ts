interface CacheAdapter {

    /**
     * Get a value in the cache
     * @param key Cache key to get
     * @return Promise that will eventually resolve to the value in the cache.
     */
    get(key: string): Promise<any>

    /**
     * Set a value in the cache
     * @param key Cache key to set
     * @param value Value to set the key
     * @param ttl Optional TTL
     */
    put(key: string, value: any, ttl?: number): Promise<any>

    /**
     * Remove a value from the cache.
     * @param key Cache key to remove
     */
    del(key: string): void

    /**
     * Empty a cache
     */
    clear(): void
}