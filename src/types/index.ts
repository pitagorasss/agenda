export interface TaskCategory {
  id: string
  name: string
  color: string
  created_by: string
  created_at: string
}

export interface Task {
  id: string
  title: string
  description: string | null
  date: string
  time: string | null
  category_id: string | null
  category?: TaskCategory | null
  assigned_to: string | null
  created_by: string
  status?: 'pending' | 'forecast' | 'completed' | null
  priority?: 'baixa' | 'media' | 'alta'
  observation?: string | null
  forecast_date?: string | null
  forecast_time?: string | null
  forecast_observation?: string | null
  completed_at?: string | null
  completed_by?: string | null
  deleted_at?: string | null
  created_at: string
}

export interface Profile {
  id: string
  email: string
  name?: string
  created_at?: string
}

export interface EvolutionObservation {
  id: string
  type: 'melhoria' | 'desempenho' | 'atencao'
  level: 'urgente' | 'emergente' | 'empurravel'
  description: string
  responsible_id: string | null
  created_by: string
  created_at: string
}
