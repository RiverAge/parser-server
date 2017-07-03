import AdaptableController from './AdaptableController'


export default class CacheController extends AdaptableController {
    constructor(adapter, appId, options = {}) {

    }

    get(key: string): Promise {

    }

    put(key, value, ttl): Promise {

    }

    del(key) {

    }
    
    clear() {

    }

    expectedAdapterType() {

    }
}