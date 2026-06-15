'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import UserMenu from './UserMenu'

export default function TopBar() {
  const [user, setUser] = useState(null)
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user))
  }, [])
  if (!user) return null
  return (
    <div className="w-full flex justify-end p-4 bg-white border-b">
      <UserMenu user={user} />
    </div>
  )
}
