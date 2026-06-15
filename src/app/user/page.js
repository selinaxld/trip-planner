'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Loader2 } from 'lucide-react'

export default function UserProfilePage() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true)
      setError('')
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError) {
        setError(userError.message)
        setLoading(false)
        return
      }
      setUser(user)
      // Fetch user profile from DB
      const { data, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      if (profileError) {
        setError(profileError.message)
      } else {
        setProfile(data)
      }
      setLoading(false)
    }
    fetchProfile()
  }, [])

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
  }

  if (error) {
    return <div className="flex items-center justify-center min-h-screen text-red-600">{error}</div>
  }

  return (
    <div className="max-w-xl mx-auto p-8 bg-white rounded-xl shadow-lg mt-10">
      <h1 className="text-2xl font-bold mb-4">User Profile</h1>
      <div className="mb-4">
        <div className="font-semibold">Email:</div>
        <div>{user?.email}</div>
      </div>
      <div className="mb-4">
        <div className="font-semibold">Full Name:</div>
        <div>{profile?.full_name || <span className="text-gray-400">Not set</span>}</div>
      </div>
      <div className="mb-4">
        <div className="font-semibold">Preferences:</div>
        <pre className="bg-gray-100 rounded p-2 text-xs overflow-x-auto">{JSON.stringify(profile?.preferences, null, 2)}</pre>
      </div>
      <a href="/" className="text-blue-600 hover:underline">← Back to Home</a>
    </div>
  )
}
