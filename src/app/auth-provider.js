'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { usePathname, useRouter } from 'next/navigation'
import Loading from '../components/Loading'

export default function AuthProvider({ children }) {
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState(null)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setLoading(false)
      if (!session && pathname !== '/login') {
        router.replace('/login')
      }
      if (session && pathname === '/login') {
        router.replace('/')
      }
    })
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
      if (!session && pathname !== '/login') {
        router.replace('/login')
      }
      if (session && pathname === '/login') {
        router.replace('/')
      }
    })
    return () => {
      listener.subscription.unsubscribe()
    }
  }, [pathname, router])

  if (loading) {
    return <Loading message="Checking authentication..." fullScreen />
  }

  // If not authenticated and on login page, show login
  if (!session && pathname === '/login') {
    return children
  }

  // If not authenticated and not on login, show nothing (redirect will happen)
  if (!session) {
    return null
  }

  // If authenticated, show app
  return children
}
