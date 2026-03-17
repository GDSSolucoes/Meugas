import { api, apiEnabled } from '@/lib/apiClient'

export async function getCompany(id) {
  if (!apiEnabled) throw new Error('API não configurada')
  const r = await api.get(`/api/companies/${id}`)
  return r.data
}

export async function createCompany(data) {
  if (!apiEnabled) throw new Error('API não configurada')
  const r = await api.post('/api/companies', data)
  return r.data
}

export async function updateCompany(id, data) {
  if (!apiEnabled) throw new Error('API não configurada')
  const r = await api.put(`/api/companies/${id}`, data)
  return r.data
}
