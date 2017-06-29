import { nullParser } from './cli/utils/parsers'

const logsFolder = (() => {
    let folder: string | undefined = './logs'
    if (typeof process !== 'undefined' && process.env.TESTING === '1') {
        folder = './test_logs/'
    }
    const customFolder = process.env.PARSE_SERVER_LOGS_FOLDER
    if (customFolder) {
        folder = nullParser(customFolder)
    }
    return folder
})()

const { verbose, level } = (() => {
    const ver = process.env.VERBOSE ? true : false
    return { verbose: ver, level: ver ? 'verbose' : undefined }
})()

export default {
    DefaultMongoURI: 'mongodb://localhost:27017/parse',
    jsonLogs: process.env.JSON_LOGS || false,
    logsFolder,
    verbose,
    level,
    silent: false,
    enableAnymouseUsers: true,
    allowClientClassCreation: true,
    maxUploadSize: '20mb',
    verifyUserEmails: false,
    preventLoginWithUnverifyedEmail: false,
    sessionLength: 31536000,
    expireInactiveSessons: true,
    revokeSessionOnPasswordReset: true,
    schemaCacheTTL: 5000, // in ms
    userSensitiveFileds: ['email'],
    objectIdSize: 10
}