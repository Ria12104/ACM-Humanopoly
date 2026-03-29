'use client'

import { useState, useMemo } from 'react'
import { Team, Property, Action, Jackpot } from '@/lib/types'
import { createClient } from '@/lib/supabase'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface GameStatePanelProps {
  teams: Team[]
  properties: Property[]
  actions: Action[]
  jackpot: Jackpot | null
  onActionUpdate: () => void
}

export function GameStatePanel({
  teams,
  properties,
  actions,
  jackpot,
  onActionUpdate,
}: GameStatePanelProps) {
  const supabase = createClient()

  const [auctionExpanded, setAuctionExpanded] = useState(false)
  const [auctionPropertyId, setAuctionPropertyId] = useState('')
  const [auctionWinnerId, setAuctionWinnerId] = useState('')
  const [auctionPrice, setAuctionPrice] = useState('')
  const [jackpotAmount, setJackpotAmount] = useState('')
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const pendingActions = useMemo(
    () => actions.filter((a) => a.status === 'pending'),
    [actions]
  )

  const teamMap = useMemo(
    () => Object.fromEntries(teams.map((t) => [t.id, t])),
    [teams]
  )

  const propertyMap = useMemo(
    () => Object.fromEntries(properties.map((p) => [p.id, p])),
    [properties]
  )

  const availableForAuction = useMemo(
    () => properties.filter((p) => !p.owner_team_id),
    [properties]
  )

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount)

  const getActionTypeLabel = (type: string) => {
    if (type === 'buy') return 'Buy'
    if (type === 'task_buy') return 'Task + Buy'
    if (type === 'task_only') return 'Task Only'
    return type
  }

  // ✅ APPROVE / REJECT

  const handleApprove = async (actionId: string) => {
    setProcessingId(actionId)

    const { error } = await supabase
      .from('actions')
      .update({ status: 'approved' })
      .eq('id', actionId)

    if (error) console.error(error)

    onActionUpdate()
    setProcessingId(null)
  }

  const handleReject = async (actionId: string) => {
    setProcessingId(actionId)

    const { error } = await supabase
      .from('actions')
      .update({ status: 'rejected' })
      .eq('id', actionId)

    if (error) console.error(error)

    onActionUpdate()
    setProcessingId(null)
  }

  // ✅ JACKPOT (USE DB FUNCTIONS)

  const handleAddToJackpot = async () => {
    const amount = parseFloat(jackpotAmount)
    if (isNaN(amount)) return

    setIsProcessing(true)

    const { error } = await supabase.rpc('add_to_jackpot', {
      p_amount: amount,
    })

    if (error) console.error(error)

    setJackpotAmount('')
    onActionUpdate()
    setIsProcessing(false)
  }

  const handleClaimJackpot = async () => {
    if (!teams.length) return

    // you can improve this later with explicit team selection
    const teamId = teams[0].id

    setIsProcessing(true)

    const { error } = await supabase.rpc('claim_jackpot', {
      p_team_id: teamId,
    })

    if (error) console.error(error)

    onActionUpdate()
    setIsProcessing(false)
  }

  // ⚠️ TEMP AUCTION (still frontend heavy, but safe enough)

  const handleConfirmAuction = async () => {
    if (!auctionPropertyId || !auctionWinnerId || !auctionPrice) return

    const price = parseFloat(auctionPrice)
    if (isNaN(price)) return

    setIsProcessing(true)

    try {
      await supabase
        .from('properties')
        .update({ owner_team_id: auctionWinnerId })
        .eq('id', auctionPropertyId)

      const winningTeam = teamMap[auctionWinnerId]

      if (winningTeam) {
        await supabase
          .from('teams')
          .update({ balance: winningTeam.balance - price })
          .eq('id', auctionWinnerId)
      }

      await supabase.from('transactions').insert({
        team_id: auctionWinnerId,
        type: 'auction',
        amount: -price,
        related_property_id: auctionPropertyId,
      })
    } catch (err) {
      console.error(err)
    }

    setAuctionPropertyId('')
    setAuctionWinnerId('')
    setAuctionPrice('')
    setAuctionExpanded(false)

    onActionUpdate()
    setIsProcessing(false)
  }

  return (
    <div className="h-full flex flex-col">
      <h2 className="text-lg font-semibold text-slate-100 mb-4">
        Game State
      </h2>

      <div className="flex-1 overflow-y-auto space-y-4 pr-1">

        {/* Pending Actions */}
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
          <h3 className="text-sm font-medium text-slate-300 mb-3">
            Pending Approvals
            {pendingActions.length > 0 && (
              <span className="ml-2 bg-amber-500/20 text-amber-400 text-xs px-2 py-0.5 rounded-full">
                {pendingActions.length}
              </span>
            )}
          </h3>

          {pendingActions.length === 0 ? (
            <p className="text-slate-500 text-sm">No pending actions</p>
          ) : (
            <div className="space-y-2">
              {pendingActions.map((action) => (
                <div
                  key={action.id}
                  className="bg-slate-900/50 rounded-md p-3 space-y-2"
                >
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-slate-200">
                      {teamMap[action.team_id]?.name}
                    </span>
                    <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">
                      {getActionTypeLabel(action.action_type)}
                    </span>
                  </div>

                  {action.property_id && (
                    <p className="text-xs text-slate-400">
                      {propertyMap[action.property_id]?.name}
                    </p>
                  )}

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => handleApprove(action.id)}
                      disabled={processingId === action.id}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs py-1.5 rounded disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(action.id)}
                      disabled={processingId === action.id}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs py-1.5 rounded disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Jackpot */}
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
          <h3 className="text-sm font-medium text-slate-300 mb-3">
            Jackpot
          </h3>

          <p className="text-3xl font-bold text-amber-400 text-center mb-4">
            {formatCurrency(jackpot?.total_amount || 0)}
          </p>

          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                type="number"
                value={jackpotAmount}
                onChange={(e) => setJackpotAmount(e.target.value)}
                className="flex-1 bg-slate-700/50 border border-slate-600 rounded px-3 py-1.5 text-sm"
              />
              <button
                onClick={handleAddToJackpot}
                disabled={!jackpotAmount || isProcessing}
                className="bg-amber-600 px-3 text-xs rounded disabled:opacity-50"
              >
                Add
              </button>
            </div>

            <button
              onClick={handleClaimJackpot}
              disabled={!jackpot?.total_amount || isProcessing}
              className="w-full bg-amber-500/20 text-amber-400 py-2 rounded border border-amber-500/30 disabled:opacity-50"
            >
              Claim Jackpot
            </button>
          </div>
        </div>

        {/* Auction */}
        <div className="bg-slate-800/50 rounded-lg border border-slate-700/50">
          <button
            onClick={() => setAuctionExpanded(!auctionExpanded)}
            className="w-full flex justify-between p-4"
          >
            <span className="text-sm text-slate-300">Auction</span>
            {auctionExpanded ? <ChevronUp /> : <ChevronDown />}
          </button>

          {auctionExpanded && (
            <div className="px-4 pb-4 space-y-3">

              <select
                value={auctionPropertyId}
                onChange={(e) => setAuctionPropertyId(e.target.value)}
                className="w-full bg-slate-700 border px-3 py-2 rounded"
              >
                <option value="">Property</option>
                {availableForAuction.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>

              <select
                value={auctionWinnerId}
                onChange={(e) => setAuctionWinnerId(e.target.value)}
                className="w-full bg-slate-700 border px-3 py-2 rounded"
              >
                <option value="">Team</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>

              <input
                type="number"
                value={auctionPrice}
                onChange={(e) => setAuctionPrice(e.target.value)}
                placeholder="Final price"
                className="w-full bg-slate-700 border px-3 py-2 rounded"
              />

              <button
                onClick={handleConfirmAuction}
                disabled={
                  !auctionPropertyId ||
                  !auctionWinnerId ||
                  !auctionPrice ||
                  isProcessing
                }
                className="w-full bg-amber-600 py-2 rounded text-sm disabled:opacity-50"
              >
                Confirm Auction
              </button>

            </div>
          )}
        </div>
      </div>
    </div>
  )
}