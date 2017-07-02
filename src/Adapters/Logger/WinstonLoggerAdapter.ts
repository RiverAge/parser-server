import * as winston from 'winston'
import LoggerAdapter from './LoggerAdapter'
import * as winstonLogger from './WinstonLogger'

const MILLISECONDS_IN_A_DAY = 24 * 60 * 60 * 1000

interface QueryOptions extends winston.QueryOptions {
    size?: number,
    fields: any,
    level?: string
}

export class WinstonLoggerAdapter implements LoggerAdapter {
    constructor(options: winston.DailyRotateFileTransportOptions) {
        if (options) {
            winstonLogger.configureLogger(options)
        }
    }

    log() {
        return winstonLogger.logger.log.apply(winstonLogger.logger, arguments)
    }

    addTransport(transport: winston.DailyRotateFileTransportOptions) {
        winstonLogger.addTransport(transport)
    }

    query(options: QueryOptions = { fields: '' }, callback: (res: any) => void) {
        const { from, until, size, order, level, fields } = options
        const queryOptions: winston.QueryOptions = {
            from: from || new Date(Date.now() - (7 * MILLISECONDS_IN_A_DAY)),
            until: until || new Date(),
            limit: size || 10,
            order: order || 'desc',
            fields: fields
            // level: level || 'info'
        }

        return new Promise((resolve, reject) => {
            winstonLogger.logger.query(queryOptions, (err: Error, res: any) => {
                if (err) {
                    callback(err)
                    return reject(err)
                }
                if (level === 'error') {
                    callback(res['parse-server-error'])
                    resolve(res['parse-server-error'])
                } else {
                    callback(res['parse-server'])
                    resolve(res['parse-server'])
                }
            })
        })
    }
}

export default WinstonLoggerAdapter