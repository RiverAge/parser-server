export interface AuthData {
    id: string,
    id_token: string,
    access_token: string
}

export interface ResData {
    id: string,
    sub: string,
    user_id: string,
    data: {
        id: string
    }
}
