'use client'

import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { LogOut, UserCircle2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function UserMenu({ user }) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.replace('/login')
  }

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium"
      >
        <UserCircle2 className="w-6 h-6 text-blue-600" />
        <span className="hidden sm:inline">{user?.email || 'Account'}</span>
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-lg z-50">
          <div className="px-4 py-3 border-b">
            <div className="font-semibold text-gray-900 text-sm">{user?.email}</div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-3 text-left text-red-600 hover:bg-gray-50"
          >
            <LogOut className="w-4 h-4" />
            Log out
          </button>
        </div>
      )}
    </div>
  )
}
