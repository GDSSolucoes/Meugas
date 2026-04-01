import axios from 'axios'

const baseURL = import.meta.env.VITE_API_BASE_URL || ''
export const apiEnabled = !!baseURL

let isRefreshing = false
let pending = []

export const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' }
})

function getAccessToken() {
  return localStorage.getItem('access_token')
}

function getRefreshToken() {
  return localStorage.getItem('refresh_token')
}

function setAccessToken(token) {
  localStorage.setItem('access_token', token)
}

api.interceptors.request.use(cfg => {
  const token = getAccessToken()
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

api.interceptors.response.use(
  res => res,
  async err => {
    const original = err.config
    if (apiEnabled && err.response && err.response.status === 401 && !original._retry) {
      original._retry = true
      if (!isRefreshing) {
        isRefreshing = true
        try {
          const rt = getRefreshToken()
          if (!rt) throw err
          const r = await api.post('/api/auth/refresh', { refresh_token: rt })
          setAccessToken(r.data.access_token)
          pending.forEach(fn => fn(r.data.access_token))
          pending = []
          return api(original)
        } catch (error) {
          console.error('Error refreshing token:', error)
          throw error
        } finally {
          isRefreshing = false
        }
      }
      return new Promise(resolve => {
        pending.push(token => {
          original.headers.Authorization = `Bearer ${token}`
          resolve(api(original))
        })
      })
    }
    try {
      const msg = err?.response?.data?.error || err.message
      window.dispatchEvent(new CustomEvent('api-error', { detail: { message: msg } }))
    } catch (error) {
      console.error('Error dispatching API error event:', error)
      throw error;
    }
    return Promise.reject(err)
  }
)
