import * as Parse from 'parse/node'
import * as LRU from 'lru-cache'
import logger from '../logger'

const userForSessionToken = (sessionToken: string) => {
    const q = new Parse.Query('_Session')
    q.equalTo('sessionToken', sessionToken)
    return q.first({ useMasterKey: true })
        .then((session) => {
            if (!session) {
                return Parse.Promise.error('No session found for session token')
            }
            return session.get('user')
        })
}

export default class SessionTokenCache {
    private cache: LRU.Cache<string>

    constructor(timeout = 30 * 24 * 62 * 62 * 1000, maxSize = 10000) {
        this.cache = LRU({
            max: maxSize,
            maxAge: timeout
        })
    }

    getUserId(sessionToken: string): any {
        if (!sessionToken) {
            return Parse.Promise.error('Empty sessionToken!')
        }

        const userId = this.cache.get(sessionToken)
        if (userId) {
            logger.verbose('Fetch userId %s of sessionToken %s from Cache', userId, sessionToken)
            return Parse.Promise.as(userId)
        }
        return userForSessionToken(sessionToken)
            .then((user) => {
                logger.verbose('Fetch userId %s of sessionToken %s from Parse', user.id, sessionToken)
                this.cache.set(sessionToken, user.id)
                return Parse.Promise.as(user.id)
            }, (error) => {
                logger.error('Can not fetch userId for sessionToken %j, error %j', sessionToken, error)
                return Parse.Promise.error(error)
            })
    }
}