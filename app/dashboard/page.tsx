'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { Team, Property, Action, Transaction, Jackpot, Tile } from '@/lib/types'

import { TeamsPanel } from '@/components/dashboard/teams-panel'
import { PropertiesPanel } from '@/components/dashboard/properties-panel'
import { GameControlPanel } from '@/components/dashboard/game-control-panel'
import { GameStatePanel } from '@/components/dashboard/game-state-panel'
import { ActivityLog } from '@/components/dashboard/activity-log'

// ✅ create once, not every render
const supabase = createClient()

export default function Dashboard() {
  const [teams, setTeams] = useState<Team[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [actions, setActions] = useState<Action[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [jackpot, setJackpot] = useState<Jackpot | null>(null)
  const [tiles, setTiles] = useState<Tile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [connectionStatus, setConnectionStatus] =
    useState<'connecting' | 'connected' | 'error'>('connecting')

  // ========================
  // FETCH FUNCTIONS
  // ========================

  const fetchTeams = useCallback(async () => {
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) console.error(error)
    if (data) setTeams(data)
  }, [])

  const fetchProperties = useCallback(async () => {
    const { data, error } = await supabase
      .from('properties')
      .select('*')

    if (error) console.error(error)
    if (data) setProperties(data)
  }, [])

  const fetchActions = useCallback(async () => {
    const { data, error } = await supabase
      .from('actions')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) console.error(error)
    if (data) setActions(data)
  }, [])

  const fetchTransactions = useCallback(async () => {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) console.error(error)
    if (data) setTransactions(data)
  }, [])

  const fetchJackpot = useCallback(async () => {
    const { data, error } = await supabase
      .from('jackpot')
      .select('*')
      .single()

    if (error) console.error(error)
    if (data) setJackpot(data)
  }, [])

  const fetchTiles = useCallback(async () => {
    const { data, error } = await supabase
      .from('tiles')
      .select('*')
      .order('position', { ascending: true })

    if (error) console.error(error)
    if (data) setTiles(data)
  }, [])

  const fetchAllData = useCallback(async () => {
    setIsLoading(true)

    try {
      await Promise.all([
        fetchTeams(),
        fetchProperties(),
        fetchActions(),
        fetchTransactions(),
        fetchJackpot(),
        fetchTiles(),
      ])

      setConnectionStatus('connected')
    } catch (err) {
      console.error(err)
      setConnectionStatus('error')
    }

    setIsLoading(false)
  }, [
    fetchTeams,
    fetchProperties,
    fetchActions,
    fetchTransactions,
    fetchJackpot,
    fetchTiles,
  ])

  // ========================
  // INITIAL LOAD
  // ========================

  useEffect(() => {
    fetchAllData()
  }, [fetchAllData])

  // ========================
  // REALTIME SUBSCRIPTIONS
  // ========================

  useEffect(() => {
    const teamsChannel = supabase
      .channel('teams-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'teams' },
        fetchTeams
      )
      .subscribe()

    const propertiesChannel = supabase
      .channel('properties-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'properties' },
        fetchProperties
      )
      .subscribe()

    const actionsChannel = supabase
      .channel('actions-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'actions' },
        fetchActions
      )
      .subscribe()

    const transactionsChannel = supabase
      .channel('transactions-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transactions' },
        fetchTransactions
      )
      .subscribe()

    const jackpotChannel = supabase
      .channel('jackpot-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'jackpot' },
        fetchJackpot
      )
      .subscribe()

    return () => {
      supabase.removeChannel(teamsChannel)
      supabase.removeChannel(propertiesChannel)
      supabase.removeChannel(actionsChannel)
      supabase.removeChannel(transactionsChannel)
      supabase.removeChannel(jackpotChannel)
    }
  }, [
    fetchTeams,
    fetchProperties,
    fetchActions,
    fetchTransactions,
    fetchJackpot,
  ])

  // ========================
  // HANDLERS
  // ========================

  const handleMoveTeam = () => {
    fetchTeams()
    fetchTransactions()
  }

  const handleActionUpdate = () => {
    fetchActions()
    fetchTeams()
    fetchProperties()
    fetchTransactions()
    fetchJackpot()
  }

  const tilesMapped = tiles

  // ========================
  // LOADING
  // ========================

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400 text-sm">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  // ========================
  // UI
  // ========================

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200">

      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-slate-100">
              Humanopoly
            </h1>
            <span className="text-xs text-slate-500">
              Admin Dashboard
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                connectionStatus === 'connected'
                  ? 'bg-emerald-500'
                  : connectionStatus === 'error'
                  ? 'bg-red-500'
                  : 'bg-amber-500 animate-pulse'
              }`}
            />
            <span className="text-xs text-slate-500">
              {connectionStatus === 'connected'
                ? 'Live'
                : connectionStatus === 'error'
                ? 'Disconnected'
                : 'Connecting...'}
            </span>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="p-6">
        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-180px)]">

          {/* Teams */}
          <div className="col-span-12 lg:col-span-3 bg-slate-900/50 rounded-xl p-5 border border-slate-800 overflow-hidden">
            <TeamsPanel
              teams={teams}
              properties={properties}
              tiles={tilesMapped}
            />
          </div>

          {/* Properties */}
          <div className="col-span-12 lg:col-span-2 bg-slate-900/50 rounded-xl p-5 border border-slate-800 overflow-hidden">
            <PropertiesPanel
              teams={teams}
              properties={properties}
            />
          </div>

          {/* Game Control */}
          <div className="col-span-12 lg:col-span-4 bg-slate-900/50 rounded-xl p-5 border border-slate-800 overflow-hidden">
            <GameControlPanel
              teams={teams}
              properties={properties}
              tiles={tiles}
              onMoveTeam={handleMoveTeam}
            />
          </div>

          {/* Game State */}
          <div className="col-span-12 lg:col-span-3 bg-slate-900/50 rounded-xl p-5 border border-slate-800 overflow-hidden">
            <GameStatePanel
              teams={teams}
              properties={properties}
              actions={actions}
              jackpot={jackpot}
              onActionUpdate={handleActionUpdate}
            />
          </div>
        </div>

        {/* Activity Log */}
        <div className="mt-6 bg-slate-900/50 rounded-xl p-5 border border-slate-800 h-[180px]">
          <ActivityLog
            transactions={transactions}
            teams={teams}
            properties={properties}
          />
        </div>
      </main>
    </div>
  )
}