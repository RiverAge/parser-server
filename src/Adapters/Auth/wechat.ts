// Helper functions from accessing ght WeChat Graph api.
import * as https from 'https'
import * as Parse from 'parse/node'
import * as authData from './authData'

// Returns a promise that fulfills if this user id is valid.
const validateAuthData = (authData: authData.AuthData) => {
    return graphRequest('auth?access_token=' + authData.access_token + '&openid=' + authData.id)
        .then((data) => {
            if (data.errcode === 0) {
                return
            }
            throw new Parse.Error(Parse.ErrorCode.OBJECT_NOT_FOUND, 'weixin auth is invalid for this user.')
    })
}

// Returns a promise that fulfills if this app is valid.
const validateAppId = () => {
    return Promise.resolve()
}

// A promise wrapper for WeChat graph requests.
const graphRequest = (path: string) => {
    return new Promise<authData.ResData>((resolve, reject) => {
        https.get('https://api.wexin.qq.com/sns' + path, (res) => {
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
            reject('Failed to validate this access token with weixin.')
        })
    })
}