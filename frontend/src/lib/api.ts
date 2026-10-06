const envBaseURL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL
const baseURL = envBaseURL ? envBaseURL.replace(/\/+$/, '') : '/api/v1'

export const TOKEN_STORAGE_KEY = 'nizamlar_erp_token'

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY)
  } catch {
    return null
  }
}

export function setStoredToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token)
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY)
    }
  } catch {
    // ignore
  }
}

export type UnauthorizedHandler = () => void
let onUnauthorizedCallback: UnauthorizedHandler | null = null

export function setUnauthorizedHandler(handler: UnauthorizedHandler | null): void {
  onUnauthorizedCallback = handler
}

export class ApiError extends Error {
  status?: number
  constructor(message: string, status?: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = path.startsWith('http://') || path.startsWith('https://')
    ? path
    : `${baseURL}${path.startsWith('/') ? path : `/${path}`}`

  const token = getStoredToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  }

  if (token && !headers['Authorization'] && !headers['authorization']) {
    headers['Authorization'] = `Bearer ${token}`
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    })

    if (!response.ok) {
      if (response.status === 401 && !path.includes('/auth/login')) {
        if (onUnauthorizedCallback) {
          onUnauthorizedCallback()
        }
      }

      const body = await response.json().catch(() => ({ message: 'İşlem sırasında bir sorun oluştu.' }))
      const msg = body.message || `İşlem başarısız oldu (${response.status})`
      throw new ApiError(msg, response.status)
    }

    return (await response.json()) as T
  } catch (err) {
    if (err instanceof ApiError) {
      throw err
    }
    console.error(`[API Call Failed] URL: ${url}`, err)
    throw new ApiError('Sunucuya ulaşılamadı. Lütfen bağlantınızı ve API hizmetini kontrol edin.')
  }
}
