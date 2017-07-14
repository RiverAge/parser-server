// This class handles the Account Lockout Policy settings.
import * as Parse from 'parse/node'

interface User {
    username: string
}

interface Config {
    database: string,
    accountLockout: {
        threshold: number,
        duration: number
    }
}

class AccountLockout {
    private _user: User
    private _config: Config

    constructor(user: User, config: Config) {
        this._user = user
        this._config = config
    }

    /**
     * set _failed_login_count to value
     */
    private _setFailedLoginCount(value: number) {
        const query = {
            username: this._user.username
        }

        const updateFields = {
            _failed_login_count: value
        }

        return this._config.database.update('_User', query, updateFields)
    }

    /**
     * check if the _failed_login_count field has been set
     */
    private _isFailedLoginCountSet(): Promise<boolean> {
        const query = {
            username: this._user.username,
            _failed_login_count: { $exists: true }
        }

        return this._config.database.find('_User', query)
            .then((users: User[]) => {
                if (Array.isArray(users) && users.length > 0) {
                    return true
                }
                return false
            })
    }

    /**
     * if _failed_login_count is NOT set then set it to 0 else do nothing
     */
    private _initFailedLoginCount() {
        return this._isFailedLoginCountSet()
            .then((failedLoginCountIsSet) => {
                if (!failedLoginCountIsSet) {
                    return this._setFailedLoginCount(0)
                }
            })
    }

    /**
     * increment _failed_login_count by 1
     */
    private _incrementFailedLoginCount() {
        const query = {
            username: this._user.username
        }

        const updateFields = {
            _failed_login_count: {
                __op: 'Increment', amount: 1
            }
        }

        return this._config.database.update('_User', query, updateFields)
    }

    /**
     * if the failed login count is greater than the threshold
     * then sets lockout expiration to 'currenttime + accountPolicy.duration',
     *  i.e.,account is locked out for the next 'accountPolicy.duration' minutes
     * else do nothing
     */

    private _setLockoutExpiration() {
        const query = {
            username: this._user.username,
            _failed_login_count: {
                $gte: this._config.accountLockout.threshold
            }
        }

        const now = new Date()

        const updateFields = {
            _account_lockout_expires_at: Parse._encode(new Date(now.getTime() +
                this._config.accountLockout.duration * 60 * 1000))
        }

        return this._config.database.update('_User', query, updateFields)
            .catch((err) => {
                if (err && err.code &&
                    err.message &&
                    err.code === 101 &&
                    err.message === 'Object not found.') {
                    // nothing to update so we are good
                    return
                } else {
                    // unknown err
                    throw err
                }
            })
    }

    /**
     * if _account_lockout_expires_at > current_time and _failed_login_count > threshold
     * reject with account locked error else resolve
     */
    private _notLocked() {
        const query = {
            username: this._user.username,
            _account_lockout_expires_at: {
                $gt: Parse._encode(new Date())
            },
            _failed_login_count: {
                $gte:
                this._config.accountLockout.threshold
            }
        }

        return this._config.database.find('_User', query)
            .then((users) => {
                if (Array.isArray(users) && users.length > 0) {
                    throw new Parse.Error(Parse.ErrorCode.OBJECT_NOT_FOUND,
                        'Your account is locked due to multiple failed login attempts. Please try again after' +
                        this._config.accountLockout.duration + ' minute(s)')
                }
            })
    }

    /**
     * set and/or increment _failed_login_count if _failed_login_count > threshold
     * set the _account_lockout_expires_at to current_time + accountPolicy.duration
     * else
     * do nothing
     */

    private _handleFailedLoginAttempt() {
        return this._initFailedLoginCount()
            .then(() => this._incrementFailedLoginCount())
            .then(() => this._setLockoutExpiration())
    }

    /**
     * handle login attempt if the Account Lockout Policy is enabled
     */

    public handleLoginAttempt(loginSuccessful: boolean) {
        if (!this._config.accountLockout) {
            return Promise.resolve()
        }
        return this._notLocked()
            .then(() => {
                if (loginSuccessful) {
                    return this._setFailedLoginCount(0)
                } else {
                    this._handleFailedLoginAttempt()
                }
            })
    }
}
