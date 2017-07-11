const DEFAULT_CACHE_TTL = 5 * 1000

interface Record {
    value: any,
    expire: number,
    timeout?: NodeJS.Timer
}
export class InMemoryCache {

    private ttl: number
    private cache: {
        [propName: string]: any
    }

    constructor({ ttl = DEFAULT_CACHE_TTL }) {
        this.ttl = ttl
        this.cache = Object.create(null)
    }

    get(key: string): any {
        const record: Record = this.cache[key]
        if (record === null || record === undefined) {
            return null
        }

        // Has Record adn is not expired
        if (isNaN(record.expire) || record.expire >= Date.now()) {
            return record.value
        }

        // Record has expired

        delete this.cache[key]
        return null
    }

    put(key: string, value: string, ttl = this.ttl) {
        if (ttl < 0 || isNaN(ttl)) {
            ttl = NaN
        }

        const record: Record = {
            value: value,
            expire: ttl + Date.now()
        }

        if (!isNaN(record.expire)) {
            record.timeout = setTimeout(() => {
                this.del(key)
            }, ttl)
        }

        this.cache[key] = record
    }

    del(key: string) {
        const record: Record = this.cache[key]
        if (record === null || record === undefined) {
            return
        }

        if (record.timeout) {
            clearTimeout(record.timeout)
        }

        delete this.cache[key]
    }

    clear() {
        this.cache = Object.create(null)
    }

}

export default InMemoryCache
