import AdaptableController from './AdaptableController'
import { AnalyticsAdapter } from './Adatpters/Analytics/AnalyticsAdapter'

class AnalyticsController extends AdaptableController {
    appendOpened(req) {
        return Promise.resolve().then(() => this.adapter.appOpened(req.body, req))
            .then((response) => ({ response: response || {} }))
            .catch(() => ({ response: {} }))
    }

    trackEvent(req) {
        return Promise.resolve().then(() => this.adapter.trackEvent(req.params.eventName, req.body, req))
            .then((response) => ({ response: response || {} }))
            .catch(() => ({ response: {} }))
    }

    expectedAdapterType() {
        return AnalyticsAdapter
    }
}

export default AnalyticsController