import { useState } from 'react'
import { api, apiEnabled } from '@/lib/apiClient'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const [mode, setMode] = useState('email')
  const [email, setEmail] = useState('')
  const [cpf, setCpf] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const submit = async e => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (!apiEnabled) throw new Error('API desabilitada')
      const payload = mode === 'email' ? { email, password } : { cpf, password }
      const r = await api.post('/api/auth/login', payload)
      localStorage.setItem('access_token', r.data.access_token)
      localStorage.setItem('refresh_token', r.data.refresh_token)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || 'Falha ao autenticar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-full max-w-sm bg-white p-6 shadow rounded">
        <h1 className="text-xl font-semibold mb-4">Entrar</h1>
        <div className="flex gap-2 mb-4">
          <button className={`px-3 py-1 rounded ${mode === 'email' ? 'bg-slate-900 text-white' : 'bg-slate-200'}`} onClick={() => setMode('email')}>Email</button>
          <button className={`px-3 py-1 rounded ${mode === 'cpf' ? 'bg-slate-900 text-white' : 'bg-slate-200'}`} onClick={() => setMode('cpf')}>CPF</button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          {mode === 'email' ? (
            <input className="w-full border rounded px-3 py-2" placeholder="email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
          ) : (
            <input className="w-full border rounded px-3 py-2" placeholder="cpf" value={cpf} onChange={e => setCpf(e.target.value)} />
          )}
          <input className="w-full border rounded px-3 py-2" placeholder="senha" type="password" value={password} onChange={e => setPassword(e.target.value)} />
          {error ? <div className="text-red-600 text-sm">{error}</div> : null}
          <button className="w-full bg-slate-900 text-white rounded px-3 py-2 disabled:opacity-50" disabled={loading}>{loading ? 'Entrando...' : 'Entrar'}</button>
        </form>
      </div>
    </div>
  )
}
