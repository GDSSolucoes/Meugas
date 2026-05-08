import { useEffect } from 'react'
import { useToast } from '@/components/ui/use-toast'

export default function ApiErrorToaster() {
  const { toast } = useToast()
  useEffect(() => {
    function handler(e) {
      const msg = e?.detail?.message || 'Erro inesperado'
      toast({
        title: 'Erro',
        description: msg,
        variant: 'destructive'
      })
    }
    window.addEventListener('api-error', handler)
    return () => window.removeEventListener('api-error', handler)
  }, [toast])
  return null
}
