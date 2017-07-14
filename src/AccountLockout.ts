// This class handles the Account Lockout Policy settings.
import * as Parse from 'parse/node'

class AccountLockout {
    private _user: string
    private _config: string

    constructor(user: string, config: string) {
        this._user = user
        this._config = config
    }

    /**
     * set _failed_login_count to value
     */
    private _setFailedLoginCount(value: string) {
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
    private _isFailedLoginCountSet() {
        const query = {
            username: this._user.username
            _failed_login_count: {$exists: true}
        }

        return this._config.database.find('_User', query)
        .then((users) => {
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
        return this._
    }
}
