/**
 * Files Adapter
 *
 * Allow you change the file storage mechanism.
 *
 * Adapter classes must implement the following functions:
 *  * createFile(config, filename, data)
 *  * getFileData(config, filename)
 *  * getFileLocation(config, request, filename)
 *
 * Default is GridStoreAdapter, which requires mongo
 * and for the API server to be using the DatabaseController with Mongo
 * database adapter.
 */

interface FilesAdapter {

    /**
     * This method is responsible to store the file in order to retrieved later by its file name
     *
     * @param filename the filename to save
     * @param data the buffer of data from file
     * @param conteType the supposed contentType
     * @discussion the ContentType can be undefined if the controller was not able to determine it
     *
     * @return a promise that should fail if the storage didn't succeed
     */
    createFile(filename: string, data: any, conteType: string): Promise<void>

    deleteFile(filename: string): void

    getFileData(filename: string): any

    getFileLocation(config: {}, filename: string): string

}

export default FilesAdapter