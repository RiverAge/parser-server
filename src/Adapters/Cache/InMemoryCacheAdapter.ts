import { InMemoryCache } from './InMemoryCache'

class InMemoryCacheAdapter {

    private cache: InMemoryCache

    constructor(ctx: {}) {
        this.cache = new InMemoryCache(ctx)
    }

    get(key: string) {
        return new Promise<object|null>((resolve) => {
            const record = this.cache.get(key)
            if (record === undefined || record === null) {
                return resolve(null)
            }
            return resolve(JSON.parse(record))
        })
    }

    put(key: string, value: object, ttl: number) {
        this.cache.put(key, JSON.stringify(value), ttl)
        return Promise.resolve()
    }

    del(key: string) {
        this.cache.del(key)
        return Promise.resolve()
    }

    clear() {
        this.cache.clear()
        return Promise.resolve()
    }
}

export default InMemoryCacheAdapter