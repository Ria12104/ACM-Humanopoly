'use client'

import { Team, Property } from '@/lib/types'

interface PropertiesPanelProps {
  teams: Team[]
  properties: Property[]
}

export function PropertiesPanel({ teams, properties }: PropertiesPanelProps) {
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Pre-group properties by team (O(n), not O(n²))
  const propertiesByTeam = properties.reduce((acc, property) => {
    if (!property.owner_team_id) return acc

    if (!acc[property.owner_team_id]) {
      acc[property.owner_team_id] = []
    }

    acc[property.owner_team_id].push(property)
    return acc
  }, {} as Record<string, Property[]>)

  // Map into display structure
  const grouped = teams
    .map((team) => ({
      team,
      properties: propertiesByTeam[team.id] || [],
    }))
    .filter((group) => group.properties.length > 0)

  const hasOwnedProperties = grouped.length > 0

  return (
    <div className="h-full flex flex-col">
      <h2 className="text-lg font-semibold text-slate-100 mb-4">
        Property Ownership
      </h2>

      {!hasOwnedProperties ? (
        <div className="flex-1 flex items-start justify-center pt-10">
          <p className="text-slate-500 text-sm">
            No properties owned yet
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">

          {grouped.map(({ team, properties: teamProps }) => (
            <div key={team.id} className="space-y-2">

              <h3 className="text-sm font-medium text-slate-300 sticky top-0 bg-slate-900 py-1 z-10">
                {team.name}
              </h3>

              <div className="space-y-1">
                {teamProps.map((property) => (
                  <div
                    key={property.id}
                    className="flex items-center justify-between py-2 px-3 bg-slate-800/30 rounded-md"
                  >
                    <span className="text-sm text-slate-300 truncate">
                      {property.name}
                    </span>
                    <span className="text-xs text-slate-500">
                      {formatCurrency(property.price)}
                    </span>
                  </div>
                ))}
              </div>

            </div>
          ))}

        </div>
      )}
    </div>
  )
}