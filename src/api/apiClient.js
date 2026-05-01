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
  return localStorage.getItem('accessToken')
}

function getRefreshToken() {
  return localStorage.getItem('refreshToken')
}

function setAccessToken(token) {
  localStorage.setItem('accessToken', token)
}

function setRefreshToken(token) {
  localStorage.setItem('refreshToken', token)
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
          const r = await api.post('/auth/refresh', { refreshToken: rt })
          setAccessToken(r.data.accessToken)
          setRefreshToken(r.data.refreshToken)
          pending.forEach(fn => fn(r.data.accessToken))
          pending = []
          return api(original)
        } catch (error) {
          console.error('Error refreshing token:', error)
          throw error
        } finally {
          isRefreshing = false
        }
        return new Promise(resolve => {
          pending.push(token => {
            original.headers.Authorization = `Bearer ${token}`
            resolve(api(original))
          })
        })
      }
      else {
        throw err;
      }
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
