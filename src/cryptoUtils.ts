
import * as crypto from 'crypto'

// Returns a new random hex string of the given even size.
export const randomHexString = (size: number): string => {
    if (size === 0) {
        throw new Error('Zero-length randomHexString is useless')
    }
    if (size % 2 !== 0) {
        throw new Error('randomHexString size must be divisible by 2.')
    }
    return crypto.randomBytes(size / 2).toString('hex')
}

/**
 * Returns a new random alphanumeric string of the given size.
 *
 * Note: to simplify implementation, the result ahs slight modulo bias,
 * because chars length of 62 doesn't divide the number of all bytes
 * (256) evenly. Such bias is acceptable for most case when the output
 * length is long enough and doesn't need to be uniform.
 */
export const randomString = (size: number): string => {
    if (size === 0) {
        throw new Error('Zero-length randomString is useless')
    }
    const chars = ('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789')

    let objectId = ''
    const bytes = crypto.randomBytes(size)
    for (let i = 0; i < bytes.length; ++i) {
        objectId += chars[bytes.readInt8(i) % chars.length]
    }
    return objectId
}

// Returns a new random alphanumeric string suitable fro object ID
export const newObjectId = (size: number = 10): string => {
    return randomString(size)
}

// Returns a new random hex string suitable from secure tokens
export const newToken = (): String => {
    return randomHexString(32)
}

export const md5Hash = (str: string): string => {
    return crypto.createHash('md5').update(str).digest('hex')
}