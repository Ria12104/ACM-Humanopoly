'use client'

import { Team, Property } from '@/lib/types'

interface TeamWithNetWorth extends Team {
  propertyValue: number
  netWorth: number
}

interface TeamsPanelProps {
  teams: Team[]
  properties: Property[]
  tiles: { position: number; name: string }[]
}

export function TeamsPanel({ teams, properties, tiles }: TeamsPanelProps) {
  const teamsWithNetWorth: TeamWithNetWorth[] = teams.map((team) => {
    const ownedProperties = properties.filter((p) => p.owner_team_id === team.id)
    const propertyValue = ownedProperties.reduce((sum, p) => sum + p.price, 0)
    return {
      ...team,
      propertyValue,
      netWorth: team.balance + propertyValue,
    }
  }).sort((a, b) => b.netWorth - a.netWorth)

  const getTileName = (position: number) => {
  const tile = tiles.find((t) => t.position === position)
  return tile?.name || `Tile ${position}`
  }
  const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {

    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
  }

  if (teams.length === 0) {
    return (
      <div className="h-full flex flex-col">
        <h2 className="text-lg font-semibold text-slate-100 mb-4">Teams</h2>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-slate-500 text-sm">Waiting for teams to join...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <h2 className="text-lg font-semibold text-slate-100 mb-4">Teams</h2>
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {teamsWithNetWorth.map((team, index) => (
          <div
            key={team.id}
            className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-500">#{index + 1}</span>
                <h3 className="font-medium text-slate-100">{team.name}</h3>
              </div>
              <span className="text-xs text-slate-500">
                {getTileName(team.position)}
              </span>
            </div>
            
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div>
                <p className="text-slate-500 text-xs mb-1">Cash</p>
                <p className="text-emerald-400 font-medium">
                  {formatCurrency(team.balance)}
                </p>
              </div>
              <div>
                <p className="text-slate-500 text-xs mb-1">Properties</p>
                <p className="text-blue-400 font-medium">
                  {formatCurrency(team.propertyValue)}
                </p>
              </div>
              <div>
                <p className="text-slate-500 text-xs mb-1">Net Worth</p>
                <p className="text-slate-100 font-semibold">
                  {formatCurrency(team.netWorth)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
