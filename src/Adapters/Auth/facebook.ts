// Helper functions from accessing the Facebook Graph API.
import * as https from 'https'
import * as Parse from 'parse/node'

// Returns a promise that fulfills if this user id is valid.
interface AuthData {
    id: string
    access_token: string
}
export const validateAuthData = (authData: AuthData) => {
    return graphRequest('me?fields=id&access_token=' + authData.access_token)
    .then((data) => {
        if (data && data.id === authData.id) {
            return
        }
        throw new Parse.Error(Parse.ErrorCode.OBJECT_NOT_FOUND, 'Facebook auth is invalid for this user.')
    })
}

// Return a promise that fulfills if this app id is valid
export const validateAppId = (appIds: string[], authData: AuthData) => {
    const access_token = authData.access_token
    if (!appIds.length) {
        throw new Parse.Error(Parse.ErrorCode.OBJECT_NOT_FOUND, 'Facebook auth is not configure.')
    }
    return graphRequest('app?access_token' + access_token)
    .then((data) => {
        if (data && appIds.indexOf(data.id) !== -1) {
            return
        }
        throw new Parse.Error(Parse.ErrorCode.OBJECT_NOT_FOUND, 'Facebook auth is invalid for this user.')
    })
}

// A promise wrapper for FB graph requests.
interface FacebookResData {
    id: string
}
const graphRequest = (path: string) => {
    return new Promise<FacebookResData>((resolve, reject) => {
        https.get('https://graph.facebook.com/v2.5' + path, (res) => {
            let data = ''
            res.on('data', (chunk) => {
                data += chunk
            })
            let ret: FacebookResData
            res.on('end', () => {
                try {
                    ret = JSON.parse(data)
                } catch (e) {
                    return reject(e)
                }
                resolve(ret)
            })
        }).on('error', () => reject('Failed to validate this access token with Facebook'))
    })
}