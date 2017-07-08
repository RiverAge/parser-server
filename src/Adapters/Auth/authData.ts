export interface AuthData {
    id: string
    id_str: string
    id_token: string
    auth_token: string
    access_token: string
    is_mobile_sdk: boolean
    consumer_key: string
    auth_token_secret: string
}

export interface ResData {
    id: string
    sub: string
    openid: string
    uid: string
    user_id: string
    data: {
        id: string
    }
    profile: {
        identifier: string
    }
    result: string
    stat: string
    errcode: number
}
