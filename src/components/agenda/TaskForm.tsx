// Formulário de criação/edição de tarefas, com campos de título, descrição,
// data, horário, responsável, prioridade e categoria (existente ou nova).
import { useState, useEffect } from 'react'
import { useAgendaStore } from '@/stores/agendaStore' // Ações usadas: createTask, updateTask, findOrCreateCategory, fetchUsers.
import { useAuthStore } from '@/stores/authStore' // Usuário logado.
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RoutineSlotPicker } from '@/components/agenda/RoutineSlotPicker' // Seleção de horário pela rotina.
import { COLOR_PALETTE } from '@/lib/constants' // Cores disponíveis para categorias.
import { parseISO } from 'date-fns'

// Limite de caracteres da descrição.
const DESCRIPTION_MAX = 250

// Nomes dos meses em português para o seletor de mês.
const MONTH_NAMES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

// Props do formulário.
interface Props {
  date: string // Data padrão (YYYY-MM-DD) usada ao criar.
  editingId?: string | null // Id da tarefa em edição (null = criação).
  onDone: () => void // Chamado ao salvar/cancelar.
}

export function TaskForm({ date, editingId, onDone }: Props) {
  // Lê do store: categorias, tarefas e as ações necessárias.
  const { categories, tasks, createTask, updateTask, updateCategory, findOrCreateCategory, fetchUsers, users } = useAgendaStore()
  const user = useAuthStore((s) => s.user) // Usuário logado (vira o created_by).
  const existing = editingId ? tasks.find((t) => t.id === editingId) : null // Tarefa sendo editada.

  // Data inicial: a da tarefa (edição) ou a recebida por prop (criação).
  const initialDate = existing?.date ?? date
  const parsedDate = parseISO(initialDate)

  // Estados dos campos do formulário (inicializados com os valores da tarefa em edição).
  const [title, setTitle] = useState(existing?.title ?? '')
  const [description, setDescription] = useState(existing?.description ?? '')
  const [time, setTime] = useState(existing?.time ?? '')
  const [day, setDay] = useState(parsedDate.getDate()) // Dia selecionado.
  const [month, setMonth] = useState(parsedDate.getMonth()) // Mês selecionado (0-11).
  const [year, setYear] = useState(parsedDate.getFullYear()) // Ano selecionado.
  const [assignedTo, setAssignedTo] = useState(existing?.assigned_to ?? '') // Responsável.
  const [priority, setPriority] = useState<'baixa' | 'media' | 'alta'>(existing?.priority ?? 'media')
  // Modo da categoria: nenhuma, existente ou nova.
  const [categoryMode, setCategoryMode] = useState<'none' | 'existing' | 'new'>(existing?.category_id ? 'existing' : 'none')
  const [selectedCategoryId, setSelectedCategoryId] = useState(existing?.category_id ?? '')
  const [newCategoryName, setNewCategoryName] = useState('') // Nome da nova categoria.
  const [selectedColor, setSelectedColor] = useState(existing?.category?.color ?? '#2563EB') // Cor selecionada.
  const [routinePickerOpen, setRoutinePickerOpen] = useState(false) // Seletor de rotina aberto.

  // Carrega a lista de usuários (responsáveis) ao montar.
  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const daysInMonth = new Date(year, month + 1, 0).getDate() // Dias do mês/ano selecionado.
  const currentYear = new Date().getFullYear()
  const yearOptions = [currentYear - 1, currentYear, currentYear + 1, currentYear + 2] // Anos permitidos.

  // Ao trocar o mês, ajusta o dia máximo caso o dia atual não exista no novo mês.
  const handleMonthChange = (value: string) => {
    const m = Number(value) - 1
    setMonth(m)
    const max = new Date(year, m + 1, 0).getDate()
    if (day > max) setDay(max)
  }

  // Ao trocar o ano, ajusta o dia máximo (ex.: fevereiro em ano bissexto).
  const handleYearChange = (value: string) => {
    const y = Number(value)
    setYear(y)
    const max = new Date(y, month + 1, 0).getDate()
    if (day > max) setDay(max)
  }

  // Controla o modo de categoria conforme a escolha do usuário.
  const handleCategoryChange = (value: string) => {
    if (value === 'none') {
      setCategoryMode('none') // Sem categoria.
      setSelectedCategoryId('')
    } else if (value === '__new__') {
      setCategoryMode('new') // Criar nova.
      setSelectedCategoryId('')
    } else {
      setCategoryMode('existing') // Categoria existente.
      setSelectedCategoryId(value)
      setSelectedColor(categories.find((c) => c.id === value)?.color ?? '#2563EB') // Carrega a cor dela.
    }
  }

  // Ao escolher uma cor para uma categoria existente, salva imediatamente no banco.
  const handleColorSelect = (color: string) => {
    setSelectedColor(color)
    if (categoryMode === 'existing' && selectedCategoryId) {
      updateCategory(selectedCategoryId, { color })
    }
  }

  // Ao escolher o responsável em criação, abre o seletor de horários da rotina dele.
  const handleAssignedChange = (value: string) => {
    setAssignedTo(value)
    if (!editingId && value) {
      setRoutinePickerOpen(true)
    }
  }

  // Chave da data escolhida no formato YYYY-MM-DD.
  const taskDateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`

  // Aplica a data/hora escolhidas no seletor de rotina.
  const handleRoutineSelect = (date: string, time: string) => {
    const d = parseISO(date)
    setDay(d.getDate())
    setMonth(d.getMonth())
    setYear(d.getFullYear())
    setTime(time)
    setRoutinePickerOpen(false)
  }

  // Salva a tarefa (cria ou edita) no Supabase.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return // Título obrigatório.

    let categoryId: string | null = null

    // Define o id da categoria conforme o modo selecionado.
    if (categoryMode === 'existing' && selectedCategoryId) {
      categoryId = selectedCategoryId
    } else if (categoryMode === 'new' && newCategoryName.trim()) {
      // Busca ou cria a categoria e usa o id resultante.
      const newId = await findOrCreateCategory(newCategoryName.trim(), selectedColor)
      if (newId) categoryId = newId
    }

    // Dados enviados à tabela "tasks"; campos opcionais vazios viram null no banco.
    const taskData = {
      title,
      description: description || null,
      time: time || null,
      category_id: categoryId,
      assigned_to: assignedTo || null,
      priority,
      date: taskDateKey,
      created_by: user?.id, // Autor da tarefa.
    }

    if (editingId) {
      await updateTask(editingId, taskData) // Edita a tarefa existente.
    } else {
      await createTask(taskData) // Cria nova tarefa.
    }
    onDone() // Fecha o formulário.
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border p-4">
      <div className="space-y-1">
        <Label>Título</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="O que vai ser feito?" required />
      </div>
      {/* Campo da descrição com contador de caracteres. */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <Label>Descrição da atividade</Label>
          <span className={`text-xs ${description.length >= DESCRIPTION_MAX ? 'text-red-500' : 'text-muted-foreground'}`}>
            {description.length}/{DESCRIPTION_MAX}
          </span>
        </div>
        <Textarea
          value={description}
          onChange={(e) => {
            if (e.target.value.length <= DESCRIPTION_MAX) setDescription(e.target.value)
          }}
          placeholder="O que a pessoa vai fazer"
          autoGrow
          maxLength={DESCRIPTION_MAX}
        />
      </div>
      {/* Seletores de dia, mês e ano. */}
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1">
          <Label>Dia</Label>
          <Select value={String(day)} onValueChange={(v) => setDay(Number(v))}>
            <SelectTrigger>
              <SelectValue placeholder="Dia" />
            </SelectTrigger>
            <SelectContent>
              {/* Gera as opções de 1 até o último dia do mês. */}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => (
                <SelectItem key={d} value={String(d)}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Mês</Label>
          <Select value={String(month + 1)} onValueChange={handleMonthChange}>
            <SelectTrigger>
              <SelectValue placeholder="Mês" />
            </SelectTrigger>
            <SelectContent>
              {MONTH_NAMES.map((m, i) => (
                <SelectItem key={m} value={String(i + 1)}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Ano</Label>
          <Select value={String(year)} onValueChange={handleYearChange}>
            <SelectTrigger>
              <SelectValue placeholder="Ano" />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map((y) => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      {/* Horário, responsável e prioridade. */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <div className="space-y-1">
          <Label>Horário</Label>
          <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Pessoa Responsável</Label>
          <Select value={assignedTo} onValueChange={handleAssignedChange}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              {users.map((u) => (
                <SelectItem key={u.id} value={u.id}>{u.name ?? u.email}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Prioridade</Label>
          <Select value={priority} onValueChange={(v) => setPriority(v as 'baixa' | 'media' | 'alta')}>
            <SelectTrigger>
              <SelectValue placeholder="Prioridade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="baixa">Baixa</SelectItem>
              <SelectItem value="media">Média</SelectItem>
              <SelectItem value="alta">Alta</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      {/* Seletor de categoria: sem categoria, nova ou existente. */}
      <div className="space-y-1">
        <Label>Categoria</Label>
        <Select
          value={categoryMode === 'existing' ? selectedCategoryId : categoryMode === 'new' ? '__new__' : 'none'}
          onValueChange={handleCategoryChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="Sem categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Sem categoria</SelectItem>
            <SelectItem value="__new__">
              <span className="text-brand-blue">+ Criar nova categoria</span>
            </SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Painel para criar nova categoria (nome + cor). */}
      {categoryMode === 'new' && (
        <div className="rounded-lg border bg-muted/30 p-3 space-y-3">
          <div className="space-y-1">
            <Label>Nome da nova categoria</Label>
            <Input
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Ex: Reunião"
              autoFocus
              required
            />
          </div>
          <div className="space-y-1">
            <Label>Cor</Label>
            <div className="flex flex-wrap gap-2">
              {COLOR_PALETTE.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`h-7 w-7 rounded-full border-2 transition-transform hover:scale-110 ${selectedColor === color ? 'border-foreground scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Painel para alterar a cor de uma categoria existente (salva na hora). */}
      {categoryMode === 'existing' && selectedCategoryId && (
        <div className="space-y-1 rounded-lg border bg-muted/30 p-3">
          <Label>Cor da categoria (editar)</Label>
          <div className="flex flex-wrap gap-2">
            {COLOR_PALETTE.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => handleColorSelect(color)}
                className={`h-7 w-7 rounded-full border-2 transition-transform hover:scale-110 ${selectedColor === color ? 'border-foreground scale-110' : 'border-transparent'}`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground">A alteração é salva imediatamente na categoria.</p>
        </div>
      )}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onDone}>Cancelar</Button>
        <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
          {editingId ? 'Salvar' : 'Adicionar'}
        </Button>
      </div>

      {/* Seletor de horários da rotina do responsável (abre ao escolher a pessoa). */}
      <RoutineSlotPicker
        open={routinePickerOpen}
        userId={assignedTo}
        date={taskDateKey}
        onSelect={handleRoutineSelect}
        onSkip={() => setRoutinePickerOpen(false)}
        onClose={() => setRoutinePickerOpen(false)}
      />
    </form>
  )
}
