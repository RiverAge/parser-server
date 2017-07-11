/**
 * A Config object provides information about how a specific app is
 * configured.
 * mount is the URL for the root of the API; includes http, domain, etc.
 */

import appCache from './cache'



interface Application {
    jsonLogs: string,
    masterKey: string,
    clientKey: string,
    javascriptKey: string,
    dotNetKey: string,
    restAPIKey: string,
    webhookKey: string,
    fileKey: string,
    allowClientClassCreation: boolean,
    userSensitiveFields: string[]
}

const removeTrailingSlash = (str: string) => {
    if (!str) {
        return
    }
    if (str.endsWith('/')) {
        str = str.slice(0, -1)
    }
    return str
}

class Config {

    private applicationId: string
    private jsonLogs: string
    private masterKey: string
    private clientKey: string
    private javascriptKey: string
    private dotNetKey: string
    private restAPIKey: string
    private webhookKey: string
    private fileKey: string
    private allowClientCssCreation: boolean
    private userSensitiveFields: string[]

    constructor(appId: string, mount: string) {
        const cacheInfo = <Application>appCache.get(appId)
        if (!cacheInfo) {
            return
        }

        this.applicationId = appId
        this.jsonLogs = cacheInfo.jsonLogs
        this.masterKey = cacheInfo.masterKey
        this.clientKey = cacheInfo.clientKey
        this.javascriptKey = cacheInfo.javascriptKey
        this.dotNetKey = cacheInfo.dotNetKey
        this.restAPIKey = cacheInfo.restAPIKey
        this.webhookKey = cacheInfo.webhookKey
        this.fileKey = cacheInfo.fileKey
        this.allowClientCssCreation = cacheInfo.allowClientClassCreation
        this.userSensitiveFields = cacheInfo.userSensitiveFields
    }
}