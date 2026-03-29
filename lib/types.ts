export interface Team {
  id: string
  name: string
  balance: number
  position: number
  match_id: string | null
  is_active: boolean
  created_at: string
}

export interface Property {
  id: string
  name: string
  price: number
  tile_id: string
  owner_team_id: string | null
  created_at: string
}

export interface Action {
  id: string
  team_id: string
  property_id: string | null
  action_type: 'buy' | 'task_buy' | 'task_only'
  status: 'pending' | 'approved' | 'rejected'
  reward_amount?: number
  price_at_time?: number
  created_at: string

  properties?: Property
}

export interface Transaction {
  id: string
  team_id: string
  type: string
  amount: number
  related_property_id: string | null
  created_at: string
}

export interface Jackpot {
  id: boolean
  total_amount: number
  updated_at: string
}

export interface Tile {
  id: string
  position: number
  name: string
  type: 'start' | 'property' | 'tax' | 'jackpot'
  tax_amount: number
}