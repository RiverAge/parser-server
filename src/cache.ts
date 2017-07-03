import { InMemoryCache } from './Adapters/Cache/InMemoryCache'

export const appCache = new InMemoryCache({ttl: NaN})
export default appCache