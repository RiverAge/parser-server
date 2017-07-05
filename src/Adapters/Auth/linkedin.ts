// Helper functions for accessing the linkedin api.
import * as https from 'https'
import * as Parse from 'parse/node'
import * as authData from './authData'

// Returns a promise that fulfills if this user id is valid.
export const validateAuthData = (authData: authData.AuthData) => {
    return request('people/~:(id)', authData.access_token, authData.is_mobile_sdk)
        .then((data) => {
            if (data && data.id === authData.id) {
                return
            }
            throw new Parse.Error(Parse.ErrorCode.OBJECT_NOT_FOUND, 'Linkedin auth is invalid for this user.')
        })
}

// Returns a promise that fulfills if this app is valid
export const validateAppId = () => {
    return Promise.resolve()
}

// a promise wrapper for api requests
const request = (path: string, token: string, isMobileSDK: boolean) => {
    const headers = {
        'Authorization': 'Bearer ' + token,
        'x-li-format': 'json'
    } as {
            Authorization: string
            'x-li-format': string
            'x-li-src': string
        }

    if (isMobileSDK) {
        headers['x-li-src'] = 'msdk'
    }

    return new Promise<authData.ResData>((resolve, reject) => {
        https.get({
            host: 'api.linkedin.com',
            path: '/v1/' + path,
            headers: headers
        }, (res) => {
            let data = ''
            let ret: authData.ResData
            res.on('data', (chunk) => {
                data += chunk
            })
            res.on('end', () => {
                try {
                    ret = JSON.parse(data)
                } catch (e) {
                    reject(e)
                }
                resolve(ret)
            })
        }).on('error', () => {
            reject('Failed to validate this access token with Linkedin.')
        })
    })
}