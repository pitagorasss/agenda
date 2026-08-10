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
  status?: 'pending' | 'completed' | null
  observation?: string | null
  completed_at?: string | null
  completed_by?: string | null
  created_at: string
}

export interface Profile {
  id: string
  email: string
  name?: string
  role?: 'admin' | 'analista' | 'user'
  created_at?: string
}
