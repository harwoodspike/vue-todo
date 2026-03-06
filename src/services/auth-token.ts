let _token: string | null = null

export function setToken(token: string | null) { _token = token }
export function getToken(): string | null { return _token }
