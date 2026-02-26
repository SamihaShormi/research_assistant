const API_BASE_URL = 'http://localhost:8000'

export async function apiRequest(path, { method = 'GET', token, body } = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}))
    const detail = payload?.detail || 'Request failed'
    throw new Error(detail)
  }

  if (response.status === 204) {
    return null
  }

  return response.json()
}

export { API_BASE_URL }
