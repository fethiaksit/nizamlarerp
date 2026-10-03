const envBaseURL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL
const baseURL = envBaseURL ? envBaseURL.replace(/\/+$/, '') : '/api/v1'

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

  try {
    const response = await fetch(url, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options,
    })

    if (!response.ok) {
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
