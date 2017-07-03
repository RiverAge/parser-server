const MAIN_SCHEMA = '__MAIN_SCHEMA'
const SCHEMA_CACHE_PREFIX = '__SCHEMA'
const ALL_KEYS = '__ALL_KEYS'

import { randomString } from '../cryptoUtils'
import defaults from '../defaults'

import CacheController from './CacheController'

export default class SchemaCache {

    cache: CacheController
    ttl: string | number
    prefix: string

    constructor(cacheController: CacheController, ttl = defaults.schemaCacheTTL, singleCache = false) {
        this.ttl = typeof ttl === 'string' ? parseInt(ttl, 10) : ttl
        this.cache = cacheController
        this.prefix = SCHEMA_CACHE_PREFIX
        if (!singleCache) {
            this.prefix += randomString(20)
        }
    }

    put(key: string, vale: any) {
        return this.cache.get(this.prefix + ALL_KEYS).then((allKeys) => {

        })
    }

    getAllClasses() {
        if (!this.ttl) {
            return Promise.resolve(null)
        }
        return this.cache.get(this.prefix + MAIN_SCHEMA)
    }

    setAllClasses(schema) {
        if (!this.ttl) {
            return Promise.resolve(null)
        }
        return this.put(this.prefix + MAIN_SCHEMA, schema)
    }

    setOnSchema(className: string, schema) {
        if (!this.ttl) {
            return Promise.resolve(null)
        }
        return this.put(this.prefix + className, schema)
    }

    getOneSchema(className: string) {
        if (!this.ttl) {
            return Promise.resolve(null)
        }
        return this.cache.get(this.prefix + className).then((schema) => {
            if (schema) {
                return Promise.resolve(schema)
            }
            return this.cache.get(this.prefix + MAIN_SCHEMA).then((cachedSchemas) => {
                cachedSchemas = cachedSchemas || []
                schema = cachedSchemas.find((cachedSchema) => {
                    return cachedSchema.className === className
                })
                if (schema) {
                    return Promise.resolve(schema)
                }
                return Promise.resolve(null)
            })
        })
    }

    clear() {
        return this.cache.get(this.prefix + ALL_KEYS).then((allKeys) => {
            if (!allKeys) {
                return
            }

            const promises = Object.keys(allKeys).map((key) => {
                return this.cache.del(key)
            })
            return Promise.all(promises)
        })
    }

}