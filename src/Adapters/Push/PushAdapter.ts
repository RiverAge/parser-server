/**
 * Push Adapter
 * Allow you to change the push notification mechanism
 *
 * Adapter class must implement the following functions:
 * * getValidPushTypes()
 * * send(devices, installations, pushStatus)
 *
 * Default is ParsePushAdapter, which uses GCM for
 * android push and APNs for iOS push.
 */
interface PushAdapter {
    send(body: any, installations: any[], pushStatus: any): Promise<any>
    /**
     * Get an array of valid push types.
     * @return {Array} An array of valid push types.
     */
    getValidPushTypes(): string[]
}

export default PushAdapter