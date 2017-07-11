import * as redis from 'redis'
import logger from '../../logger'

const DEFAULT_REDIS_TTL = 30 * 1000 // 30 seconds in milliseconds

const debug = (...args: any[]) => {
    logger.debug.apply(logger, ['RedisCacheAdapter'], ...arguments)
}

export default class RedisCacheAdapter {

    client: redis.RedisClient
    p: Promise<any>
    ttl: number

    constructor(redisCtx: string, ttl = DEFAULT_REDIS_TTL) {
        this.client = redis.createClient(redisCtx)
        this.p = Promise.resolve()
        this.ttl = ttl
    }

    get(key: string) {
        debug('get', key)
        this.p = this.p.then(() => {
            return new Promise((resolve) => {
                this.client.get(key, (err, res) => {
                    debug('-> get', key, res)
                    if (!res) {
                        return resolve()
                    }
                    resolve(JSON.parse(res))
                })
            })
        })
        return this.p
    }

    put(key: string, value: any, ttl = this.ttl) {
        value = JSON.stringify(value)
        debug('put', key, value, ttl)
        if (ttl === 0) {
            return this.p
        }
        if (ttl < 0 || isNaN(ttl)) {
            ttl = DEFAULT_REDIS_TTL
        }
        this.p = this.p.then(() => {
            return new Promise((resolve) => {
                if (ttl === Infinity) {
                    this.client.set(key, value, () => resolve())
                } else {
                    this.client.psetex(key, ttl, value, () => resolve())
                }
            })
        })
        return this.p

    }

    del(key: string) {
        debug('del', key)
        this.p = this.p.then(() => {
            return new Promise((resolve) => {
                this.client.debug(key, () => resolve())
            })
        })
        return this.p
    }

    clear() {
        debug('clear')
        this.p = this.p.then(() => {
            return new Promise((resole) => {
                this.client.flushdb(() => resole())
            })
        })
        return this.p
    }
}