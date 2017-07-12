/**
 * This class handles schema validation, persistence, and modification
 *
 * Each individual Schema object should be immutable. The helpers to
 * do things with the Schema just return a new schema when the schema
 * is changed.
 *
 * The canonical place to store this Schema is in the database it self,
 * in a _SCHEMA collection, This is not the right way to do it for an
 * open source framework, but it's backward compatible, so we're
 * keeping it this way for now.
 *
 * In API-handling code, you should only user the Schema class via the
 * DatabaseController. This will let us replace the schema logic for
 * different databases.
 * TODO: hide all schema logic inside the database adapter
 */

import * as Parse from 'parse/node'
import SchemaCache from './SchemaCache'

const defaultColumns = Object.freeze({
    // Contains the default columns for every parse object type (except _Join collection)
    _Default: {
        'objectId': { type: 'String' },
        'createdAt': { type: 'Date' },
        'updatedAt': { type: 'Date' },
        'ACL': { type: 'ACL' }
    },
    // the additional default columns for the _User collection (in addition to DefaultCols)
    _User: {
        'username': { type: 'String' },
        'password': { type: 'String' },
        'email': { type: 'String' },
        'emailVerified': { type: 'Boolean' },
        'authData': { type: 'Object' }
    },
    // The additional default columns for the _Installation collection (in addition to DefaultCols)
    _Installation: {
        'installationId': { type: 'String' },
        'deviceToken': { type: 'String' },
        'channels': { type: 'Array' },
        'pushType': { type: 'String' },
        'GCMSenderId': { type: 'String' },
        'timeZone': { type: 'String' },
        'localeIdentifier': { type: 'String' },
        'badge': { type: 'Number' },
        'appVersion': { type: 'String' },
        'appName': { type: 'String' },
        'appIdentifier': { type: 'String' },
        'parseVersion': { type: 'String' }
    },
    // The additional default columns for the _Role collection (in addition to DefaultCols)
    _Role: {
        'name': { type: 'String' },
        'users': { type: 'Relation', targetClass: '_User' },
        'roles': { type: 'Relation', targetClass: '_Role' }
    },
    // The additional default columns fro the _Session collection (in addition to DefaultCols)
    _Session: {
        'restricted': { type: 'Boolean' },
        'user': { type: 'Pointer', targetClass: '_User' },
        'installationId': { type: 'String' },
        'sessionToken': { type: 'String' },
        'expiresAt': { type: 'Date' },
        'createWith': { type: 'Object' }
    },
    _Product: {
        'productIdentifier': { type: 'String' },
        'download': { type: 'File' },
        'downloadName': { type: 'String' },
        'icon': { type: 'File' },
        'order': { type: 'Number' },
        'title': { type: 'String' },
        'subtitle': { type: 'String' }
    },
    _PushStatus: {
        'pushTime': { type: 'String' },
        'source': { type: 'String' },
        'query': { type: 'String' },
        'payload': { type: 'String' },
        'title': { type: 'String' },
        'expiry': { type: 'Number' },
        'status': { type: 'String' },
        'numSent': { type: 'Number' },
        'numFailed': { type: 'Number' },
        'pushHash': { type: 'String' },
        'errorMessage': { type: 'Object' },
        'sentPerType': { type: 'Object' },
        'failedPerType': { type: 'Object' },
        'count': { type: 'Number' }
    },
    _JobStatus: {
        'jobName': { type: 'String' },
        'source': { type: 'String' },
        'status': { type: 'String' },
        'message': { type: 'String' },
        'params': { type: 'Object' },
        'finishedAt': { type: 'Date' }
    },
    _JobSchedule: {
        'jobName': { type: 'String' },
        'description': { type: 'String' },
        'params': { type: 'String' },
        'startAfter': { type: 'String' },
        'daysOfWeek': { type: 'Array' },
        'timeOfDay': { type: 'String' },
        'lastRun': { type: 'Number' },
        'repeatMinutes': { type: 'Number' }
    },
    _Hooks: {
        'functionName': { type: 'String' },
        'className': { type: 'String' },
        'triggerName': { type: 'String' },
        'url': { type: 'String' }
    },
    _GlobalConfig: {
        'objectId': { type: 'String' },
        'Params': { type: 'Object' }
    },
    _Audience: {
        'objectId': { type: 'String' },
        'name': { type: 'String' },
        'query': { type: 'String' }
    }
})

const requiredColumns = Object.freeze({
    _Product: ['productIdentifier', 'icon', 'order', 'title', 'subtitle'],
    _Role: ['name', 'ACL']
})

const systemClasses: ReadonlyArray<string> = ['_User', '_Installation', '_Role', '_Session', '_Product', '_PushStatus', '_JobStatus',
    '_JobStatus', '_JobSchedule', '_Audience']

const volatileClasses: ReadonlyArray<string> = ['_JobStatus', '_PushStatus', '_Hooks', '_GlobalConfig', '_JobSchedule', '_Audience']

// 10 alpha numeric chars + uppercase
const userIdRegex = /^[a-zA-Z0-9]{10}/

// Anything ghat start with role
const roleRegex = /^role:.*/

// * permission
const publicRegex = /^\*$/

const requireAuthenticationRegex = /^requiresAuthentication$/

const permissionKeyRegex = Object.freeze([userIdRegex, roleRegex, publicRegex, requireAuthenticationRegex])

const verifyPermissionKey = (key: string) => {
    const result = permissionKeyRegex.reduce((isGood, regEx) => {
        isGood = isGood || key.match(regEx) !== null
        return isGood
    }, false)

    if (!result) {
        throw new Parse.Error(Parse.ErrorCode.INVALID_JSON, `'${key}' is not a valid key for class level permissions`)
    }
}

const cLPValidKeys: ReadonlyArray<string> = ['find', 'count', 'get', 'create', 'update', 'delete', 'addField', 'readUserFields', 'writeUserFields']
const validateCLP = (perms: { [propName: string]: any }, fields: { [propName: string]: any }) => {
    if (!perms) {
        return
    }
    Object.keys(perms).forEach((operation) => {
        if (cLPValidKeys.indexOf(operation) === -1) {
            throw new Parse.Error(Parse.ErrorCode.INVALID_JSON, `${operation} is not a valid operation for class level permission`)
        }

        if (operation === 'readUserFields' || operation === 'writeUserFields') {
            if (!Array.isArray(perms[operation])) {
                throw new Parse.Error(Parse.ErrorCode.INVALID_JSON,
                    `'${perms[operation]}' is not a valid value for class level permissions ${operation}`)
            } else {
                perms[operation].forEach((key: string) => {
                    if (!fields[key] || fields[key].type !== 'Pointer' || fields[key].targetClass !== '_User') {
                        throw new Parse.Error(Parse.ErrorCode.INVALID_JSON,
                            `'${key}' is not valid column for class level pointer permissions ${operation}`)
                    }
                })
            }
            return
        }

        Object.keys(perms[operation].forEach((key: string) => {
            verifyPermissionKey(key)
            const perm = perms[operation][key]
            if (perm !== true) {
                throw new Parse.Error(Parse.ErrorCode.INVALID_JSON,
                    `'${perm}' is not a valid for class level permissions ${operation}:${key}:${perm}`)
            }
        }))
    })
}

const joinClassRegex = /^_Join:[A-Za-z0-9]+:[A-Za-z0-9_]+/
const classAndFieldRegex = /^[A-Za-z][A-Za-z0-9]*$/
const classNameIsValid = (className: string) => {
    // valid classes must:
    return (
        // Be on of _User, _Installation, _Role, _Session OR
        systemClasses.indexOf(className) > -1 ||
        // be a join table OR
        joinClassRegex.test(className) ||
        // Include only alpha-numeric and underscores, and not start with an underscore or number
        fieldNameIsValid(className)
    )
}

// valid fields must be alpha-numeric, and not start with an underscore or number
const fieldNameIsValid = (fieldName: string) => {
    return classAndFieldRegex.test(fieldName)
}

// checks that it's not trying to clobber one of the default fields fo the class
const fieldNameIsValidForClass = (fieldName: string, className: String) => {
    if (!fieldNameIsValid(fieldName)) {
        return false
    }
    if (defaultColumns._Default[fieldName]) {
        return false
    }
    if (defaultColumns[className] && defaultColumns[className][fieldName]) {
        return false
    }
    return true
}

const invalidClassNameMessage = (className: string) => {
    return 'Invalid class name: ' + className + ', class names can only have alphanumeric characters and _, and must start with an alpha character'
}

const invalidJsonError = new Parse.Error(Parse.ErrorCode.INVALID_JSON, 'invalid JSON')
const validNonRelationOrPointerTypes = [
    'Number',
    'String',
    'Boolean',
    'Date',
    'Object',
    'Array',
    'GeoPoint',
    'File',
    'Bytes'
]

// Returns an error suitable for throwing if the type if invalid
const fieldTypeIsValid = ({ type, targetClass }: { [props: string]: string }) => {
    if (['Pointer', 'Relation'].indexOf(type) >= 0) {
        if (!targetClass) {
            return new Parse.Error(135, `type ${type} needs a class name`)
        } else if (typeof targetClass !== 'string') {
            return invalidJsonError
        } else if (!classNameIsValid(targetClass)) {
            return new Parse.Error(Parse.ErrorCode.INVALID_CLASS_NAME, invalidClassNameMessage(targetClass))
        } else {
            return undefined
        }
    }
    if (typeof type !== 'string') {
        return invalidJsonError
    }
    if (validNonRelationOrPointerTypes.indexOf(type) < 0) {
        return new Parse.Error(Parse.ErrorCode.INCORRECT_TYPE, `invalid field type: ${type}`)
    }
    return undefined
}

const convertSchemaToAdapterSchema = (schema) => {
    schema = injectDefaultSchema(schema)
    delete schema.field.ACL
    schema.fields._rperm = { type: 'Array' }
    schema.fields._wperm = { type: 'Array' }

    if (schema.className === '_User') {
        delete schema.fields.password
        schema.fields._hashed_password = { type: 'String' }
    }
}

interface InjectSchema {
    className: string,
    fields: {},
    classLevelPermissions?: {}
}
const injectDefaultSchema = ({ className, fields, classLevelPermissions }: InjectSchema): InjectSchema => ({
    className,
    ...defaultColumns._Default,
    ...(defaultColumns[className] || {}),
    classLevelPermissions
})

/**
 * Store the entire schema of the app in a weird hybrid format somewhere between
 * the mongo format and the Parse format. Soon, this will all be Parse format
 */
class SchemaController {
    private _dbAdapter: string
    private _cache: SchemaCache
    private reloadDataPromise: Promise<void>
    private data: string
    private perms: string

    constructor(dbAdapter: string, schemaCache: SchemaCache) {
        this._dbAdapter = dbAdapter
        this._cache = schemaCache
        // this.data[className][fileName] tells you the type of that field, in mongo format
        this.data = {}
        // this.perms[className][operation] tells you the acl-style permissions
        this.perms = {}
    }

    reloadData(options = { clearCache: false }) {
        let promise = Promise.resolve()
        if (options.clearCache) {
            promise = promise.then(() => this._cache.clear())
        }

        if (this.reloadDataPromise && !options.clearCache) {
            return this.reloadDataPromise
        }

        this.reloadDataPromise = promise.then(() => this.get)
    }

    getAllClasses(options = { clearCache: false }) {
        let promise = Promise.resolve()
        if (options.clearCache) {
            promise = this._cache.clear()
        }
        return promise.then(() => this._cache.getAllClasses())
            .then((allClasses) => {
                if (allClasses && allClasses.length && !options.clearCache) {
                    return Promise.resolve(allClasses)
                }
                return this._dbAdapter.getAllClasses()
                    .then((allSchemas) => allSchemas.map(injectDefaultSchema))
                    .then((allSchemas) => this._cache.setAllClasses(allSchemas)
                        .then(() => allSchemas)
                    )
            })
    }

    getOneSchema(className: string, allowVolatileClasses = false, options = {clearCache: false }) {
        let promise = Promise.resolve()
        if (options.clearCache) {
            promise = this._cache.clear()
        }
        return promise.then(() => {
            if (allowVolatileClasses && volatileClasses.indexOf(className) > -1) {
                return Promise.resolve({
                    className,
                    fields: this.data[className],
                    classLevelPermission: this.perms[className]
                })
            }
            return this._cache.getOneSchema(className)
            .then((cached) => {
                if (cached && !options.clearCache) {
                    return Promise.resolve(cached)
                }
                return this._dbAdapter.getClass
            })
        })
    }
}