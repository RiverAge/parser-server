// Helper functions from accessing the instagram api.
import * as https from 'https'
import * as Parse from 'parse/node'
import * as authData from './authData'

// Return a promise that fulfills if this user id is valid.
const validateAuthData = (authData: authData.AuthData) => {
    return request('/users/self/?access_token=' + authData.access_token)
        .then((response) => {
            if (response && response.data && response.data.id === authData.id) {
                return
            }
            throw new Parse.Error(Parse.ErrorCode.OBJECT_NOT_FOUND, 'Instagram auth is invalid for this user.')
        })
}

// a promise wrapper for api request
const request = (path: string) => {
    return new Promise<authData.ResData>((resolve, reject) => {
        https.get('https://api.instagram.com/v1/' + path, (res) => {
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
            reject('Failed to validate this access token with Instagram.');
        })
    })
}