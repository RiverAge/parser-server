class AnalyticsAdapter {
    /**
     *
     * @param parameters the analytics request body, analytics info will be in the dimensions property
     * @param req the original request
     */
    appendOne(parameters: string, req: string) {
        return Promise.resolve({})
    }

    /**
     *
     * @param eventName the name of the custom eventName
     * @param parameters the analytics request body, analytics info will be in the dimensions property
     * @param req the original http request
     */
    trackEvent(eventName: string, parameters: string, req: string) {
        return Promise.resolve({})
    }

}