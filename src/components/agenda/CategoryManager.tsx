// Gerenciador de categorias em popup (dialog).
// - Botão "Ver categorias" abre o popup com a lista de categorias.
// - Cada categoria permite edição (lápis) e exclusão (lixeira).
// - "Nova Categoria" abre um dialog de formulário (criar/editar) com nome e cor.

import { useState } from 'react'
import { useAgendaStore } from '@/stores/agendaStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight, Tags } from 'lucide-react'
import { COLOR_PALETTE } from '@/lib/constants'
import { motion, AnimatePresence } from 'framer-motion'

export function CategoryManager() {
  // Dados e ações de categorias vindas do store global
  const { categories, createCategory, updateCategory, deleteCategory } = useAgendaStore()
  // Estado da lista recolhida/expandida dentro do popup
  const [collapsed, setCollapsed] = useState(false)
  // Estado do formulário de criar/editar
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [color, setColor] = useState('#16A34A')

  // Limpa o formulário (usado ao fechar ou após salvar)
  const resetForm = () => {
    setName('')
    setColor('#16A34A')
    setEditingId(null)
  }

  // Preenche o formulário com os dados da categoria para edição
  const handleEdit = (cat: typeof categories[0]) => {
    setEditingId(cat.id)
    setName(cat.name)
    setColor(cat.color)
    setShowForm(true)
  }

  // Salva a categoria (cria se não há edição, senão atualiza)
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
    <>
      {/* Popup principal com a lista de categorias */}
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Tags className="h-3.5 w-3.5" /> Ver categorias
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tags className="h-4 w-4 text-brand-blue" />
              Categorias
            </DialogTitle>
          </DialogHeader>

          {/* Ações do popup: nova categoria + recolher/expandir lista */}
          <div className="flex items-center justify-between">
            <Button size="sm" onClick={() => { resetForm(); setShowForm(true) }}>
              <Plus className="h-3 w-3" /> Nova Categoria
            </Button>
            <button
              type="button"
              onClick={() => setCollapsed((c) => !c)}
              className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              {collapsed ? 'Expandir' : 'Recolher'}
            </button>
          </div>

          {/* Lista de categorias com animação de expandir/recolher */}
          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.div
                key="categories"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-2 overflow-hidden"
              >
                {categories.length === 0 && (
                  <p className="text-sm text-muted-foreground py-2 text-center">Nenhuma categoria criada.</p>
                )}
                {categories.map((cat) => (
                  <div key={cat.id} className="flex items-center justify-between rounded-lg border p-2.5">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: cat.color }} />
                      <span className="text-sm">{cat.name}</span>
                    </div>
                    {/* Ações por categoria: editar e excluir */}
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
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>

      {/* Dialog do formulário (criar ou editar categoria) */}
      <Dialog open={showForm} onOpenChange={(v) => { setShowForm(v); if (!v) resetForm() }}>
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
              {/* Seletor de cor (bolinhas) usando a paleta global */}
              <div className="flex flex-wrap gap-2">
                {COLOR_PALETTE.map((c) => (
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
    </>
  )
}