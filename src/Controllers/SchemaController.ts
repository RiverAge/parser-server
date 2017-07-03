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
        'Params': {type: 'Object'}
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

const systemClasses = Object.freeze(['_User', '_Installation', '_Role', '_Session', '_Product', '_PushStatus', '_JobStatus',
    '_JobStatus', '_JobSchedule', '_Audience'])

const volatileClasses = Object.freeze(['_JobStatus', '_PushStatus', '_Hooks', '_GlobalConfig', '_JobSchedule', '_Audience'])

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

const cLPValidKeys = Object.freeze(['find', 'count', 'get', 'create', 'update', 'delete', 'addField', 'readUserFields', 'writeUserFields'])
const validateCLP = (perms: { [propName: string]: any }, fields: {[propName: string]: any}) => {
    if (!perms) {
        return
    }
    Object.keys(perms).forEach((operation) => {
        if (cLPValidKeys.indexOf(operation) === -1 ) {
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

const 