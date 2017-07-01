import * as URL from 'url'

export interface DatabaseOptions {
    host: string,
    port: number,
    database?: string,
    user: string,
    password: string,
    ssl: boolean,
    binary: boolean,
    client_encoding: string,
    application_name: string,
    fallback_application_name: string,
    poolSize?: number
}

export const getDatabaseOptionsFromURI = (uri: string): DatabaseOptions => {

    const parsedURI: URL.Url = URL.parse(uri)
    const queryParams = parseQueryParams(parsedURI.query)
    const authParts = parsedURI.auth ? parsedURI.auth.split(':') : []

    const { ssl, binary, client_encoding, application_name, fallback_application_name, poolSize } = queryParams
    const databaseOptions: DatabaseOptions = {
        host: parsedURI.hostname || 'localhost',
        port: parsedURI.port ? parseInt(parsedURI.port, 10) : 5432,
        database: parsedURI.pathname ? parsedURI.pathname.substr(1) : undefined,
        user: authParts[0] || '',
        password: authParts[1] || '',
        ssl: ssl && ssl.toLowerCase() === 'true' ? true : false,
        binary: binary && binary.toLowerCase() === 'true' ? true : false,
        client_encoding,
        application_name,
        fallback_application_name
    }

    if (poolSize) {
        databaseOptions.poolSize = parseInt(poolSize, 10) || 10
    }

    return databaseOptions

}

export const parseQueryParams = (query = '') => {
    return query
        .split('&')
        .reduce((p, c) => {
            const parts = c.split('=')
            p[decodeURIComponent(parts[0])] = parts.length > 1 ? decodeURIComponent(parts.slice(1).join('=')) : ''
            return p
        }, {} as { [key: string]: string })
}