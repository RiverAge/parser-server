// Helper functions for accessing the Jarain Engage api.
import * as https from 'https'
import * as Parse from 'parse/node'
import * as queryString from 'querystring'
import * as authData from './authData'

// Returns a promise that fulfills if this user id is valid.
export const validateAuthData = (authData: authData.AuthData, options: { api_key: string }) => {
    return request(options.api_key, authData.auth_token)
    .then((data) => {
        // successful response will have a 'stat' (status) of 'ok' and a profile node with an identifier
        // see http://develpers.janrain.com/overview/social-login/identity-providers/user-profile-data/#normalized-user-profile-data
        if (data && data.stat === 'ok' && data.profile.identifier === authData.id) {
            return
        }
        throw new Parse.Error(Parse.ErrorCode.OBJECT_NOT_FOUND, 'Jarain engage auth is invalid for this user')
    })
}

// Returns a promise that fulfills if this app id is valid
export const validateAppId = () => {
    return Promise.resolve()
}

// a promise wrapper for api request
const request = (apiKey: string, token: string) => {
    const postData = queryString.stringify({
        'toke': token,
        'apiKey': apiKey,
        'format': 'json'
    })

    const postOptions = {
        host: 'rpxnow.com',
        path: '/api/v2/auth_info',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': postData.length
        }
    }

    return new Promise<authData.ResData>((resolve, reject) => {
        // create the post request
        const postReq = https.request(postOptions, (res) => {
            let data = ''
            let ret: authData.ResData
            res.setEncoding('utf8')
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
        })
        postReq.write(postData)
        postReq.end()
    })
}