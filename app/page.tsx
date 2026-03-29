'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function TeamJoin() {
  const supabase = createClient()
  const router = useRouter()

  const [teamName, setTeamName] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    
    // 1. Password check
    if (password !== process.env.NEXT_PUBLIC_TEAM_PASSWORD) {
      setError('Invalid password')
      setLoading(false)
      return
    }

    // 2. Get active match
    const { data: match, error: matchError } = await supabase
  .from('matches')
  .select('*')
  .eq('status', 'active')
  .single()

if (matchError || !match) {
  setError('No active match')
  setLoading(false)
  return
}

    // 3. Insert team (DB enforces uniqueness)
    const { data: team, error: insertError } = await supabase
      .from('teams')
      .insert([
        {
          name: teamName,
          balance: 1500,
          position: 0,
          match_id: match.id,
        },
      ])
      .select()
      .single()

    if (insertError) {
      setError('Team name already taken in this match')
      setLoading(false)
      return
    }

    // 4. Store session locally
    localStorage.setItem('team', JSON.stringify(team))

    // 5. Redirect
    setLoading(false)
    router.push('/player')
  }

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl p-8">

        <h1 className="text-xl text-slate-100 font-semibold mb-6 text-center">
          Join Game
        </h1>

        <form onSubmit={handleJoin} className="space-y-4">

          <input
            type="text"
            placeholder="Team Name"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            required
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-slate-100"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-slate-100"
          />

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-blue-600 rounded text-white"
          >
            {loading ? 'Joining...' : 'Join'}
          </button>
        </form>
      </div>
    </div>
  )
}