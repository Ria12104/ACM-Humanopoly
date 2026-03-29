'use client'

import { Team, Property, Transaction } from '@/lib/types'

interface ActivityLogProps {
  transactions: Transaction[]
  teams: Team[]
  properties: Property[]
}

export function ActivityLog({ transactions, teams, properties }: ActivityLogProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      signDisplay: 'always',
    }).format(amount)
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getTeamName = (teamId: string) => {
    return teams.find((t) => t.id === teamId)?.name || 'Unknown'
  }

  const getPropertyName = (propertyId: string | null) => {
    if (!propertyId) return null
    return properties.find((p) => p.id === propertyId)?.name
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'buy':
      case 'auction':
        return 'text-blue-400'
      case 'rent':
      case 'tax':
        return 'text-red-400'
      case 'reward':
      case 'salary':
        return 'text-emerald-400'
      case 'jackpot':
        return 'text-amber-400'
      default:
        return 'text-slate-400'
    }
  }

  const getAmountColor = (amount: number) => {
    return amount >= 0 ? 'text-emerald-400' : 'text-red-400'
  }

  return (
    <div className="h-full flex flex-col">
      <h2 className="text-lg font-semibold text-slate-100 mb-4">Activity Log</h2>

      {transactions.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-slate-500 text-sm">No transactions yet</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-1">
            {transactions.map((tx) => {
              const propertyName = getPropertyName(tx.property_id)
              return (
                <div
                  key={tx.id}
                  className="flex items-center gap-3 py-2 px-3 bg-slate-800/30 rounded-md hover:bg-slate-800/50 transition-colors"
                >
                  <span className="text-xs text-slate-500 w-14 shrink-0">
                    {formatTime(tx.created_at)}
                  </span>
                  <span className="text-sm text-slate-300 flex-1 truncate">
                    <span className="font-medium">{getTeamName(tx.team_id)}</span>
                    <span className="text-slate-500 mx-1">·</span>
                    <span className={getTypeColor(tx.type)}>{tx.type}</span>
                    {propertyName && (
                      <>
                        <span className="text-slate-500 mx-1">·</span>
                        <span className="text-slate-400">{propertyName}</span>
                      </>
                    )}
                  </span>
                  <span
                    className={`text-sm font-mono font-medium shrink-0 ${getAmountColor(tx.amount)}`}
                  >
                    {formatCurrency(tx.amount)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
