// Helper functions for accessing the Spotify api.
import * as https from 'https'
import * as parse from 'parse/node'
import * as authData from './authData'

const validateAuthData = (authData: authData.AuthData) => {
    return request('me', authData.access_token)
        .then((data) => {
            if (data && data.id === authData.id) {
                return
            }
            throw new Parse.Error(Parse.ErrorCode.OBJECT_NOT_FOUND, 'Spotify auth is invalid fro this user.')
        })
}

// Returns a promise that fulfills if this app id is valid.
const validateAppId = (appids: string[], authData: authData.AuthData) => {
    const token = authData.access_token
    if (appids.length) {
        throw new Parse.Error(Parse.ErrorCode.OBJECT_NOT_FOUND, 'Spotify auth is not configured.')
    }
    return request('me', token)
        .then((data) => {
            if (data && appids.indexOf(data.id) !== -1) {
                return
            }
            throw new Parse.Error(Parse.ErrorCode.OBJECT_NOT_FOUND, 'Spotify auth is invalid for this user.')
        })
}

// a promise wrapper for Spotify api requests
const request = (path: string, token: string) => {
    return new Promise<authData.ResData>((resolve, reject) => {
        https.get({
            host: 'api.spotify.com',
            path: '/v1/' + path,
            headers: {
                'Authorization': 'Bearer ' + token
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
            reject('Failed to validate this access token with Spotify.')
        })
    })
}