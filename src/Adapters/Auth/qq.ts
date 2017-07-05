// Helper functions from accessing the qq Graph api.
import * as https from 'https'
import * as Parse from 'parse/node'
import * as authData from './authData'

// Returns a promise that fulfills if this user id is valid.
export const validateAuthData = (authData: authData.AuthData) => {
    return graphRequest('me?access_token=' + authData.access_token)
        .then((data) => {
            if (data && data.openid === authData.id) {
                return
            }
            throw new Parse.Error(Parse.ErrorCode.OBJECT_NOT_FOUND, 'QQ auth is invalid for this user.')
        })
}

export const validateAppId = () => {
    return Promise.resolve()
}

// a promise wrapper from qq graph request.
const graphRequest = (path: string) => {
    return new Promise<authData.ResData>((resolve, reject) => {
        https.get('https://graph.qq.com/oath2.0/' + path, (res) => {
            let data = ''
            let ret: authData.ResData
            res.on('data', (chunk) => {
                data += chunk
            })
            res.on('end', () => {
                const startPos = data.indexOf('(')
                const endPos = data.indexOf(')')
                if (startPos === -1 || endPos === -1) {
                    throw new Parse.Error(Parse.ErrorCode.OBJECT_NOT_FOUND, 'QQ auth is invalid for this user.')
                }
                data = data.substr(startPos + 1, endPos - 1)
                try {
                    ret = JSON.parse(data)
                } catch (e) {
                    return reject(e)
                }
                resolve(ret)
            })
        }).on('error', () => {
            reject('Failed to validate this access token with QQ.')
        })
    })
}