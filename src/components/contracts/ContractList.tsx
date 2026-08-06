import { useState } from 'react'
import { useContractStore } from '@/stores/contractStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ContractCard } from './ContractCard'
import { Plus, X } from 'lucide-react'
import { format, addMonths, addYears } from 'date-fns'
import { useAuthStore } from '@/stores/authStore'
import { motion, AnimatePresence } from 'framer-motion'

export function ContractList() {
  const { contracts, createContract, fetchContracts } = useContractStore()
  const user = useAuthStore((s) => s.user)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [invoiceEmail, setInvoiceEmail] = useState('')
  const [renewalPeriod, setRenewalPeriod] = useState<'6months' | '1year' | 'custom'>('6months')
  const [customDays, setCustomDays] = useState('30')
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [categories, setCategories] = useState<{ name: string; products: { name: string; quantity: string; quantity_sold: string }[] }[]>([])

  const calculateDueDate = () => {
    const start = new Date(startDate)
    if (renewalPeriod === '6months') return format(addMonths(start, 6), 'yyyy-MM-dd')
    if (renewalPeriod === '1year') return format(addYears(start, 1), 'yyyy-MM-dd')
    return format(new Date(start.getTime() + (Number(customDays) || 30) * 86400000), 'yyyy-MM-dd')
  }

  const addCategory = () => setCategories([...categories, { name: '', products: [] }])
  const removeCategory = (i: number) => setCategories(categories.filter((_, idx) => idx !== i))

  const addProduct = (catIdx: number) => {
    const updated = [...categories]
    updated[catIdx].products.push({ name: '', quantity: '', quantity_sold: '' })
    setCategories(updated)
  }
  const removeProduct = (catIdx: number, prodIdx: number) => {
    const updated = [...categories]
    updated[catIdx].products = updated[catIdx].products.filter((_, idx) => idx !== prodIdx)
    setCategories(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    const contract = await createContract({
      name,
      invoice_email: invoiceEmail || null,
      renewal_period: renewalPeriod,
      start_date: startDate,
      next_due_date: calculateDueDate(),
      custom_period_days: renewalPeriod === 'custom' ? Number(customDays) : null,
      created_by: user?.id,
    })
    if (contract) {
      for (const cat of categories) {
        if (!cat.name.trim()) continue
        const category = await useContractStore.getState().createCategory({ contract_id: contract.id, name: cat.name })
        if (category) {
          for (const prod of cat.products) {
            if (!prod.name.trim()) continue
            await useContractStore.getState().createProduct({
              contract_category_id: category.id,
              name: prod.name,
              quantity: Number(prod.quantity) || 0,
              quantity_sold: Number(prod.quantity_sold) || 0,
            })
          }
        }
      }
      await fetchContracts()
    }
    setShowForm(false)
    setName('')
    setInvoiceEmail('')
    setCategories([])
    setStartDate(format(new Date(), 'yyyy-MM-dd'))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Contratos</h2>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4" /> Criar Contrato
        </Button>
      </div>

      <AnimatePresence mode="popLayout">
        {contracts.length === 0 && (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Nenhum contrato cadastrado. Crie o primeiro!
              </CardContent>
            </Card>
          </motion.div>
        )}
        {contracts.map((contract) => (
          <motion.div
            key={contract.id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <ContractCard contract={contract} />
          </motion.div>
        ))}
      </AnimatePresence>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Criar Contrato</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Nome do Contrato</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Limpeza" required />
            </div>

            <div className="space-y-2">
              <Label>E-mail para Notas Fiscais</Label>
              <Input type="email" value={invoiceEmail} onChange={(e) => setInvoiceEmail(e.target.value)} placeholder="ex: financeiro@empresa.com" />
              <p className="text-xs text-muted-foreground">Notas fiscais serão enviadas para este e-mail</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Categorias</Label>
                <Button type="button" variant="outline" size="sm" onClick={addCategory}>
                  <Plus className="h-3 w-3" /> Categoria
                </Button>
              </div>
              {categories.map((cat, catIdx) => (
                <div key={catIdx} className="rounded-lg border p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <Input
                      value={cat.name}
                      onChange={(e) => {
                        const updated = [...categories]
                        updated[catIdx].name = e.target.value
                        setCategories(updated)
                      }}
                      placeholder="Nome da categoria"
                      className="h-8 text-sm flex-1"
                    />
                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => removeCategory(catIdx)}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="pl-3 space-y-1.5">
                    {cat.products.map((prod, prodIdx) => (
                      <div key={prodIdx} className="flex items-center gap-1.5">
                        <Input
                          value={prod.name}
                          onChange={(e) => {
                            const updated = [...categories]
                            updated[catIdx].products[prodIdx].name = e.target.value
                            setCategories(updated)
                          }}
                          placeholder="Produto"
                          className="h-7 text-sm flex-1"
                        />
                        <Input
                          type="number"
                          value={prod.quantity}
                          onChange={(e) => {
                            const updated = [...categories]
                            updated[catIdx].products[prodIdx].quantity = e.target.value
                            setCategories(updated)
                          }}
                          placeholder="Qtd"
                          className="h-7 text-sm w-16"
                        />
                        <Input
                          type="number"
                          value={prod.quantity_sold}
                          onChange={(e) => {
                            const updated = [...categories]
                            updated[catIdx].products[prodIdx].quantity_sold = e.target.value
                            setCategories(updated)
                          }}
                          placeholder="Vend."
                          className="h-7 text-sm w-16"
                        />
                        <Button type="button" variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => removeProduct(catIdx, prodIdx)}>
                          <X className="h-3 w-3 text-red-500" />
                        </Button>
                      </div>
                    ))}
                    <Button type="button" variant="ghost" size="sm" className="text-xs h-7" onClick={() => addProduct(catIdx)}>
                      <Plus className="h-3 w-3" /> Produto
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Prazo de Renovação</Label>
                <Select value={renewalPeriod} onValueChange={(v: '6months' | '1year' | 'custom') => setRenewalPeriod(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6months">6 meses</SelectItem>
                    <SelectItem value="1year">1 ano</SelectItem>
                    <SelectItem value="custom">Personalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Data de Início</Label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
              </div>
            </div>

            {renewalPeriod === 'custom' && (
              <div className="space-y-2">
                <Label>Repetir a cada (dias)</Label>
                <Input type="number" value={customDays} onChange={(e) => setCustomDays(e.target.value)} />
              </div>
            )}

            <div className="rounded-md bg-gradient-to-r from-brand-green/10 to-brand-blue/10 p-3 text-sm">
              Data de vencimento: <strong>{format(new Date(calculateDueDate()), 'dd/MM/yyyy')}</strong>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button type="submit">Criar Contrato</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}