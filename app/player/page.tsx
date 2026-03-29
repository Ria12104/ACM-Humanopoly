'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function PlayerPage() {
  const supabase = createClient()

  const [team, setTeam] = useState<any>(null)
  const [action, setAction] = useState<any>(null)
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [loadingAction, setLoadingAction] = useState(false)

  // Load team
  useEffect(() => {
    const stored = localStorage.getItem('team')
    if (!stored) {
      window.location.href = '/login'
      return
    }
    setTeam(JSON.parse(stored))
  }, [])

  // Fetch action
  const fetchAction = async (teamId: string) => {
    const { data } = await supabase
      .from('actions')
      .select('*, properties(*), teams(name)')
      .eq('team_id', teamId)
      .eq('status', 'pending')
      .maybeSingle()

    setAction(data)
  }

  // Fetch leaderboard (top 3)
  const fetchLeaderboard = async () => {
    const { data } = await supabase
      .from('teams')
      .select('*')
      .order('balance', { ascending: false })
      .limit(3)

    setLeaderboard(data || [])
  }

  useEffect(() => {
    if (!team) return

    fetchAction(team.id)
    fetchLeaderboard()

    // Realtime team updates
    const teamChannel = supabase
      .channel('team-player')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'teams',
          filter: `id=eq.${team.id}`,
        },
        (payload) => {
          setTeam(payload.new)
          fetchLeaderboard()
        }
      )
      .subscribe()

    // Realtime action updates
    const actionChannel = supabase
      .channel('action-player')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'actions',
          filter: `team_id=eq.${team.id}`,
        },
        () => fetchAction(team.id)
      )
      .subscribe()

    return () => {
      supabase.removeChannel(teamChannel)
      supabase.removeChannel(actionChannel)
    }
  }, [team, supabase])

  // Player choice
  const handleAction = async (type: 'buy' | 'task_buy' | 'task_only' | 'skip') => {
    if (!action) return

    setLoadingAction(true)

    await supabase
      .from('actions')
      .update({
        action_type: type,
        locked_at: new Date().toISOString(),
      })
      .eq('id', action.id)

    setLoadingAction(false)
  }

  if (!team) return null

  const property = action?.properties
  const isOwned = property?.owner_team_id && property.owner_team_id !== team.id

  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center px-4">

      {/* TEAM INFO */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-md text-center mb-6">
        <h1 className="text-xl text-slate-100 font-semibold">{team.name}</h1>
        <p className="text-slate-400 text-sm">Balance: ₹{team.balance}</p>
        <p className="text-slate-400 text-sm">Position: {team.position}</p>
      </div>

      {/* POPUP */}
      {action && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-md">

            {/* PROPERTY INFO */}
            <h2 className="text-lg text-slate-100 font-semibold mb-2">
              {property?.name}
            </h2>
            <p className="text-slate-400 text-sm mb-1">
              Price: ₹{property?.price}
            </p>

            {/* OWNER */}
            {isOwned && (
              <p className="text-red-400 text-sm mb-4">
                Owned by another team
              </p>
            )}

            {/* OWNED → NO ACTION */}
            {isOwned && (
              <button
                onClick={() => setAction(null)}
                className="w-full py-2 bg-slate-700 rounded text-white"
              >
                Close
              </button>
            )}

            {/* VACANT PROPERTY */}
            {!isOwned && (
              <>
                {/* PRIMARY ACTIONS */}
                {!action.action_type && (
                  <div className="space-y-2 mt-4">
                    <button
                      onClick={() => handleAction('buy')}
                      className="w-full py-2 bg-green-600 rounded text-white"
                    >
                      Buy Property
                    </button>

                    <button
                      onClick={() => handleAction('skip')}
                      className="w-full py-2 bg-slate-700 rounded text-white"
                    >
                      Skip
                    </button>
                  </div>
                )}

                {/* TASK SECTION */}
                {!action.action_type && (
                  <div className="mt-6 text-center">
                    <p className="text-slate-400 text-sm mb-2">
                      Need extra cash?
                    </p>

                    <button
                      onClick={() => handleAction('task_only')}
                      className="bg-blue-600 px-4 py-2 rounded text-white"
                    >
                      Complete Task
                    </button>
                  </div>
                )}

                {/* AFTER TASK */}
                {action.action_type === 'task_only' && (
                  <div className="mt-4 space-y-2">
                    <p className="text-slate-400 text-sm">
                      Task submitted
                    </p>

                    <button
                      onClick={() => handleAction('task_buy')}
                      className="w-full py-2 bg-green-600 rounded text-white"
                    >
                      Buy Property
                    </button>
                  </div>
                )}

                {/* WAIT STATE */}
                {action.action_type && (
                  <p className="text-center text-amber-400 text-sm mt-4">
                    Waiting for admin...
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* LEADERBOARD */}
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl p-4">
        <h3 className="text-slate-100 text-sm mb-2">Top Teams</h3>

        {leaderboard.map((t, i) => (
          <div key={t.id} className="flex justify-between text-sm text-slate-300">
            <span>#{i + 1} {t.name}</span>
            <span>₹{t.balance}</span>
          </div>
        ))}
      </div>
    </div>
  )
}