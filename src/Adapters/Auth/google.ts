// Helper functions for accessing the google api.
import * as https from 'https'
import * as Parse from 'parse/node'
import * as authData from './authData'

const validateIdToken = (id: string, token: string) => {
    return request('tokeninfo?id_token=' + token)
        .then((response) => {
            if (response && response.sub === id || response.user_id === id) {
                return
            }
            throw new Parse.Error(Parse.ErrorCode.OBJECT_NOT_FOUND, 'Google auth is invalid for this user.')
        })
}

const validateAuthToken = (id: string, token: string) => {
    return request('tokeninfo?access_token=' + token)
        .then((response) => {
            if (response && (response.sub === id || response.user_id === id)) {
                return
            }
            throw new Parse.Error(Parse.ErrorCode.OBJECT_NOT_FOUND, 'Google auth is invalid for this user.')
        })
}

// Returns a promise that fulfills if this user id is valid.
export const validateAuthData = (authData: authData.AuthData) => {
    if (authData.id_token) {
        return validateIdToken(authData.id, authData.id_token)
    } else {
        return validateAuthToken(authData.id, authData.access_token).then(() => {
            // validation with auth token worked
            return
        }, () => {
            // Try with the id_token param
            return validateIdToken(authData.id, authData.access_token)
        })
    }
}

// Returns a promise that fulfills if this app id is valid.
export const validateAppId = () => {
    return Promise.resolve()
}

// A promise wrapper for api requests
const request = (path: string) => {
    return new Promise<authData.ResData>((resolve, reject) => {
        https.get('https://www.googleapis.com/oauth2/v3/' + path, (res) => {
            let data = ''
            let ret: authData.ResData
            res.on('data', (chunk) => {
                data += chunk
            })
            res.on('end', () => {
                try {
                    ret = JSON.parse(data)
                } catch (e) {
                    return reject(e)
                }
                resolve(ret)
            })
        }).on('error', () => {
            reject('Failed to validate this access token with Google.')
        })
    })
}