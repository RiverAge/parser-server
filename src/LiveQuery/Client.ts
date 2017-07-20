import logger from '../logger'

import {FlattenedObjectData} from './Subscription'
export interface Message {
    op: string
    clientId: number
    requestId?: number
    object?: FlattenedObjectData
}

const defaultFields = ['className', 'objectId', 'updateAt', 'createAt', 'ACL']

class Client {
    private id: number
    private parseWeSocket: any
    private userId: string
    private roles: Array<string>
    private subscriptionInfos: Map<number, any>
    private pushConnect: (subscriptionId: number, parseObjectJSON: any) => void
    private pushSubscribe: (subscriptionId: number, parseObjectJSON: any) => void
    private pushUnSubscribe: (subscriptionId: number, parseObjectJSON: any) => void
    private pushCreate: (subscriptionId: number, parseObjectJSON: any) => void
    private pushEnter: (subscriptionId: number, parseObjectJSON: any) => void
    private pushUpdate: (subscriptionId: number, parseObjectJSON: any) => void
    private pushDelete: (subscriptionId: number, parseObjectJSON: any) => void
    private pushLeave: (subscriptionId: number, parseObjectJSON: any) => void

    static pushResponse(parseWebSocket: string, message: Message) {
        logger.verbose('Push Response: %j', message)
        parseWebSocket.send(message)
    }

    static pushError(parseWebSocket: string, code: number, error: string, reconnect = true) {
        Client.pushResponse(parseWebSocket, JSON.stringify({
            op: 'error',
            error,
            code,
            reconnect
        }))
    }

    constructor(id: number, parseWebSocket: any) {
        this.id = id
        this.parseWeSocket = parseWebSocket
        this.roles = []
        this.subscriptionInfos = new Map
        this.pushConnect = this._pushEvent('connected')
        this.pushSubscribe = this._pushEvent('subscribed')
        this.pushUnSubscribe = this._pushEvent('unsubscribed')
        this.pushCreate = this._pushEvent('create')
        this.pushEnter = this._pushEvent('enter')
        this.pushUpdate = this._pushEvent('update')
        this.pushDelete = this._pushEvent('delete')
        this.pushLeave = this._pushEvent('leave')
    }

    addSubscriptionInfo(requestId: number, subscriptionInfo: any) {
        this.subscriptionInfos.set(requestId, subscriptionInfo)
    }

    getSubscriptionInfo(requestId: number) {
        return this.subscriptionInfos.get(requestId)
    }

    deleteSubscriptionInfo(requestId: number) {
        return this.subscriptionInfos.delete(requestId)
    }

    private _pushEvent(type: string) {
        return (subscriptionId: number, parseObjectJSON: any) => {
            const response: Message = {
                'op': type,
                'clientId': this.id
            }
            if (typeof subscriptionId !== 'undefined') {
                response.requestId = subscriptionId
            }
            if (typeof parseObjectJSON !== 'undefined') {
                let fields
                if (this.subscriptionInfos.has(subscriptionId)) {
                    fields = this.subscriptionInfos.get(subscriptionId).fields
                }
                response.object = this._toJSONWithFields(parseObjectJSON, fields)
            }
            Client.pushResponse(this.parseWeSocket, JSON.stringify(response))
        }
    }

    private _toJSONWithFields(parseObjectJSON: any, fields: any): FlattenedObjectData {
        if (!fields) {
            return parseObjectJSON
        }

        const limitedParseObject: FlattenedObjectData = {}
        for (const field of defaultFields) {
            limitedParseObject[field] = parseObjectJSON[field]
        }
        for (const field of fields) {
            limitedParseObject[field] = parseObjectJSON[field]
        }
        return limitedParseObject
    }

}