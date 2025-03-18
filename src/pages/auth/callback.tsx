import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../config/supabase'

export default function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    // Handle the OAuth callback
    const handleAuthCallback = async () => {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Auth callback error:', error)
        navigate('/auth/login')
        return
      }

      if (session) {
        // Successfully authenticated
        navigate('/', { replace: true })
      }
    }

    handleAuthCallback()
  }, [navigate])

  return (
    <div className="min-h-screen bg-[#141414] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"/>
        <p className="text-white text-lg">Authenticating...</p>
      </div>
    </div>
  )
}
