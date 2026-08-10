import { useState } from 'react'
import { useAgendaStore } from '@/stores/agendaStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Pencil, Trash2 } from 'lucide-react'

const colorOptions = ['#16A34A', '#2563EB', '#DC2626', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316']

export function CategoryManager() {
  const { categories, createCategory, updateCategory, deleteCategory } = useAgendaStore()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [color, setColor] = useState('#16A34A')

  const resetForm = () => {
    setName('')
    setColor('#16A34A')
    setEditingId(null)
  }

  const handleEdit = (cat: typeof categories[0]) => {
    setEditingId(cat.id)
    setName(cat.name)
    setColor(cat.color)
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    if (editingId) {
      await updateCategory(editingId, { name, color })
    } else {
      await createCategory({ name, color })
    }
    resetForm()
    setShowForm(false)
  }

  return (
    <div className="space-y-3">
      <Dialog open={showForm} onOpenChange={(v) => { setShowForm(v); if (!v) resetForm() }}>
        <DialogTrigger asChild>
          <Button size="sm"><Plus className="h-3 w-3" /> Nova Categoria</Button>
        </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? 'Editar' : 'Nova'} Categoria</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Cor</Label>
                <div className="flex flex-wrap gap-2">
                  {colorOptions.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`h-8 w-8 rounded-full border-2 ${color === c ? 'border-foreground' : 'border-transparent'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => { setShowForm(false); resetForm() }}>Cancelar</Button>
                <Button type="submit">{editingId ? 'Salvar' : 'Criar'}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

      {categories.length === 0 && (
        <p className="text-sm text-muted-foreground">Nenhuma categoria criada.</p>
      )}

      <div className="space-y-2">
        {categories.map((cat) => (
          <div key={cat.id} className="flex items-center justify-between rounded-lg border p-2.5">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: cat.color }} />
              <span className="text-sm">{cat.name}</span>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleEdit(cat)}>
                <Pencil className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteCategory(cat.id)}>
                <Trash2 className="h-3 w-3 text-red-500" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
