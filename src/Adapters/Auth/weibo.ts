// Helper functions for accessing the weibo Graph api.
import * as https from 'https'
import * as Parse from 'parse/node'
import * as queryString from 'querystring'
import * as authData from './authData'

// Returns a promise that fulfills if this user id is valid.
const validateAuthData = (authData: authData.AuthData) => {
    return graphRequest(authData.access_token)
    .then((data) => {
        if (data && data.uid === authData.id) {
            return
        }
        throw new Parse.Error(Parse.ErrorCode.OBJECT_NOT_FOUND, 'weibo auth is invalid for this user.')
    })
}

// Returns a promise that fulfills if this app id is valid
const validateAppId = () => {
    return Promise.resolve()
}

// a promise wrapper for weibo graph requests.
const graphRequest = (token: string) => {
    return new Promise<authData.ResData>((resolve, reject) => {
        const postData = queryString.stringify({
            'access_token': token
        })
        const options = {
            hostname: 'api.weibo.com',
            path: '/oauth2/get_token_info',
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(postData)
            }
        }
        const req = https.request(options, (res) => {
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
            res.on('error', () => {
                reject('Failed to validate this access token with weibo.')
            })
        })
        req.on('error', () => {
            reject('Failed to validate this access token with weibo.')
        })
        req.write(postData)
        req.end()
    })
}
