/**
 * AdaptableController.ts
 * AdaptableController is the base class for all controller
 * that support adapter,
 * the super class takes care of creating the right instance for the adapter
 * based on the parameters passed
 */

// _adapter is private, use Symbol

const _adapter = Symbol()

import Config from '../Config'

class AdaptableController {

    private appId: string
    private options: string
    private _adapter: string

    static validateAdapter(adapter, self, expectedType?) {
        if (!adapter) {
            throw new Error(this.constrocutor.name + 'requires an adapter')
        }

        const type = expectedType || self.expectedType()
        // Allow skipping fro testing
        if (!type) {
            return
        }

        // Makes sure the prototype matches
        const mismatches = Object.getOwnPropertyNames(type.prototype).reduce((obj, key) => {
            const adapterType = typeof adapter[key]
            const expected = typeof type.prototype[key]
            if (adapterType !== expected) {
                obj[key] = {
                    expected: expected,
                    actual: adapterType
                }
            }
            return obj
        }, {})

        if (Object.keys(mismatches).length > 0) {
            throw new Error('Adapter prototype don\'t match expected prototype', adapter, mismatches)
        }
    }

    constructor(adapter, appId: string, options) {
        this.options = options
        this.appId = appId
        this.adapter = adapter
    }

    set adapter(adapter) {
        this.validateAdapter(adapter)
        this._adapter = adapter
        // this[_adapter] = adapter
    }

    get adapter() {
        return this._adapter
    }

    get config() {
        return new Config(this.appId)
    }

    expectedAdapterType() {
        throw new Error('Subclasses should implement expectedAdapterType()')
    }

    validateAdapter(adapter) {
        AdaptableController.validateAdapter(adapter, this)
    }

}

export default AdaptableController