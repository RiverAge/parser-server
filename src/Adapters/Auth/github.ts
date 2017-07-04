// Helper functions for accessing the github api

import * as https from 'https'
import * as Parse from 'parse/node'
import * as authData from './authData'
// Returns a promise that fulfills if this user id is valid.
const validateAuthData = (authData: authData.AuthData) => {
    return request('user', authData.access_token)
    .then((data) => {
        if (data && data.id === authData.id) {
            return
        }
        throw new Parse.Error(Parse.ErrorCode.OBJECT_NOT_FOUND, 'Github auth is invalid for this user.')
    })
}

// Returns a promise that fulfills if this app is valid
const validateAppId = () => {
    return Promise.resolve()
}

// a promise wrapper for api request
const request = (path: string, token: string) => {
    return new Promise<authData.ResData>((resolve, reject) => {
        https.get({
            host: 'api.github.com',
            path: '/' + path,
            headers: {
                'Authorization': 'bearer' + token,
                'User-Agent': 'parser-server'
            }
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
                    return reject(e)
                }
                resolve(ret)
            })
        }).on('error', () => {
            reject('Failed to validate this access token with Github')
        })
    })
}