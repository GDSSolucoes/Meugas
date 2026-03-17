import { api, apiEnabled } from '@/lib/apiClient'

export async function listProducts(q = '') {
  if (!apiEnabled) throw new Error('API não configurada')
  const r = await api.get('/api/products', { params: { q } })
  return r.data
}

export async function getProduct(id) {
  if (!apiEnabled) throw new Error('API não configurada')
  const r = await api.get(`/api/products/${id}`)
  return r.data
}

export async function createProduct(data) {
  if (!apiEnabled) throw new Error('API não configurada')
  const r = await api.post('/api/products', data)
  return r.data
}

export async function updateProduct(id, data) {
  if (!apiEnabled) throw new Error('API não configurada')
  const r = await api.put(`/api/products/${id}`, data)
  return r.data
}
