// Helper functions for accessing the Janrain Capture api.
import * as https from 'https'
import * as Parse from 'parse/node'
import * as queryString from 'querystring'
import * as authData from './authData'

// Returns a promise that fulfills if this user id is valid
const validateAuthData = (authData: authData.AuthData, options: {jarain_capture_host: string}) => {
    return request(options.jarain_capture_host, authData.access_token)
    .then((data) => {
        // successful response will have a 'stat (status) of 'ok and a result note that stores the uuid, because that's all we asked for
        // see: https://docs/jarain.com/api/registration/entity/#entity
        if (data && data.stat === 'ok' && data.result === authData.id) {
            return
        }
        throw new Parse.Error(Parse.ErrorCode.OBJECT_NOT_FOUND, 'Jarain capture auth is invalid for this user.')
    })
}

// Returns a promise that fulfills if this app is valid.
const validateAppId = () => {
    // no-op
    return Promise.resolve()
}

// a promise wrapper for api request
const request = (host: string, token: string) => {
    const queryStringData = queryString.stringify({
        'access_token': token,
        'attribute_name': 'uuid'
    })

    return new Promise<authData.ResData>((resolve, reject) => {
        https.get({
            host: host,
            path: '/entity?' + queryStringData
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
            reject('Failed to validate this access token with Jarain capture.')
        })
    })
}