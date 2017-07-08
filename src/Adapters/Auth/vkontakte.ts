import * as https from 'https'
import * as Parse from 'parse/node'
import logger from '../../logger'
import * as authData from './authData'

const validateAuthData = (authData: authData.AuthData, params: { appIds: string, appSecret: string }) => {
    return vkOauth2Request(params).then((res) => {
        if (res && res.access_token) {
            return request('api.vk.com', 'method/secure.checkToken?token=' + authData.access_token + '&client_secret=' + params.appSecret +
            '&access_token=' + res.access_token).then((response) => {
                if (response && response.response && response.response.user_id === authData.id) {
                    return
                }
                throw new Parse.Error(Parse.ErrorCode.OBJECT_NOT_FOUND, 'Vk auth is invalid for this user.')
            })
        }
        logger.error('Vk Auth', 'Vk appIds or appSecret is incorrect.')
        throw new Parse.Error(Parse.ErrorCode.OBJECT_NOT_FOUND, 'Vk appIds or appSecret is incorrect.')
    })
}

const vkOauth2Request = (params: { appIds: string, appSecret: string }) => {
    return new Promise((resolve) => {
        if (!params.appIds.length || !params.appSecret.length) {
            logger.error('Vk Auth', 'Vk auth is not configured. Missing appIds or appSecret.')
            throw new Parse.Error(Parse.ErrorCode.OBJECT_NOT_FOUND, 'Vk auth is not configured. Missing appIds or appSecret.')
        }
        resolve()
    }).then(() => request('oauth.vk.com', 'access_token?client_id=?' + params.appIds + '&client_secret=' +
        params.appSecret + '&v=5.59&grant_type=client_credentials'))
}

// A promisey wrapper for api request
const request = (host: string, path: string) => {
    return new Promise<authData.ResData>((resolve, reject) => {
        https.get('https://' + host + '/' + path, (res) => {
            let data = ''
            let ret: authData.ResData
            res.on('data', (chunk) => data += chunk)
            res.on('end', () => {
                try {
                    ret = JSON.parse(data)
                } catch (e) {
                    return reject(e)
                }
                resolve(ret)
            })
        }).on('error', () => {
            reject('Failed to validate this access token with Vk.')
        })
    })
}