import { createClient } from './PostgresClient'
import Parse from 'parse/node'
import _ from 'lodash'
import sql from './sql'
import { logger } from '../../../logger'

const POSTGRES_RELATION_DOES_NOT_EXIST_ERROR = '42P01'
const POSTGRES_DUPLICATE_RELATION_ERROR = '42P07'
const POSTGRES_DUPLICATE_COLUMN_ERROR = '42701'
const POSTGRES_DUPLICATE_OBJECT_ERROR = '42710'
const POSTGRES_UNIQUE_INDEX_VIOLATION_ERROR = '23505'
const POSTGRES_TRANSACTION_ABORTED_ERROR = '25P02'

const debug = () => {
    let args = [...arguments]
    args = ['PG: ' + arguments[0]].concat(args.slice(1))
    const log = logger.getLogger()
    log.debug.apply(log, args)
}

const parseTypeToPostgresType = (type: {type: string, contents: {type: string}}) => {
    switch(type.type) {
        case 'String': return 'text'
        case 'Date': return 'timestamp with time zone'
        case 'Object': return 'jsonb'
        case 'File': return 'text'
        case 'Boolean': return 'boolean'
        case 'Pointer': return 'char(10)'
        case 'Number': return 'double precision'
        case 'GeoPoint': return 'point'
        case 'Bytes': return 'jsonb'
        case 'Array':
            if (type.contents && type.contents.type === 'String' ) {
                return 'text[]'
            } else {
                return 'jsonb'
            }
        default:
            throw `no type for ${JSON.stringify(type)} yet`
    }
}

const ParseToPostgresComparator = Object.freeze({
    '$gt': '>',
    '$lt': '<',
    '$gte': '>=',
    '$lte': '<='
})

const toPostgresValue = (value: string) => {
    if (typeof value === 'object') {
        if (value.__type === 'Date') {
            return value.iso
        }
        if (value.__type === 'File') {
            return value.name
        }
    }
    return value
}

const transformValue = (value) => {
    if (typeof value === 'object' &&
    value.__type === 'Pointer') {
        return value.objectId
    }
    return value
}

// Duplicate from then mongo adapter...
const emptyCLPS = Object.freeze({
    find: {},
    get: {},
    create: {},
    update: {},
    delete: {},
    addFiled: {}
})

const defaultCLPS = Object.freeze({
    find: { '*': true },
    get: { '*': true },
    create: { '*': true },
    update: { '*': true },
    delete: { '*': true },
    addFiled: { '*': true }
})