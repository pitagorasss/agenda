// Store principal (Zustand) da aplicação: gerencia categorias, tarefas, usuários,
// evoluções, rotina e todas as operações de leitura/escrita no Supabase.
import { create } from 'zustand'
import { supabase } from '@/lib/supabase' // Cliente do banco.
import { toast } from 'sonner' // Notificações visuais.
import { format } from 'date-fns' // Utilitários de data.
import { TASK_SELECT } from '@/lib/constants' // Seleção padrão de colunas de tarefa.
import { useAuthStore } from '@/stores/authStore' // Acessa o usuário logado.
import type { TaskCategory, Task, Profile, EvolutionObservation, RoutineSlot, RoutineSlotCompletion } from '@/types'

// Filtros opcionais para listar evoluções.
interface EvolutionFilters {
  responsibleId?: string
  type?: string
  level?: string
}

// Contadores de sequência para evitar que respostas antigas (fora de ordem)
// sobrescrevam requisições mais recentes em cada lista de tarefas.
let tasksSeq = 0
let userTasksSeq = 0
let reportedTasksSeq = 0

// Nomes das listas de tarefas que devem ser atualizadas em conjunto.
type TaskArrays = 'tasks' | 'userTasks' | 'weekTasks' | 'reportTasks'

// Estrutura do estado global da agenda e suas ações.
interface AgendaState {
  categories: TaskCategory[] // Lista de categorias.
  tasks: Task[] // Tarefas do mês (agenda).
  userTasks: Task[] // Tarefas de um usuário específico.
  weekTasks: Task[] // Tarefas de um intervalo (semana).
  reportTasks: Task[] // Tarefas usadas nos relatórios.
  overdueTasks: Task[] // Tarefas pendentes em atraso.
  evolutions: EvolutionObservation[] // Observações de evolução.
  loadingCount: number // Contador de requisições em andamento.
  users: Profile[] // Lista de perfis/usuários.
  routineSlots: RoutineSlot[] // Slots de rotina.
  routineCompletions: RoutineSlotCompletion[] // Conclusões de rotina.
  // Ações de categorias:
  fetchCategories: () => Promise<void>
  findOrCreateCategory: (name: string, color: string) => Promise<string | null>
  createCategory: (data: Partial<TaskCategory>) => Promise<TaskCategory | null>
  updateCategory: (id: string, data: Partial<TaskCategory>) => Promise<void>
  deleteCategory: (id: string) => Promise<void>
  // Ações de tarefas:
  fetchTasksByMonth: (year: number, month: number) => Promise<void>
  fetchTasksBetween: (from: string, to: string) => Promise<void>
  fetchUserTasks: (userId: string) => Promise<void>
  fetchReportedTasks: (filters: { from?: string; to?: string; userId?: string; status?: string }) => Promise<void>
  createTask: (data: Partial<Task>) => Promise<Task | null>
  updateTask: (id: string, data: Partial<Task>) => Promise<void>
  deleteTask: (id: string) => Promise<void>
  markTaskCompleted: (id: string, observation?: string) => Promise<boolean>
  markTaskPending: (id: string, observation?: string) => Promise<boolean>
  markTaskForecast: (
    id: string,
    data: { forecast_date: string; forecast_time?: string | null; forecast_observation?: string | null }
  ) => Promise<boolean>
  // Ações de evolução:
  fetchEvolutions: (filters?: EvolutionFilters) => Promise<void>
  createEvolution: (data: Partial<EvolutionObservation>) => Promise<EvolutionObservation | null>
  updateEvolution: (id: string, data: Partial<EvolutionObservation>) => Promise<boolean>
  deleteEvolution: (id: string) => Promise<boolean>
  // Ações de usuários e rotina:
  fetchUsers: () => Promise<void>
  fetchRoutineSlots: (userId?: string) => Promise<void>
  createRoutineSlot: (data: Partial<RoutineSlot>) => Promise<RoutineSlot | null>
  updateRoutineSlot: (id: string, data: Partial<RoutineSlot>) => Promise<void>
  deleteRoutineSlot: (id: string) => Promise<void>
  copyRoutineSlots: (fromWeekday: number, toWeekdays: number[], userId: string) => Promise<void>
  fetchRoutineCompletions: (userId?: string) => Promise<void>
  toggleRoutineCompletion: (slotId: string, userId: string, date: string) => Promise<void>
}

// Lista de arrays de tarefas que sofrem as mesmas alterações em conjunto.
const taskArrays: TaskArrays[] = ['tasks', 'userTasks', 'weekTasks', 'reportTasks']

// Fábrica de atualizador: cria um "set" que aplica uma transformação (updater)
// à tarefa com o id informado em todas as listas de tarefas.
const updaterFor =
  (id: string, updater: (t: Task) => Task) =>
  (prev: AgendaState): Partial<AgendaState> => {
    const next: Partial<AgendaState> = {}
    for (const key of taskArrays) {
      next[key] = prev[key].map((t) => (t.id === id ? updater(t) : t))
    }
    return next
  }

// Fábrica de removedor: cria um "set" que remove a tarefa com o id em todas as listas.
const removerFor = (id: string) => (prev: AgendaState): Partial<AgendaState> => {
  const next: Partial<AgendaState> = {}
  for (const key of taskArrays) {
    next[key] = prev[key].filter((t) => t.id !== id)
  }
  return next
}

export const useAgendaStore = create<AgendaState>((set) => ({
  // Estado inicial (todos vazios/zerados).
  categories: [],
  tasks: [],
  userTasks: [],
  weekTasks: [],
  reportTasks: [],
  overdueTasks: [],
  evolutions: [],
  users: [],
  loadingCount: 0,
  routineSlots: [],
  routineCompletions: [],

  // Busca todas as categorias (tabela "task_categories"), ordenadas por nome.
  fetchCategories: async () => {
    const { data, error } = await supabase.from('task_categories').select('*').order('name')
    if (!error && data) set({ categories: data })
  },

  // Retorna o id de uma categoria existente (buscando pelo nome, sem diferenciar
  // maiúsculas/minúsculas) ou cria uma nova e retorna o id dela.
  findOrCreateCategory: async (name, color) => {
    const existing = await supabase
      .from('task_categories')
      .select('id')
      .ilike('name', name.trim())
      .maybeSingle()
    if (existing.data) return existing.data.id // Já existe: retorna o id.
    // Não existe: insere uma nova categoria.
    const { data, error } = await supabase
      .from('task_categories')
      .insert({ name: name.trim(), color })
      .select('id')
      .single()
    if (error) {
      toast.error(error.message)
      return null
    }
    if (data) {
      // Adiciona a nova categoria ao estado local, com placeholders vazios
      // para created_by/created_at (a query acima seleciona apenas "id").
      set((s) => ({ categories: [...s.categories, { id: data.id, name: name.trim(), color, created_by: '', created_at: '' }] }))
      return data.id
    }
    return null
  },

  // Cria uma nova categoria no banco e a adiciona ao estado.
  createCategory: async (data) => {
    const { data: result, error } = await supabase.from('task_categories').insert(data).select().single()
    if (error) {
      toast.error(error.message)
      return null
    }
    set((s) => ({ categories: [...s.categories, result] }))
    return result
  },

  // Atualiza uma categoria e sincroniza o estado local.
  updateCategory: async (id, data) => {
    const { error } = await supabase.from('task_categories').update(data).eq('id', id)
    if (error) {
      toast.error(error.message)
      return
    }
    set((s) => ({
      categories: s.categories.map((c) => (c.id === id ? { ...c, ...data } : c)),
    }))
  },

  // Exclui uma categoria; tarefas que a usavam ficam sem categoria (category_id = null).
  deleteCategory: async (id) => {
    const { error } = await supabase.from('task_categories').delete().eq('id', id)
    if (error) {
      toast.error(error.message)
      return
    }
    set((s) => {
      const next: Partial<AgendaState> = {}
      // Remove a referência da categoria em todas as tarefas.
      for (const key of taskArrays) {
        next[key] = s[key].map((t) => (t.category_id === id ? { ...t, category_id: null, category: null } : t))
      }
      return {
        categories: s.categories.filter((c) => c.id !== id), // Remove da lista de categorias.
        ...next,
      }
    })
  },

  // Busca as tarefas de um mês específico (para a agenda/calendário).
  fetchTasksByMonth: async (year, month) => {
    set((s) => ({ loadingCount: s.loadingCount + 1 }))
    const seq = ++tasksSeq // Marca esta requisição como a mais recente.
    const start = `${year}-${String(month).padStart(2, '0')}-01` // Primeiro dia do mês.
    const lastDay = new Date(year, month, 0).getDate() // Último dia do mês.
    const end = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
    const { data, error } = await supabase
      .from('tasks')
      .select(TASK_SELECT)
      .gte('date', start) // Data >= início do mês.
      .lte('date', end) // Data <= fim do mês.
      .is('deleted_at', null) // Ignora tarefas com soft delete.
      .order('date')
      .order('time')
    if (!error && data && seq === tasksSeq) set({ tasks: data }) // Aplica só se ainda for a mais recente.
    set((s) => ({ loadingCount: s.loadingCount - 1 }))
  },

  // Busca tarefas dentro de um intervalo de datas (ex.: semana).
  fetchTasksBetween: async (from, to) => {
    set((s) => ({ loadingCount: s.loadingCount + 1 }))
    const seq = ++tasksSeq
    const { data, error } = await supabase
      .from('tasks')
      .select(TASK_SELECT)
      .gte('date', from)
      .lte('date', to)
      .is('deleted_at', null)
      .order('date')
      .order('time')
    if (!error && data && seq === tasksSeq) set({ weekTasks: data })
    set((s) => ({ loadingCount: s.loadingCount - 1 }))
  },

  // Busca as tarefas atribuídas a um usuário e também calcula as atrasadas.
  fetchUserTasks: async (userId) => {
    set((s) => ({ loadingCount: s.loadingCount + 1 }))
    const seq = ++userTasksSeq
    const today = format(new Date(), 'yyyy-MM-dd')
    const { data, error } = await supabase
      .from('tasks')
      .select(TASK_SELECT)
      .eq('assigned_to', userId) // Filtra pelo responsável.
      .is('deleted_at', null)
      .order('date')
      .order('time')
    if (!error && data && seq === userTasksSeq) {
      set({
        userTasks: data,
        // Atrasadas = data no passado e ainda pendentes.
        overdueTasks: data.filter((t) => t.date < today && t.status === 'pending'),
      })
    }
    if (seq === userTasksSeq) set((s) => ({ loadingCount: s.loadingCount - 1 }))
  },

  // Busca tarefas para relatórios com filtros opcionais (responsável, período, status).
  fetchReportedTasks: async ({ from, to, userId, status }) => {
    set((s) => ({ loadingCount: s.loadingCount + 1 }))
    const seq = ++reportedTasksSeq
    let query = supabase
      .from('tasks')
      .select(TASK_SELECT)
      .is('deleted_at', null)
      .order('date')
      .order('time')
    if (userId) query = query.eq('assigned_to', userId) // Filtra por responsável.
    if (from) query = query.gte('date', from) // Filtra por data inicial.
    if (to) query = query.lte('date', to) // Filtra por data final.
    if (status) query = query.eq('status', status) // Filtra por status.
    const { data, error } = await query
    if (!error && data && seq === reportedTasksSeq) set({ reportTasks: data })
    if (seq === reportedTasksSeq) set((s) => ({ loadingCount: s.loadingCount - 1 }))
  },

  // Cria uma nova tarefa no banco e a adiciona à lista "tasks".
  createTask: async (data) => {
    const { data: result, error } = await supabase
      .from('tasks')
      .insert(data)
      .select(TASK_SELECT)
      .single()
    if (error) {
      toast.error(error.message)
      return null
    }
    set((s) => ({ tasks: [...s.tasks, result] }))
    return result
  },

  // Atualiza uma tarefa e sincroniza todas as listas que a contêm.
  updateTask: async (id, data) => {
    const { data: updated, error } = await supabase
      .from('tasks')
      .update(data)
      .eq('id', id)
      .select(TASK_SELECT)
      .single()
    if (error) {
      toast.error(error.message)
      return
    }
    set((s) => ({
      ...updaterFor(id, () => updated)(s), // Atualiza nas listas principais.
      overdueTasks: s.overdueTasks.map((t) => (t.id === id ? updated : t)),
    }))
  },

  // Exclui (hard delete) uma tarefa e a remove de todas as listas.
  deleteTask: async (id) => {
    const { error } = await supabase.from('tasks').delete().eq('id', id)
    if (error) {
      toast.error(error.message)
      return
    }
    set((s) => ({
      ...removerFor(id)(s),
      overdueTasks: s.overdueTasks.filter((t) => t.id !== id),
    }))
  },

  // Marca uma tarefa como concluída, registrando quem e quando, e limpa os dados de adiamento.
  markTaskCompleted: async (id, observation) => {
    const userId = useAuthStore.getState().user?.id // Usuário que está concluindo.
    const { data: updated, error } = await supabase
      .from('tasks')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        completed_by: userId ?? null,
        observation: observation || null,
        forecast_date: null,
        forecast_time: null,
        forecast_observation: null,
      })
      .eq('id', id)
      .select(TASK_SELECT)
      .single()
    if (error) {
      toast.error(error.message)
      return false
    }
    if (!updated) return false
    set((s) => ({
      ...updaterFor(id, () => updated)(s),
      overdueTasks: s.overdueTasks.filter((t) => t.id !== id), // Sai da lista de atrasadas.
    }))
    return true
  },

  // Marca uma tarefa como pendente (reabre), limpando conclusão e adiamento.
  markTaskPending: async (id, observation) => {
    const { data: updated, error } = await supabase
      .from('tasks')
      .update({
        status: 'pending',
        completed_at: null,
        completed_by: null,
        observation: observation || null,
        forecast_date: null,
        forecast_time: null,
        forecast_observation: null,
      })
      .eq('id', id)
      .select(TASK_SELECT)
      .single()
    if (error) {
      toast.error(error.message)
      return false
    }
    if (!updated) return false
    const today = format(new Date(), 'yyyy-MM-dd')
    const isPast = updated.date < today // Verifica se a data já passou (atrasada).
    set((s) => {
      const inOverdue = s.overdueTasks.some((t) => t.id === id)
      return {
        ...updaterFor(id, () => updated)(s),
        // Se a data passou, garante que esteja na lista de atrasadas; senão, a remove.
        overdueTasks: isPast
          ? inOverdue
            ? s.overdueTasks.map((t) => (t.id === id ? updated : t))
            : [...s.overdueTasks, updated]
          : s.overdueTasks.filter((t) => t.id !== id),
      }
    })
    return true
  },

  // Marca uma tarefa como adiada (forecast), definindo nova data/hora prevista.
  markTaskForecast: async (id, { forecast_date, forecast_time, forecast_observation }) => {
    const { data: updated, error } = await supabase
      .from('tasks')
      .update({
        status: 'forecast',
        forecast_date,
        forecast_time: forecast_time || null,
        forecast_observation: forecast_observation || null,
        completed_at: null,
        completed_by: null,
      })
      .eq('id', id)
      .select(TASK_SELECT)
      .single()
    if (error) {
      toast.error(error.message)
      return false
    }
    if (!updated) return false
    set((s) => ({
      ...updaterFor(id, () => updated)(s),
      overdueTasks: s.overdueTasks.map((t) => (t.id === id ? updated : t)),
    }))
    return true
  },

  // Busca as observações de evolução (tabela "evolution_observations"), com filtros opcionais.
  fetchEvolutions: async ({ responsibleId, type, level } = {}) => {
    set((s) => ({ loadingCount: s.loadingCount + 1 }))
    let query = supabase.from('evolution_observations').select('*').order('created_at', { ascending: false })
    if (responsibleId) query = query.eq('responsible_id', responsibleId)
    if (type) query = query.eq('type', type)
    if (level) query = query.eq('level', level)
    const { data, error } = await query
    if (!error && data) set({ evolutions: data })
    set((s) => ({ loadingCount: s.loadingCount - 1 }))
  },

  // Cria uma observação de evolução, vinculando o autor (usuário logado).
  createEvolution: async (data) => {
    const userId = useAuthStore.getState().user?.id
    const { data: result, error } = await supabase
      .from('evolution_observations')
      .insert({ ...data, created_by: userId })
      .select()
      .single()
    if (error) {
      toast.error(error.message)
      return null
    }
    set((s) => ({ evolutions: [result, ...s.evolutions] })) // Adiciona no início (mais recente).
    return result
  },

  // Atualiza uma observação de evolução.
  updateEvolution: async (id, data) => {
    const { error } = await supabase.from('evolution_observations').update(data).eq('id', id)
    if (error) {
      toast.error(error.message)
      return false
    }
    set((s) => ({
      evolutions: s.evolutions.map((e) => (e.id === id ? { ...e, ...data } : e)),
    }))
    return true
  },

  // Exclui uma observação de evolução.
  deleteEvolution: async (id) => {
    const { error } = await supabase.from('evolution_observations').delete().eq('id', id)
    if (error) {
      toast.error(error.message)
      return false
    }
    set((s) => ({ evolutions: s.evolutions.filter((e) => e.id !== id) }))
    return true
  },

  // Busca a lista de usuários (tabela "profiles").
  fetchUsers: async () => {
    const { data, error } = await supabase.from('profiles').select('id, email, name, created_at').order('email')
    if (!error && data) set({ users: data })
  },

  // Busca os slots de rotina, opcionalmente de um usuário específico.
  fetchRoutineSlots: async (userId) => {
    let query = supabase.from('routine_slots').select('*').order('weekday').order('start_time')
    if (userId) query = query.eq('user_id', userId)
    const { data, error } = await query
    if (!error && data) set({ routineSlots: data })
  },

  // Cria um slot de rotina, registrando quem o criou.
  createRoutineSlot: async (data) => {
    const userId = useAuthStore.getState().user?.id
    const { data: result, error } = await supabase
      .from('routine_slots')
      .insert({ ...data, created_by: userId ?? data.created_by })
      .select()
      .single()
    if (error) {
      toast.error(error.message)
      return null
    }
    set((s) => ({ routineSlots: [...s.routineSlots, result] }))
    return result
  },

  // Atualiza um slot de rotina.
  updateRoutineSlot: async (id, data) => {
    const { error } = await supabase.from('routine_slots').update(data).eq('id', id)
    if (error) {
      toast.error(error.message)
      return
    }
    set((s) => ({
      routineSlots: s.routineSlots.map((sl) => (sl.id === id ? { ...sl, ...data } : sl)),
    }))
  },

  // Exclui um slot e também remove as conclusões associadas a ele.
  deleteRoutineSlot: async (id) => {
    const { error } = await supabase.from('routine_slots').delete().eq('id', id)
    if (error) {
      toast.error(error.message)
      return
    }
    set((s) => ({
      routineSlots: s.routineSlots.filter((sl) => sl.id !== id),
      routineCompletions: s.routineCompletions.filter((c) => c.slot_id !== id),
    }))
  },

  // Espelha os blocos de rotina de um dia da semana para outros dias,
  // evitando duplicar blocos que já existam com o mesmo horário no destino.
  copyRoutineSlots: async (fromWeekday, toWeekdays, userId) => {
    const currentUserId = useAuthStore.getState().user?.id
    const targets = toWeekdays.filter((w) => w !== fromWeekday) // Ignora o dia de origem.
    if (targets.length === 0) return
    const source = useAgendaStore.getState().routineSlots.filter(
      (s) => s.user_id === userId && s.weekday === fromWeekday,
    )
    if (source.length === 0) {
      toast.info('O dia de origem não possui blocos de rotina.')
      return
    }
    // Blocos já existentes nos dias de destino (para não duplicar).
    const existing = useAgendaStore.getState().routineSlots.filter(
      (s) => s.user_id === userId && targets.includes(s.weekday),
    )
    const existingKeys = new Set(existing.map((s) => `${s.weekday}|${s.start_time}|${s.end_time}`))
    const inserts: Partial<RoutineSlot>[] = []
    for (const weekday of targets) {
      for (const slot of source) {
        if (existingKeys.has(`${weekday}|${slot.start_time}|${slot.end_time}`)) continue
        inserts.push({
          user_id: userId,
          created_by: currentUserId ?? userId,
          weekday,
          start_time: slot.start_time,
          end_time: slot.end_time,
          title: slot.title,
        })
      }
    }
    if (inserts.length === 0) {
      toast.info('Os dias selecionados já possuem os mesmos blocos.')
      return
    }
    const { data, error } = await supabase.from('routine_slots').insert(inserts).select()
    if (error) {
      toast.error(error.message)
      return
    }
    set((s) => ({ routineSlots: [...s.routineSlots, ...(data ?? [])] }))
    toast.success(`Blocos de rotina espelhados para ${targets.length} dia(s).`)
  },

  // Busca as conclusões de rotina, opcionalmente de um usuário.
  fetchRoutineCompletions: async (userId) => {
    let query = supabase.from('routine_slot_completions').select('*').order('date')
    if (userId) query = query.eq('user_id', userId)
    const { data, error } = await query
    if (!error && data) set({ routineCompletions: data })
  },

  // Alterna a conclusão de um slot de rotina para um usuário numa data:
  // se já existe, remove; senão, cria.
  toggleRoutineCompletion: async (slotId, userId, date) => {
    const currentUserId = useAuthStore.getState().user?.id
    // Verifica se já existe uma conclusão para este slot/data.
    const existing = await supabase
      .from('routine_slot_completions')
      .select('id')
      .eq('slot_id', slotId)
      .eq('date', date)
      .maybeSingle()
    if (existing.data) {
      // Já existe: desmarca (remove).
      const { error } = await supabase.from('routine_slot_completions').delete().eq('id', existing.data.id)
      if (error) {
        toast.error(error.message)
        return
      }
      set((s) => ({ routineCompletions: s.routineCompletions.filter((c) => c.id !== existing.data!.id) }))
      return
    }
    // Não existe: marca (cria) a conclusão.
    const { data: created, error } = await supabase
      .from('routine_slot_completions')
      .insert({ slot_id: slotId, user_id: userId, date, created_by: currentUserId ?? null })
      .select()
      .single()
    if (error) {
      toast.error(error.message)
      return
    }
    set((s) => ({ routineCompletions: [...s.routineCompletions, created] }))
  },
}))