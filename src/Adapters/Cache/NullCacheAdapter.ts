class NullCacheAdapter {

    get() {
        return new Promise<null>((resolve) => resolve(null))
    }

    put() {
        return Promise.resolve()
    }

    del() {
        return Promise.resolve()
    }

    clear() {
        return Promise.resolve()
    }
}

export default NullCacheAdapter