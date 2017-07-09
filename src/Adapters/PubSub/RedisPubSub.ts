import * as redis from 'redis'

export const createPublisher = (redisURL: string) => {
    return redis.createClient(redisURL, { no_ready_check: true })
}

export const createSubscribe = (redisURL: string) => {
    return redis.createClient(redisURL, { no_ready_check: true })
}
