/**
 * Logger Adapter
 *
 * Allows you to change the logger mechanism
 *
 * Adapter classes must implement the following functions:
 * log() {}
 * query(options, callback)  optional
 * Default is WinstonLoggerAdapter.ts
 */

interface LoggerAdapter {
    log(level: string, message: string): any
}

export default LoggerAdapter