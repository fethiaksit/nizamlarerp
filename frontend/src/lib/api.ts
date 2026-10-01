const baseURL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api/v1'

export class ApiError extends Error {}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${baseURL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  if (!response.ok) {
    const body = await response.json().catch(() => ({ message: 'İşlem sırasında bir sorun oluştu.' }))
    throw new ApiError(body.message ?? 'İşlem sırasında bir sorun oluştu.')
  }
  return response.json() as Promise<T>
}
