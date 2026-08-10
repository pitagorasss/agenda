import { useEffect, useState } from 'react'
import { useAgendaStore } from '@/stores/agendaStore'
import { useAuthStore } from '@/stores/authStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { motion } from 'framer-motion'
import { Plus, Pencil, Trash2, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const DESCRIPTION_MAX = 500

const typeLabels: Record<string, string> = {
  melhoria: 'Melhoria',
  desempenho: 'Desempenho',
  atencao: 'Atenção',
}

const levelConfig: Record<string, { label: string; className: string }> = {
  urgente: { label: 'Urgente', className: 'bg-red-500 text-white' },
  emergente: { label: 'Emergente', className: 'bg-amber-500 text-white' },
  empurravel: { label: 'Empurrável', className: 'bg-gray-400 text-white' },
}

export function Evolution() {
  const { evolutions, fetchEvolutions, createEvolution, updateEvolution, deleteEvolution, fetchUsers, users, loading } =
    useAgendaStore()
  const user = useAuthStore((s) => s.user)

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [type, setType] = useState('melhoria')
  const [level, setLevel] = useState('emergente')
  const [description, setDescription] = useState('')
  const [responsibleId, setResponsibleId] = useState('')

  const [filterResponsible, setFilterResponsible] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterLevel, setFilterLevel] = useState('')

  const currentRole = users.find((u) => u.id === user?.id)?.role ?? 'user'
  const canSeeAll = currentRole === 'admin' || currentRole === 'analista'

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  useEffect(() => {
    fetchEvolutions()
  }, [fetchEvolutions])

  const getUserName = (id: string) => users.find((u) => u.id === id)?.email ?? '—'
  const formatDate = (d: string) => {
    const date = new Date(d)
    if (Number.isNaN(date.getTime())) return '—'
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
  }

  const canModify = (item: { id: string; created_by: string }) =>
    item.created_by === user?.id || currentRole === 'admin'

  const resetForm = () => {
    setType('melhoria')
    setLevel('emergente')
    setDescription('')
    setResponsibleId('')
    setEditingId(null)
  }

  const openEdit = (item: typeof evolutions[0]) => {
    setEditingId(item.id)
    setType(item.type)
    setLevel(item.level)
    setDescription(item.description)
    setResponsibleId(item.responsible_id ?? '')
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!description.trim()) return
    const data = {
      type: type as 'melhoria' | 'desempenho' | 'atencao',
      level: level as 'urgente' | 'emergente' | 'empurravel',
      description: description.trim(),
      responsible_id: responsibleId || null,
    }
    let ok = false
    if (editingId) {
      ok = await updateEvolution(editingId, data)
    } else {
      const created = await createEvolution(data)
      ok = !!created
    }
    if (ok) {
      resetForm()
      setShowForm(false)
    }
  }

  const handleDelete = async (id: string) => {
    await deleteEvolution(id)
  }

  const applyFilters = () => {
    fetchEvolutions({
      responsibleId: filterResponsible || undefined,
      type: filterType || undefined,
      level: filterLevel || undefined,
    })
  }

  const resetFilters = () => {
    setFilterResponsible('')
    setFilterType('')
    setFilterLevel('')
    fetchEvolutions()
  }

  const visibleEvolutions = canSeeAll ? evolutions : evolutions.filter((e) => e.responsible_id === user?.id)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Espaço de Evolução</h1>
          <p className="text-muted-foreground">Observações de melhorias, desempenho e atenção</p>
        </div>
        <Button onClick={() => { setShowForm(!showForm); if (showForm) resetForm() }}>
          <Plus className="h-4 w-4" /> Nova Observação
        </Button>
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{editingId ? 'Editar' : 'Nova'} Observação</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="space-y-1">
                    <Label>Tipo</Label>
                    <Select value={type} onValueChange={setType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="melhoria">Melhoria</SelectItem>
                        <SelectItem value="desempenho">Desempenho</SelectItem>
                        <SelectItem value="atencao">Atenção</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Nível</Label>
                    <Select value={level} onValueChange={setLevel}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="urgente">Urgente</SelectItem>
                        <SelectItem value="emergente">Emergente</SelectItem>
                        <SelectItem value="empurravel">Empurrável com a barriga</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Responsável</Label>
                    <Select value={responsibleId} onValueChange={setResponsibleId}>
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
                  <div className="flex items-center justify-between">
                    <Label>Observação</Label>
                    <span className={`text-xs ${description.length >= DESCRIPTION_MAX ? 'text-red-500' : 'text-muted-foreground'}`}>
                      {description.length}/{DESCRIPTION_MAX}
                    </span>
                  </div>
                  <Textarea
                    value={description}
                    onChange={(e) => {
                      if (e.target.value.length <= DESCRIPTION_MAX) setDescription(e.target.value)
                    }}
                    placeholder="Descreva a observação de evolução..."
                    autoGrow
                    required
                    maxLength={DESCRIPTION_MAX}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => { setShowForm(false); resetForm() }}>
                    Cancelar
                  </Button>
                  <Button type="submit">{editingId ? 'Salvar' : 'Registrar'}</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-4">
            <div className="space-y-1">
              <Label>Responsável</Label>
              <Select value={filterResponsible} onValueChange={setFilterResponsible}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Tipo</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="melhoria">Melhoria</SelectItem>
                  <SelectItem value="desempenho">Desempenho</SelectItem>
                  <SelectItem value="atencao">Atenção</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Nível</Label>
              <Select value={filterLevel} onValueChange={setFilterLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="urgente">Urgente</SelectItem>
                  <SelectItem value="emergente">Emergente</SelectItem>
                  <SelectItem value="empurravel">Empurrável</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={applyFilters}>Filtrar</Button>
              <Button variant="outline" onClick={resetFilters}>Limpar</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Observações ({visibleEvolutions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : visibleEvolutions.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Nenhuma observação registrada.</p>
          ) : (
            <div className="divide-y">
              {visibleEvolutions.map((item, idx) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.02, duration: 0.2 }}
                  className="py-3"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full font-medium', levelConfig[item.level]?.className)}>
                      {levelConfig[item.level]?.label}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-brand-blue/10 text-brand-blue font-medium">
                      {typeLabels[item.type]}
                    </span>
                    <span className="text-sm font-medium">{item.description}</span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1 text-xs text-muted-foreground">
                    <span>Registrado em: {formatDate(item.created_at)}</span>
                    {item.responsible_id && (
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" /> Responsável: {getUserName(item.responsible_id)}
                      </span>
                    )}
                    <span>Autor: {getUserName(item.created_by)}</span>
                  </div>
                  {canModify(item) && (
                    <div className="flex gap-1 mt-1.5">
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEdit(item)}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDelete(item.id)}>
                        <Trash2 className="h-3 w-3 text-red-500" />
                      </Button>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}