import * as logger from '../logger'

export  type FlattenedObjectData = {[attr: string]: any}
export type QueryData = {[attr: string]: any}

class Subscription {

    // It is query condition eg query.where
    private query: QueryData
    private className: string
    private hash: string
    private clientRequestIds: Object
}