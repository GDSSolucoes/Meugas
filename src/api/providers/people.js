import { api, apiEnabled } from '@/lib/apiClient'

export async function listPeople(q = '') {
  if (!apiEnabled) throw new Error('API não configurada')
  const r = await api.get('/api/people', { params: { q } })
  return r.data
}

export async function getPerson(id) {
  if (!apiEnabled) throw new Error('API não configurada')
  const r = await api.get(`/api/people/${id}`)
  return r.data
}

export async function createPerson(data) {
  if (!apiEnabled) throw new Error('API não configurada')
  const r = await api.post('/api/people', data)
  return r.data
}

export async function updatePerson(id, data) {
  if (!apiEnabled) throw new Error('API não configurada')
  const r = await api.put(`/api/people/${id}`, data)
  return r.data
}
