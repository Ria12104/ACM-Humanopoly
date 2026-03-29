'use client'

import { useState } from 'react'
import { Team, Property, Tile } from '@/lib/types'
import { createClient } from '@/lib/supabase'

interface GameControlPanelProps {
  teams: Team[]
  properties: Property[]
  tiles: Tile[]
  onMoveTeam: (teamId: string, newPosition: number, tileName: string) => void
}

export function GameControlPanel({ teams, properties, tiles, onMoveTeam }: GameControlPanelProps) {
  const [selectedTeamId, setSelectedTeamId] = useState('')
  const [diceValue, setDiceValue] = useState('')
  const [currentTile, setCurrentTile] = useState<{ teamName: string; tileName: string } | null>(null)
  const [currentProperty, setCurrentProperty] = useState<Property | null>(null)
  const [showTask, setShowTask] = useState(false)
  const [taskCompleted, setTaskCompleted] = useState(false)
  const [isMoving, setIsMoving] = useState(false)

  const supabase = createClient()

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const handleMove = async () => {
    if (!selectedTeamId || !diceValue) return
    
    setIsMoving(true)
    const team = teams.find((t) => t.id === selectedTeamId)
    if (!team) {
      setIsMoving(false)
      return
    }

    const dice = parseInt(diceValue, 10)
    if (isNaN(dice) || dice < 1 || dice > 12) {
      setIsMoving(false)
      return
    }

    const totalTiles = tiles.length || 40
    const newPosition = ((team.position + dice - 1) % totalTiles) + 1
    
    const { error } = await supabase
      .from('teams')
      .update({ position: newPosition })
      .eq('id', selectedTeamId)

    if (error) {
      console.error('Error moving team:', error)
      setIsMoving(false)
      return
    }

    const landedTile = tiles.find((t) => t.number === newPosition)
    const tileName = landedTile?.name || `Tile ${newPosition}`
    
    setCurrentTile({ teamName: team.name, tileName })
    onMoveTeam(selectedTeamId, newPosition, tileName)

    // Check if it's a property tile
    if (landedTile?.type === 'property' && landedTile.property_id) {
      const property = properties.find((p) => p.id === landedTile.property_id)
      if (property && !property.owner_team_id) {
        setCurrentProperty(property)
      } else {
        setCurrentProperty(null)
      }
    } else {
      setCurrentProperty(null)
    }

    setShowTask(false)
    setTaskCompleted(false)
    setDiceValue('')
    setIsMoving(false)
  }

  const handleBuy = async () => {
    if (!currentProperty || !selectedTeamId) return

    await supabase.from('actions').insert({
      team_id: selectedTeamId,
      action_type: 'buy',
      property_id: currentProperty.id,
      status: 'pending',
    })

    setCurrentProperty(null)
    setShowTask(false)
  }

  const handleSkip = () => {
    setCurrentProperty(null)
    setShowTask(false)
    setTaskCompleted(false)
  }

  const handleCompleteTask = async () => {
    setTaskCompleted(true)
    setShowTask(false)
  }

  const handleIgnoreTask = () => {
    setShowTask(false)
  }

  const handleTaskBuy = async () => {
    if (!currentProperty || !selectedTeamId) return

    await supabase.from('actions').insert({
      team_id: selectedTeamId,
      action_type: 'task_buy',
      property_id: currentProperty.id,
      status: 'pending',
    })

    setCurrentProperty(null)
    setTaskCompleted(false)
  }

  const handleKeepReward = async () => {
    if (!selectedTeamId) return

    await supabase.from('actions').insert({
      team_id: selectedTeamId,
      action_type: 'task_only',
      property_id: null,
      status: 'pending',
    })

    setCurrentProperty(null)
    setTaskCompleted(false)
  }

  return (
    <div className="h-full flex flex-col">
      <h2 className="text-lg font-semibold text-slate-100 mb-4">Game Control</h2>
      
      <div className="space-y-6">
        {/* Move Team Section */}
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
          <h3 className="text-sm font-medium text-slate-300 mb-3">Move Team</h3>
          
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1.5">Select Team</label>
              <select
                value={selectedTeamId}
                onChange={(e) => setSelectedTeamId(e.target.value)}
                className="w-full bg-slate-700/50 border border-slate-600 rounded-md px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                <option value="">Choose a team...</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-xs text-slate-500 mb-1.5">Dice Roll (1-12)</label>
              <input
                type="number"
                min="1"
                max="12"
                value={diceValue}
                onChange={(e) => setDiceValue(e.target.value)}
                placeholder="Enter dice value"
                className="w-full bg-slate-700/50 border border-slate-600 rounded-md px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
            
            <button
              onClick={handleMove}
              disabled={!selectedTeamId || !diceValue || isMoving}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-md transition-colors text-sm"
            >
              {isMoving ? 'Moving...' : 'Move'}
            </button>
          </div>
        </div>

        {/* Current Tile Display */}
        {currentTile && (
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
            <h3 className="text-sm font-medium text-slate-300 mb-2">Current Tile</h3>
            <p className="text-slate-100">
              <span className="font-medium">{currentTile.teamName}</span>
              <span className="text-slate-400"> landed on </span>
              <span className="font-medium text-blue-400">{currentTile.tileName}</span>
            </p>
          </div>
        )}

        {/* Property Interaction */}
        {currentProperty && !taskCompleted && (
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
            <h3 className="text-sm font-medium text-slate-300 mb-3">Property Available</h3>
            
            <div className="mb-4">
              <p className="text-slate-100 font-medium">{currentProperty.name}</p>
              <p className="text-emerald-400 font-semibold">{formatCurrency(currentProperty.price)}</p>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={handleBuy}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-4 rounded-md transition-colors text-sm"
              >
                Buy
              </button>
              <button
                onClick={handleSkip}
                className="flex-1 bg-slate-600 hover:bg-slate-500 text-white font-medium py-2 px-4 rounded-md transition-colors text-sm"
              >
                Skip
              </button>
            </div>
            
            {!showTask && (
              <div className="mt-4 pt-4 border-t border-slate-700">
                <button
                  onClick={() => setShowTask(true)}
                  className="w-full text-sm text-slate-400 hover:text-slate-300 transition-colors"
                >
                  Need extra cash? Take a task
                </button>
              </div>
            )}
          </div>
        )}

        {/* Task Section */}
        {showTask && (
          <div className="bg-amber-900/20 rounded-lg p-4 border border-amber-700/30">
            <h3 className="text-sm font-medium text-amber-400 mb-3">Task Challenge</h3>
            <p className="text-slate-300 text-sm mb-4">
              Complete a task to earn extra cash or get a discount on this property.
            </p>
            
            <div className="flex gap-2">
              <button
                onClick={handleCompleteTask}
                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-medium py-2 px-4 rounded-md transition-colors text-sm"
              >
                Complete Task
              </button>
              <button
                onClick={handleIgnoreTask}
                className="flex-1 bg-slate-600 hover:bg-slate-500 text-white font-medium py-2 px-4 rounded-md transition-colors text-sm"
              >
                Ignore
              </button>
            </div>
          </div>
        )}

        {/* Post-Task Options */}
        {taskCompleted && currentProperty && (
          <div className="bg-emerald-900/20 rounded-lg p-4 border border-emerald-700/30">
            <h3 className="text-sm font-medium text-emerald-400 mb-3">Task Completed!</h3>
            <p className="text-slate-300 text-sm mb-4">
              Choose how to use your reward:
            </p>
            
            <div className="flex gap-2">
              <button
                onClick={handleTaskBuy}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-4 rounded-md transition-colors text-sm"
              >
                Buy Property
              </button>
              <button
                onClick={handleKeepReward}
                className="flex-1 bg-slate-600 hover:bg-slate-500 text-white font-medium py-2 px-4 rounded-md transition-colors text-sm"
              >
                Keep Reward
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
