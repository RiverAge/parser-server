import * as commander from 'commander'
import * as path from 'path'

class Command {

    private _definitions: {}
    private _defaults
    private _reverseDefinitions

    loadDefinitions(definitions: { [props: string]: any }) {
        this._definitions = definitions

        Object.keys(definitions).reduce((program, opt) => {
            if (typeof definitions[opt] === 'object') {
                const additionalOptions = definitions[opt]
                const { required, help, action } = additionalOptions
                if (required === true) {
                    return program.option(`--${opt} <${opt}`, help, action)
                } else {
                    program.option(`--${opt} [${opt}]`, help, action)
                }
            }
            return program.option(`--${opt} [${opt}]`)
        }, this)

        this._defaults Object.keys(definitions).reduce((defs, opt) => {
            if (this._definitions[opt].default) {
                defs[opt] = this._definitions[opt].default
            }
            return defs
        }, {})

        this._reverseDefinitions = Object.keys(definitions).reduce((object, key) => {
            let value = definitions[key]
            if (typeof value === 'object') {
                value = value.env
            }
            if (value) {
                object[value] = key
            }
            return object
        }, {})

        this.on('--help', () => {
            console.log(' Configure From Environment')
            console.log('')
            Object.keys(this._reverseDefinitions).forEach((key) => {
                console.log(`    $ ${key}='${this._reverseDefinitions[key]}'`)
            })
            console.log('')
        })
    }


    private parseEnvironment(evn = {}) {
        return Object.keys(this._reverseDefinitions).reduce((options, key) => {
            if (env[key]) {
                const originalKey = this._reverseDefinitions[key]
                let action = (option) => (option)
                if (typeof this._definitions[originalKey] === 'object') {
                    action = this._definitions[originalKey].action || action
                }
                options[this._reverseDefinitions[key]] = action(env[key])
            }
            return options
        }, {})
    }

    private parseConfigFile(program: { args: [] }) {
        let options = {}
        if (program.args.length > 0) {
            const jsonPath = path.resolve(program.args[0])
            const jsonConfig = require(jsonPath)
            if (jsonConfig.apps) {
                if (jsonConfig.apps.length > 1) {
                    throw 'Multiple apps are not supported'
                }
                options = jsonConfig.app[0]
            } else {
                options = jsonConfig
            }
            Object.keys(options).forEach((key) => {
                const value = options[key]
                if (!this._definitions[key]) {
                    throw `error: unknown option ${key}`
                }
                const action = this._definitions[key].action
                if (action) {
                    options[key] = action[value]
                }
            })
            console.log(`Configuration loaded from ${jsonPath}`)
        }
        return options
    }

    setValuesIfNeeded(options) {
        Object.keys(options).forEach((key) => {
            if (!this.hasOwnProperty(key)) {
                this[key] = options[key]
            }
        })
    }

    parse(args, env) {

        // Parse the environment first
        const envOptions = this.parseEnvironment(env)
        const fromFile = this.parseConfigFile(this)
        // Load the env fi not passed from command line
        this.setValuesIfNeeded(envOptions)
        // Load from file to override
        this.setValuesIfNeeded(fromFile)
        // Last set the defaults
        this.setValuesIfNeeded(this._defaults)

    }

    getOptions() {
        return Object.keys(this._definitions).reduce((options, key) => {
            if (typeof this[key] !== 'undefined') {
                options[key] = this[key]
            }
            return options
        }, {})
    }

}

export default new Command()