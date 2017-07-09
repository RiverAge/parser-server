import * as events from 'events'

const emitter = new events.EventEmitter()
const subscriptions = new Map()

const unsubscribe = (channel: string) => {
    if (!subscriptions.has(channel)) {
        return
    }

    emitter.removeListener(channel, subscriptions.get(channel))
    subscriptions.delete(channel)
}

class Publisher {
    private emitter: events.EventEmitter

    constructor(e: events.EventEmitter) {
        this.emitter = e
    }

    publish(channel: string, message: string) {
        this.emitter.emit(channel, message)
    }
}

class Consumer extends events.EventEmitter {
    private emitter: events.EventEmitter

    constructor(e: events.EventEmitter) {
        super()
        this.emitter = e
    }

    subscribe(channel: string) {
        unsubscribe(channel)
        const handler = (message: string) => {
            this.emit('message', channel, message)
        }
        subscriptions.set(channel, handler)
        this.emitter.on(channel, handler)
    }

    unsubscribe(channel: string) {
        unsubscribe(channel)
    }
}

export const createPublisher = () => {
    return new Publisher(emitter)
}

export const createSubscriber = () => {
    return new Consumer(emitter)
}
