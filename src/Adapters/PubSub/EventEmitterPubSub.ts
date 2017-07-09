import * as events from 'events'

const emitter = new events.EventEmitter()

class Publisher {
    private emitter: events.EventEmitter

    constructor(e: events.EventEmitter) {
        this.emitter = e
    }

    publish(channel: string, message: string) {
        this.emitter.emit(channel, message)
    }
}

class Subscriber extends events.EventEmitter {
    private emitter: events.EventEmitter
    private subscriptions: Map<string, any>

    constructor(e: events.EventEmitter) {
        super()
        this.emitter = e
        this.subscriptions = new Map()
    }

    subscribe(channel: string) {
        const handler = (message: string) => {
            this.emit('message', channel, message)
        }
        this.subscriptions.set(channel, handler)
        this.emitter.on(channel, handler)
    }

    unsubscribe(channel: string) {
        if (this.subscriptions.has(channel)) {
            return
        }
        this.emitter.removeListener(channel, this.subscriptions.get(channel))
        this.subscriptions.delete(channel)
    }
}

export const createPublisher = () => {
    return new Publisher(emitter)
}

export const crateSubscriber = () => {
    return new Subscriber(emitter)
}