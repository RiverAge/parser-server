import * as parser from './PostgresConfigParser'
import * as pgPromise from 'pg-promise'

interface DBOptions {
    initOptions?: string,
    pgOptions?: parser.DatabaseOptions
}
export const createClient = (uri: string, databaseOptions: parser.DatabaseOptions = {}) => {
    let optionsFromURI = uri ? parser.getDatabaseOptionsFromURI(uri) : {}

    const dbOptions: DBOptions = {
        ...optionsFromURI,
        ...databaseOptions
    }

    const initOptions: pgPromise.IOptions<any> = dbOptions.initOptions || {}
    const pgp = pgPromise(initOptions)
    const client = pgp(dbOptions)

    if (dbOptions.pgOptions) {
         pgp.pg.defaults = {
             ...pgp.pg.defaults,
             ...dbOptions.pgOptions
         }
    }

    return { client, pgp }
}