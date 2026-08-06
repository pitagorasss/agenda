import { useState, useEffect } from 'react'
import { useAgendaStore } from '@/stores/agendaStore'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const colorPalette = ['#DC2626', '#2563EB', '#16A34A', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#6B7280', '#EF4444']

interface Props {
  date: string
  editingId?: string | null
  onDone: () => void
}

export function TaskForm({ date, editingId, onDone }: Props) {
  const { categories, tasks, createTask, updateTask, findOrCreateCategory, fetchUsers, users } = useAgendaStore()
  const user = useAuthStore((s) => s.user)
  const existing = editingId ? tasks.find((t) => t.id === editingId) : null

  const [title, setTitle] = useState(existing?.title ?? '')
  const [description, setDescription] = useState(existing?.description ?? '')
  const [time, setTime] = useState(existing?.time ?? '')
  const [assignedTo, setAssignedTo] = useState(existing?.assigned_to ?? '')
  const [categoryInput, setCategoryInput] = useState(existing?.category?.name ?? '')
  const [selectedColor, setSelectedColor] = useState(existing?.category?.color ?? '#2563EB')

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    let categoryId = existing?.category_id ?? null

    if (categoryInput.trim()) {
      const found = categories.find(
        (c) => c.name.toLowerCase() === categoryInput.trim().toLowerCase()
      )
      if (found) {
        categoryId = found.id
      } else {
        const newId = await findOrCreateCategory(categoryInput.trim(), selectedColor)
        if (newId) categoryId = newId
      }
    }

    const taskData = {
      title,
      description: description || null,
      time: time || null,
      category_id: categoryId,
      assigned_to: assignedTo || null,
      date,
      created_by: user?.id,
    }

    if (editingId) {
      await updateTask(editingId, taskData)
    } else {
      await createTask(taskData)
    }
    onDone()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border p-4">
      <div className="space-y-1">
        <Label>Título</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="O que vai ser feito?" required />
      </div>
      <div className="space-y-1">
        <Label>Descrição da atividade</Label>
        <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="O que a pessoa vai fazer" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Horário</Label>
          <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Pessoa Responsável</Label>
          <Select value={assignedTo} onValueChange={setAssignedTo}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              {users.map((u) => (
                <SelectItem key={u.id} value={u.id}>{u.email}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1">
        <Label>Categoria</Label>
        <Input
          value={categoryInput}
          onChange={(e) => setCategoryInput(e.target.value)}
          placeholder="Digite o nome da categoria (ex: Reunião)"
          list="category-suggestions"
        />
        <datalist id="category-suggestions">
          {categories.map((c) => (
            <option key={c.id} value={c.name} />
          ))}
        </datalist>
      </div>
      {categoryInput.trim() && (
        <div className="space-y-1">
          <Label>Cor da categoria</Label>
          <div className="flex flex-wrap gap-2">
            {colorPalette.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setSelectedColor(color)}
                className={`h-7 w-7 rounded-full border-2 transition-transform hover:scale-110 ${
                  selectedColor === color ? 'border-foreground scale-110' : 'border-transparent'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>
      )}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onDone}>Cancelar</Button>
        <Button type="submit" className="bg-brand-green hover:bg-green-600">
          {editingId ? 'Salvar' : 'Adicionar'}
        </Button>
      </div>
    </form>
  )
}
