'use client'

import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Loader2, LogIn, UserPlus, Apple, Circle } from 'lucide-react'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [view, setView] = useState('login') // 'login' or 'signup'

  const handleEmailAuth = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      if (view === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      } else {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
      }
      window.location.href = '/'
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleOAuth = async (provider) => {
    setLoading(true)
    setError('')
    try {
      const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: window.location.origin } })
      if (error) throw error
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          {view === 'login' ? <LogIn className="w-6 h-6 text-blue-600" /> : <UserPlus className="w-6 h-6 text-green-600" />}
          {view === 'login' ? 'Sign In' : 'Sign Up'}
        </h1>
        <p className="text-gray-600 mb-6 text-sm">Welcome to TripPlanner! Sign in or create an account to save your travel plans.</p>
        <form onSubmit={handleEmailAuth} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoComplete="email"
            disabled={loading}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoComplete={view === 'login' ? 'current-password' : 'new-password'}
            disabled={loading}
          />
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <button
            type="submit"
            className={`w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-semibold transition-colors ${view === 'login' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white'}`}
            disabled={loading}
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (view === 'login' ? 'Sign In' : 'Sign Up')}
          </button>
        </form>
        <div className="my-6 flex items-center gap-2">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400">OR</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>
        <div className="flex flex-col gap-3">
          <button
            onClick={() => handleOAuth('google')}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 text-gray-900 font-semibold"
            disabled={loading}
          >
            <Circle className="w-5 h-5 text-red-500" /> Continue with Google
          </button>
          <button
            onClick={() => handleOAuth('apple')}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-black text-white font-semibold hover:bg-gray-900"
            disabled={loading}
          >
            <Apple className="w-5 h-5" /> Continue with Apple
          </button>
        </div>
        <div className="mt-6 text-center text-sm text-gray-600">
          {view === 'login' ? (
            <>
              Don't have an account?{' '}
              <button className="text-blue-600 hover:underline" onClick={() => setView('signup')}>Sign up</button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button className="text-blue-600 hover:underline" onClick={() => setView('login')}>Sign in</button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
