export const numberParsers = (key: string) => (opt: string): number => {
    const intOpt = parseInt(opt, 10)
    if (!Number.isInteger(intOpt)) {
        throw new Error(`Key ${key} has invalid value ${opt}`)
    }
    return intOpt
}

export const numberOrBoolParser = (key: string) => (opt: boolean | string) => {
    if (typeof opt === 'boolean') {
        return opt
    }
    if (opt === 'true') {
        return true
    }
    if (opt === 'false') {
        return false
    }
    return numberParsers(key)(opt)
}

export const objectParser = (opt: object) => {
    if (typeof opt === 'object') {
        return opt
    }
    return JSON.parse(opt)
}

export const arrayParser = (opt: Array<any> | string) => {
    if (Array.isArray(opt)) {
        return opt
    } else if (typeof opt === 'string') {
        return opt.split(',')
    } else {
        throw new Error(`${opt} should be a comma separated string or any array`)
    }
}

export const moduleOrObjectParaser = (opt: object) => {
    if (typeof opt === 'object') {
        return opt
    }
    try {
        return JSON.parse(opt)
    } finally {
        return opt
    }
}

const booleanParaser = (opt: boolean | string) => {
    if (opt === true || opt === 'true' || opt === '1') {
        return true
    }
    return false
}

const nullParser = (opt: string) => {
    if (opt === 'null') {
        return undefined
    }
    return opt
}