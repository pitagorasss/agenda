export interface Contract {
  id: string
  name: string
  invoice_email: string | null
  renewal_period: '6months' | '1year' | 'custom'
  start_date: string
  next_due_date: string
  status: 'active' | 'expired'
  custom_period_days: number | null
  created_by: string
  created_at: string
  categories?: ContractCategory[]
}

export interface ContractCategory {
  id: string
  contract_id: string
  name: string
  created_at: string
  products?: ContractProduct[]
}

export interface ContractProduct {
  id: string
  contract_category_id: string
  name: string
  quantity: number
  quantity_sold: number
  invoice_url: string | null
  created_at: string
}

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
  created_at: string
}

export interface Profile {
  id: string
  email: string
  name?: string
  role?: 'admin' | 'user'
}
