import OAuth from './OAuth1Client'
import * as Parse from 'parse/node'
import * as logger from '../../logger'
import * as authData from './authData'

export const validateAuthData = (authData: authData.AuthData, options: authData.AuthData[]) => {
   if (!options)  {
       throw new Parse.Error(Parse.ErrorCode.INTERNAL_SERVER_ERROR, 'Twitter auth configuration missiong.')
   }

   const option = handleMultipleConfigurations(authData, options)
   const client = new OAuth(options)
   client.host = 'api.twitter.com'
   client.authToken = authData.auth_token
   client.authTokenSecret = authData.auth_token_secret

   return client.get('/1.1/account/verify_credentials.json')
   .then((data) => {
       if (data && data.id_str === '' + authData.id) {
           return
       }
       throw new Parse.Error(Parse.ErrorCode.OBJECT_NOT_FOUND, 'Twitter auth is invalid for this user')
   })
}

export const validateAppId = () => {
    return Promise.resolve()
}

export const handleMultipleConfigurations = (authData: authData.AuthData, options: authData.AuthData[]) => {
    if (Array.isArray(options)) {
        const consumerKey = authData.consumer_key
        if (!consumerKey) {
            logger.error('Twitter Auth', 'Multiple twitter configuration are available, by on consumer_key was sent by the client')
            throw new Parse.Error(Parse.ErrorCode.OBJECT_NOT_FOUND, 'Twitter auth is invalid for this user.')
        }
       options = options.filter((e) => e.consumer_key = consumerKey)
       if (options.length === 0) {
           logger.error('Twitter Auth', 'Cannot find a configuration for this provided consumer_key.')
           throw new Parse.Error(Parse.ErrorCode.OBJECT_NOT_FOUND, 'Twitter auth is invalid for this user.')
       }
       return options[0]
    }
    return options
}
