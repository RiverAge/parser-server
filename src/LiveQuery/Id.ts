class Id {
    private className: string
    private objectId: string

    static fromString(str: string) {
        const split = str.split(':')
        if (split.length !== 2) {
            throw new TypeError('Cannot create Id object from this string')
        }
        return new Id(split[0], split[1])
    }

    constructor(className: string, objectId: string) {
        this.className = className
        this.objectId = objectId
    }

    toString() {
        return `${this.className}:${this.objectId}`
    }
}