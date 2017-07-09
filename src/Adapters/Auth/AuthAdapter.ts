import * as authData from './authData'
class AuthAdapter {

    /**
     * @param appIds appIds: the specified app ids in the configuration
     * @param authData the client provided authData
     * @returns a promise that resolves if the applicationId is valid
     */
    validateAppId(appIds: string[], authData: authData.AuthData): Promise<any> {
        return Promise.resolve({})
    }

    /**
     * @param authData: the client provided authData
     * @param options: additional options
     */
    validateAuthData(authData: authData.AuthData, options: {}): Promise<any> {
        return Promise.resolve({})
    }
}

export default AuthAdapter