const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

function getToken() {
  return localStorage.getItem('token')
}

function handleUnauthorized() {
  localStorage.removeItem('token')
  if (window.location.pathname !== '/login') {
    window.location.assign('/login')
  }
}

async function parseResponse(response) {
  const contentType = response.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    return response.json()
  }
  return response.text()
}

async function request(path, options = {}) {
  const token = getToken()
  const headers = new Headers(options.headers || {})

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  })

  if (response.status === 401) {
    handleUnauthorized()
    throw new Error('Unauthorized')
  }

  const payload = await parseResponse(response).catch(() => null)

  if (!response.ok) {
    const message = payload && typeof payload === 'object' && 'detail' in payload ? payload.detail : `Request failed (${response.status})`
    throw new Error(message)
  }

  return payload
}

export const api = {
  getProjects() {
    return request('/projects')
  },

  getProject(projectId) {
    return request(`/projects/${projectId}`)
  },

  getProjectActivity(projectId) {
    return request(`/projects/${projectId}/activity`)
  },

  createProject(payload) {
    return request('/projects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
  },


  deleteProject(projectId) {
    return request(`/projects/${projectId}`, {
      method: 'DELETE',
    })
  },
  uploadTextDocument(projectId, payload) {
    return request(`/projects/${projectId}/documents/text`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
  },

  uploadPdfDocument(projectId, file) {
    const body = new FormData()
    body.append('file', file)

    return request(`/projects/${projectId}/documents/pdf`, {
      method: 'POST',
      body,
    })
  },

  getProjectDocuments(projectId) {
    return request(`/projects/${projectId}/documents`)
  },

  deleteProjectDocument(projectId, documentId) {
    return request(`/projects/${projectId}/documents/${documentId}`, {
      method: 'DELETE',
    })
  },

  searchProject(projectId, q, k = 5) {
    const params = new URLSearchParams({ q, k: String(k) })
    return request(`/projects/${projectId}/search?${params.toString()}`)
  },

  askProject(projectId, q, k = 5) {
    const params = new URLSearchParams({ q, k: String(k) })
    return request(`/projects/${projectId}/ask?${params.toString()}`)
  },
}

export { API_BASE_URL }
