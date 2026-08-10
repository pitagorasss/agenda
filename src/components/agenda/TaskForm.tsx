import { useState, useEffect } from 'react'
import { useAgendaStore } from '@/stores/agendaStore'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const DESCRIPTION_MAX = 250

const colorPalette = ['#DC2626', '#2563EB', '#16A34A', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#6B7280', '#EF4444']

interface Props {
  date: string
  editingId?: string | null
  onDone: () => void
}

export function TaskForm({ date, editingId, onDone }: Props) {
  const { categories, tasks, createTask, updateTask, updateCategory, findOrCreateCategory, fetchUsers, users } = useAgendaStore()
  const user = useAuthStore((s) => s.user)
  const existing = editingId ? tasks.find((t) => t.id === editingId) : null

  const [title, setTitle] = useState(existing?.title ?? '')
  const [description, setDescription] = useState(existing?.description ?? '')
  const [time, setTime] = useState(existing?.time ?? '')
  const [assignedTo, setAssignedTo] = useState(existing?.assigned_to ?? '')
  const [categoryMode, setCategoryMode] = useState<'none' | 'existing' | 'new'>(existing?.category_id ? 'existing' : 'none')
  const [selectedCategoryId, setSelectedCategoryId] = useState(existing?.category_id ?? '')
  const [newCategoryName, setNewCategoryName] = useState('')
  const [selectedColor, setSelectedColor] = useState(existing?.category?.color ?? '#2563EB')

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleCategoryChange = (value: string) => {
    if (value === 'none') {
      setCategoryMode('none')
      setSelectedCategoryId('')
    } else if (value === '__new__') {
      setCategoryMode('new')
      setSelectedCategoryId('')
    } else {
      setCategoryMode('existing')
      setSelectedCategoryId(value)
      setSelectedColor(categories.find((c) => c.id === value)?.color ?? '#2563EB')
    }
  }

  const handleColorSelect = (color: string) => {
    setSelectedColor(color)
    if (categoryMode === 'existing' && selectedCategoryId) {
      updateCategory(selectedCategoryId, { color })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    let categoryId: string | null = null

    if (categoryMode === 'existing' && selectedCategoryId) {
      categoryId = selectedCategoryId
    } else if (categoryMode === 'new' && newCategoryName.trim()) {
      const newId = await findOrCreateCategory(newCategoryName.trim(), selectedColor)
      if (newId) categoryId = newId
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
              <span className="text-brand-green">+ Criar nova categoria</span>
            </SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

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
              {colorPalette.map((color) => (
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

      {categoryMode === 'existing' && selectedCategoryId && (
        <div className="space-y-1 rounded-lg border bg-muted/30 p-3">
          <Label>Cor da categoria (editar)</Label>
          <div className="flex flex-wrap gap-2">
            {colorPalette.map((color) => (
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
        <Button type="submit" className="bg-brand-green hover:bg-green-600">
          {editingId ? 'Salvar' : 'Adicionar'}
        </Button>
      </div>
    </form>
  )
}
