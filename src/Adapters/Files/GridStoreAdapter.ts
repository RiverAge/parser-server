/**
 * GridStoreAdapter
 * Store files in Mongo using GridStore
 * Requires the database adapter to be based on mongoclient
 */

import { MongoClient, GridStore, Db } from 'mongodb'
import FilesAdapter from './FilesAdapter'
import defaults from '../../defaults'

class GridStoreAdapter implements FilesAdapter {

    private databaseURI: string
    private _connectionPromise: Promise<Db>

    constructor(uri = defaults.DefaultMongoURI) {
        this.databaseURI = uri
    }

    private get connect() {
        if (!this._connectionPromise) {
            this._connectionPromise = MongoClient.connect(this.databaseURI)
        }
        return this._connectionPromise
    }

    /**
     * For a given object, filename, and data, store a file
     * Returns a promise
     */

    public createFile(filename: string, data: any) {
        return this.connect
            .then((database) => (new GridStore(database, filename, 'w').open()))
            .then((gridStore) => gridStore.write(data))
            .then((gridStore) => gridStore.close())
    }

    public deleteFile(filename: string) {
        return this.connect
            .then((database) => (new GridStore(database, filename, 'r').open()))
            .then((gridStore) => gridStore.unlink())
            .then((gridStore) => gridStore.close())
    }

    public getFileData(filename: string) {
        return this.connect
            .then((database) => GridStore.exist(database, filename)
                .then(() => (new GridStore(database, filename, 'r').open())))
            .then((gridStore) => gridStore.read())
    }

    getFileLocation(config, filename: string) {
        return (config.mount
            + '/files/'
            + config.applicationId
            + '/'
            + encodeURIComponent(filename))
    }

    getFileStream(filename: string) {
        return this.connect
            .then((database) => GridStore.exist(database, filename)
                .then(() => (new GridStore(database, filename, 'r').open)))
    }
}

export default GridStoreAdapter