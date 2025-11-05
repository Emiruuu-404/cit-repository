// Small API helper for frontend -> backend calls
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000'

export function backendUrl(path = '/') {
  try {
    const base = API_BASE.endsWith('/') ? API_BASE : `${API_BASE}/`
    return new URL(path, base).toString()
  } catch (error) {
    const separator = path.startsWith('/') ? '' : '/'
    return `${API_BASE}${separator}${path}`
  }
}

export async function searchCapstones(q, k = 12) {
  if (!q) return { query: q, results: [] }
  const params = new URLSearchParams({ q, k: String(k) })
  const res = await fetch(`${API_BASE}/api/search?${params.toString()}`, {
    method: 'GET',
    credentials: 'include',
  })
  if (!res.ok) throw new Error('Search request failed')
  return res.json()
}

export async function listCapstones({ q = '', per_page = 10, page = 1 } = {}) {
  const params = new URLSearchParams({ per_page: String(per_page), page: String(page) })
  if (q) params.set('q', q)
  const res = await fetch(`${API_BASE}/api/capstones?${params.toString()}`, { credentials: 'include' })
  if (!res.ok) throw new Error('List capstones request failed')
  return res.json()
}

export async function summarizeCapstone(query, { k = 8 } = {}) {
  if (!query) throw new Error('Summarize requires a query')
  const res = await fetch(`${API_BASE}/api/summarize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ query, k }),
  })
  if (!res.ok) throw new Error('Summarize request failed')
  return res.json()
}

export async function getCapstone(projectId) {
  if (!projectId) throw new Error('Project id is required')
  const res = await fetch(`${API_BASE}/api/capstones/${projectId}`, { credentials: 'include' })
  if (!res.ok) throw new Error('Capstone details request failed')
  return res.json()
}

export default { searchCapstones, listCapstones, summarizeCapstone, getCapstone, backendUrl }
