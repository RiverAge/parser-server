import * as winston from 'winston'
import * as fs from 'fs'
import * as path from 'path'
import DailyRotateFile from 'winston-daily-rotate-file'
import * as _ from 'lodash'
import defaults from '../../defaults'

const logger = new winston.Logger()
const additionalTransports: Array<TransportOptions> = []

interface TransportOptions {
    name?: string,
    silent: boolean,
    dirname?: string,
    level?: string,
    json?: boolean,
    stringify?: boolean
}

const updateTransports = (options?: TransportOptions) => {
    const transports = Object.assign({}, logger.transports)
    if (options) {
        const silent = options.silent
        delete options.silent
        if (_.isNull(options.dirname)) {
            delete transports['parse-server']
            delete transports['parse-server-error']
        } else if (!_.isUndefined(options.dirname)) {
            transports['parser-server'] = new (DailyRotateFile)(Object.assign({}, {
                filename: 'parse-server.info',
                name: 'parse-server'
            }, options, { timestamp: true }))
            transports['parse-server-error'] = new (DailyRotateFile)(
                Object.assign({}, {
                    filename: 'parse-server.err',
                    name: 'parse-server-error'
                }, options, { level: 'error', timestamp: true })
            )
        }

        transports.console = new (winston.transports.Console)(Object.assign({
            colorize: true,
            name: 'console',
            silent,
            options
        }))
    }

    additionalTransports.forEach((e) => {
        transports[e.name] = e
    })

    logger.configure({transports: _.values(transports)} as winston.LoggerOptions)
}

interface LoggerOptions {
    logsFolder?: string,
    jsonLogs?: string,
    logLevel?: string,
    verbose?: string,
    silent?: boolean
}

export function configureLogger({
    logsFolder = defaults.logsFolder,
    jsonLogs = defaults.jsonLogs,
    logLevel = winston.level,
    verbose = defaults.verbose,
    silent = defaults.silent

}: LoggerOptions = {}) {
    if (verbose) {
        logLevel = 'verbose'
    }

    logger.level = logLevel

    if (logsFolder) {
        if (!path.isAbsolute(logsFolder)) {
            logsFolder = path.resolve(process.cwd(), logsFolder)
        }
        fs.mkdirSync(logsFolder)
    }

    const options: TransportOptions = {
        dirname: logsFolder,
        level: logLevel,
        silent: silent
    }

    if (jsonLogs) {
        options.json = true,
        options.stringify = true
    }
    updateTransports(options)
}

export const addTransport = (transport: TransportOptions) => {
    additionalTransports.push(transport)
    updateTransports()
}

export const removeTransport = (transport: string | TransportOptions) => {
    const transportName =  typeof transport === 'string' ? transport : transport.name
    const transports = Object.assign({}, logger.transports)
    delete transports[transportName]
    logger.configure({
        transports: _.values(transports)
    } as winston.LoggerOptions)
    _.remove(additionalTransports, (e) => {
        return e.name === transportName
    })
}

export default logger