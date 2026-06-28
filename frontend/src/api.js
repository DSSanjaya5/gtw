/**
 * Thin fetch wrapper. Uses relative URLs — Vite proxy forwards to http://localhost:8080.
 * Throws Error with a human-readable message on non-OK responses.
 */
export async function api(method, path, body) {
  const token = localStorage.getItem('access_token')
  const res = await fetch(path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Something went wrong')
  }
  return res.json()
}
