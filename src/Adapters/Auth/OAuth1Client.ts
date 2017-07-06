import * as https from 'https'
import * as crypto from 'crypto'
import * as Parse from 'parse/node'

interface OAuthParams {
    oauth_nonce?: string
    oauth_timestamp?: number
    oauth_signature_method?: string
    oauth_version?: string,
    oauth_signature: string
}

class OAuth {

    private consumerKey: string
    private consumerSecret: string
    private authToken: string
    private authTokenSecret: string
    private host: string
    private oauthParams: object

    private readonly signatureMethod = 'HMAC-SHA1'
    private readonly version = '1.0'

    constructor(options: {
        consumer_key: string,
        consumer_secret: string,
        auth_token: string,
        auth_token_secret: string
        host: string,
        oauth_params?: string
    }) {
        this.consumerKey = options.consumer_key
        this.consumerSecret = options.consumer_secret
        this.authToken = options.auth_token
        this.authTokenSecret = options.auth_token_secret
        this.host = options.host
        this.oauthParams = options.oauth_params || {}
    }

    send(method: string, path: string, params: {}, body?: string) {
        const request = this.buildRequest(method, path, params, body)
        // Encode the body properly, the current Parse Implementation don't do it properly
        return new Promise((resolve, reject) => {
            const httpRequest = https.get(request, (res) => {
                let data = ''
                res.on('data', (chunk) => {
                    data += chunk
                })
                res.on('end', () => {
                    data = JSON.parse(data)
                })
            }).on('error', () => {
                reject('Failed to make an OAuth request')
            })
            if (request.body) {
                httpRequest.write(request.body)
            }
            httpRequest.end()
        })
    }

    get(path: string, params: {}) {
        return this.send('GET', path, params)
    }

    post(path: string, params: {}, body) {
        return this.send('POST', path, params, body)
    }

    buildRequest(method: 'POST' | 'GET', path: string, params: Map<string, string>, body: string) {
        if (path.indexOf('/') !== 0) {
            path = '/' + path
        }
        if (params && Object.keys(params).length > 0) {
            path += '?' + this.buildParameterString(params)
        }

        const request: https.RequestOptions = {
            host: this.host,
            path: path,
            method: method
        }


        const oauthParams = this.oauthParams
        oauthParams.oauth_consumer_key = this.consumerKey
        if (this.authToken) {
            oauthParams['oauth_token'] = this.authToken
        }

        request = this.signRequest(request, oauthParams, this.consumerKey, this.authToken)

        if (body && Object.keys(body).length > 0) {
            request.body = this.buildParameterString(body)
        }
        return request
    }



    private signRequest(request: https.RequestOptions,
        {
         oauth_nonce = this.nonce(),
            oauth_timestamp = Math.floor(new Date().getTime() / 1000),
            oauth_signature_method = this.signatureMethod,
            oauth_version = this.version
     }: OAuthParams,
        consumerSecret: string,
        authTokenSecret = '') {

        // Force Get Method if unset
        if (!request.method) {
            request.method = 'GET'
        }

        // Collect all the parameters in on signature Parameters object
        const signatureParam = {
            ...request.params,
            ...request.body,
            ...oauthParameters
        }

        // Create a string based on the parameters
        const parameterString = this.buildParameterString(signatureParam)

        // Build the signature string
        const url = 'https://' + request.host + '' + request.path

        const signatureString = this.buildSignatureString(request.method, url, parameterString)
        // Has the signature string
        const signatureKey = [this.encode(consumerSecret), this.encode(authTokenSecret)].join('&')

        const signature = this.signature(signatureString, signatureKey)

        // Set the signature in the params
        oauthParameters.oauth_signature = signature

        if (!request.headers) {
            request.headers = {}
        }

        // Set the authorization header
        const authHeader = Object.keys(oauthParameters).sort().map((e) => {
            const value = oauthParameters[key]
            return key + '="' + value + '"'
        }).join(', ')

        request.headers.Authorization = 'OAuth ' + authHeader

        // Set the content type header
        request.headers['Content-Type'] = 'application/x-www-form-urlencoded'
        return request
    }

    private buildParameterString(obj: Map<string, string>) {
        // Sort key and encode values
        const keys = Object.keys(obj).sort()
        return keys.map((key) => {
            return key + '=' + this.encode(obj[key])
        }).join('&')
    }

    private encode(str: string) {
        str = (str + '').toString()
        return encodeURIComponent(str).replace(/!/g, '%21').replace(/'/g, '%27').replace(/\(/g, '%28').replace(/\)/g, '%29').replace(/\*/g, '%2A')
    }

    private nonce() {
        let text = ''
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

        for (let i = 0; i < 30; i++) {
            text += possible[Math.floor(Math.random() * possible.length)]
        }
        return text
    }

    private buildSignatureString(method: 'POST' | 'GET', url: string, parameters: string) {
        return [method, this.encode(url), this.encode(parameters)].join('&')
    }

    private signature(text: string, key: string) {
        return this.encode(crypto.createHmac('sha1', key).update(text).digest('base64'))
    }

}