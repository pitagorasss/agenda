// Definições de tipos TypeScript que representam as entidades da aplicação.
// Espelham as tabelas do banco Supabase.

// Categoria de tarefa (agrupamento com nome e cor).
export interface TaskCategory {
  id: string
  name: string
  color: string // Cor associada à categoria.
  created_by: string // Id do usuário que criou.
  created_at: string
}

// Tarefa do calendário/agenda.
export interface Task {
  id: string
  title: string // Título da tarefa.
  description: string | null // Descrição opcional.
  date: string // Data da tarefa (YYYY-MM-DD).
  time: string | null // Hora opcional (HH:MM).
  category_id: string | null // Id da categoria (opcional).
  category?: TaskCategory | null // Categoria carregada via relacionamento.
  assigned_to: string | null // Id do usuário responsável.
  created_by: string // Id de quem criou.
  status?: 'pending' | 'forecast' | 'completed' | null // Estado: pendente, adiada ou concluída.
  priority?: 'baixa' | 'media' | 'alta' // Nível de prioridade.
  observation?: string | null // Observação da tarefa.
  forecast_date?: string | null // Nova data prevista (quando adiada).
  forecast_time?: string | null // Nova hora prevista.
  forecast_observation?: string | null // Observação do adiamento.
  completed_at?: string | null // Data/hora da conclusão.
  completed_by?: string | null // Id de quem concluiu.
  deleted_at?: string | null // Soft delete: null se não excluída.
  created_at: string
}

// Perfil de usuário (dados públicos do usuário autenticado).
export interface Profile {
  id: string
  email: string
  name?: string // Nome opcional.
  created_at?: string
}

// Slot da rotina (bloco de horário fixo na semana).
export interface RoutineSlot {
  id: string
  user_id: string // Dono do slot.
  weekday: number // Dia da semana (0-6, onde 0 = domingo; segue Date.getDay() e a ordem de WEEKDAYS em constants.ts).
  start_time: string // Horário de início (HH:MM).
  end_time: string // Horário de fim (HH:MM).
  title: string | null // Título opcional do slot.
  created_by: string | null // Id de quem criou.
  created_at: string
}

// Registro de conclusão de um slot de rotina em um dia específico.
export interface RoutineSlotCompletion {
  id: string
  slot_id: string // Slot concluído.
  user_id: string // Usuário dono do slot.
  date: string // Data da conclusão (YYYY-MM-DD).
  created_by: string | null // Id de quem marcou.
  created_at: string
}

// Observação de evolução (feedback sobre desempenho de um usuário).
export interface EvolutionObservation {
  id: string
  type: 'melhoria' | 'desempenho' | 'atencao' // Tipo da observação.
  level: 'urgente' | 'emergente' | 'empurravel' // Nível de prioridade da observação.
  description: string // Texto da observação.
  responsible_id: string | null // Usuário a quem se refere.
  created_by: string // Id de quem criou.
  created_at: string
}

// Notificação interna da aplicação (registrada no banco).
export interface AppNotification {
  id: string
  user_id: string // Destinatário da notificação.
  task_id: string | null // Tarefa relacionada (se houver).
  title: string // Texto da notificação.
  actor_id: string | null // Id de quem gerou a ação.
  read: boolean // Se já foi lida.
  created_at: string
}
