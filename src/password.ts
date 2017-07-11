// Tools for encrypting and decrypting passwords.
// Basically promise-friendly wrappers for bcrypt.

import * as bcrypt from 'bcryptjs'

// Returns a promise for a hashed password string.
export const hash = (password: string) => {
    return bcrypt.hash(password, 10)
}

// Returns a promise for whether this password compares to equal this
// hashed password.
export const compare = (password: string, hashedPassword: string): Promise<boolean> => {
    // can not bcrypt compare when one is undefined
    if (!password || !hashedPassword) {
        return Promise.resolve(false)
    }
    return bcrypt.compare(password, hashedPassword)
}