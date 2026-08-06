import { useState, useRef, useCallback } from 'react'
import { useContractStore } from '@/stores/contractStore'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { format, addMonths, addYears, differenceInDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Pencil, Trash2, Plus, X, Package, Calendar, AlertTriangle, FileText, Upload, Download } from 'lucide-react'
import type { Contract, ContractProduct } from '@/types'
import { motion } from 'framer-motion'

interface Props {
  contract: Contract
}

export function ContractCard({ contract }: Props) {
  const { updateContract, deleteContract, createCategory, deleteCategory, createProduct, updateProduct, deleteProduct, uploadInvoice, sendInvoiceEmail, fetchContracts } = useContractStore()
  const user = useAuthStore((s) => s.user)
  const [showRenew, setShowRenew] = useState(false)
  const [name, setName] = useState(contract.name)
  const [invoiceEmail, setInvoiceEmail] = useState(contract.invoice_email || '')
  const [renewalPeriod, setRenewalPeriod] = useState(contract.renewal_period)
  const [customDays, setCustomDays] = useState(contract.custom_period_days?.toString() ?? '30')
  const [showEdit, setShowEdit] = useState(false)

  const [catName, setCatName] = useState('')
  const [prodName, setProdName] = useState('')
  const [prodQty, setProdQty] = useState('')
  const [prodSold, setProdSold] = useState('')
  const [addingCat, setAddingCat] = useState(false)
  const [addingProdFor, setAddingProdFor] = useState<string | null>(null)
  const [editingProduct, setEditingProduct] = useState<string | null>(null)
  const [editProdQty, setEditProdQty] = useState('')
  const [editProdSold, setEditProdSold] = useState('')
  const [uploading, setUploading] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadTarget, setUploadTarget] = useState<string | null>(null)

  const diff = differenceInDays(new Date(contract.next_due_date), new Date())
  const isExpiring = diff >= 0 && diff <= 30
  const isExpired = diff < 0

  const handleRenew = async () => {
    const start = new Date()
    let dueDate: Date
    if (renewalPeriod === '6months') dueDate = addMonths(start, 6)
    else if (renewalPeriod === '1year') dueDate = addYears(start, 1)
    else dueDate = new Date(start.getTime() + (Number(customDays) || 30) * 86400000)
    await updateContract(contract.id, {
      start_date: format(start, 'yyyy-MM-dd'),
      next_due_date: format(dueDate, 'yyyy-MM-dd'),
      status: 'active',
    })
    setShowRenew(false)
    await fetchContracts()
  }

  const handleDelete = async () => {
    if (confirm('Excluir este contrato?')) {
      await deleteContract(contract.id)
    }
  }

  const handleEditSave = async () => {
    await updateContract(contract.id, { name, invoice_email: invoiceEmail || null })
    setShowEdit(false)
    await fetchContracts()
  }

  const handleAddCategory = async () => {
    if (!catName.trim()) return
    await createCategory({ contract_id: contract.id, name: catName.trim() })
    setCatName('')
    setAddingCat(false)
    await fetchContracts()
  }

  const handleDeleteCategory = async (id: string) => {
    await deleteCategory(id)
    await fetchContracts()
  }

  const handleAddProduct = async (categoryId: string) => {
    if (!prodName.trim()) return
    await createProduct({ contract_category_id: categoryId, name: prodName.trim(), quantity: Number(prodQty) || 0, quantity_sold: Number(prodSold) || 0 })
    setProdName('')
    setProdQty('')
    setProdSold('')
    setAddingProdFor(null)
    await fetchContracts()
  }

  const handleDeleteProduct = async (id: string) => {
    await deleteProduct(id)
    await fetchContracts()
  }

  const handleEditProduct = (product: { id: string; quantity: number; quantity_sold: number }) => {
    setEditingProduct(product.id)
    setEditProdQty(product.quantity.toString())
    setEditProdSold(product.quantity_sold.toString())
  }

  const handleEditProdPendente = useCallback((value: string) => {
    const newQty = Number(value) || 0
    const oldQty = Number(editProdQty) || 0
    const oldSold = Number(editProdSold) || 0
    const total = oldQty + oldSold
    const newSold = Math.max(0, total - newQty)
    setEditProdQty(value)
    setEditProdSold(newSold.toString())
  }, [editProdQty, editProdSold])

  const handleEditProdEntregue = useCallback((value: string) => {
    const newSold = Number(value) || 0
    const oldQty = Number(editProdQty) || 0
    const oldSold = Number(editProdSold) || 0
    const total = oldQty + oldSold
    const newQty = Math.max(0, total - newSold)
    setEditProdSold(value)
    setEditProdQty(newQty.toString())
  }, [editProdQty, editProdSold])

  const handleSaveProductEdit = async (id: string) => {
    await updateProduct(id, { quantity: Number(editProdQty) || 0, quantity_sold: Number(editProdSold) || 0 })
    setEditingProduct(null)
    await fetchContracts()
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, productId: string) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setUploading(productId)
    const url = await uploadInvoice(file, user.id)
    if (url) {
      await updateProduct(productId, { invoice_url: url })
      await fetchContracts()
      // Enviar e-mail se configurado
      const product = contract.categories?.flatMap(c => c.products || []).find(p => p.id === productId)
      if (product) {
        await sendInvoiceEmail(contract.id, product.name, url)
      }
    }
    setUploading(null)
    setUploadTarget(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <>
      <Card className={'group hover:shadow-lg transition-all duration-300 border-l-4 ' + (
        isExpired ? 'border-l-red-500' : isExpiring ? 'border-l-orange-400' : 'border-l-brand-green'
      )}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              {showEdit ? (
                <div className="flex flex-col gap-2">
                  <Input value={name} onChange={(e) => setName(e.target.value)} className="h-8 text-lg font-semibold" />
                  <Input type="email" value={invoiceEmail} onChange={(e) => setInvoiceEmail(e.target.value)} placeholder="E-mail para notas fiscais" className="h-8 text-sm" />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleEditSave}>Salvar</Button>
                    <Button size="sm" variant="outline" onClick={() => setShowEdit(false)}>Cancelar</Button>
                  </div>
                </div>
              ) : (
                <CardTitle className="text-lg flex items-center gap-2">
                  {contract.name}
                  {isExpiring && !isExpired && (
                    <span className="inline-flex items-center gap-1 text-xs text-orange-600 bg-orange-100 dark:bg-orange-900/40 dark:text-orange-300 px-2 py-0.5 rounded-full whitespace-nowrap">
                      <AlertTriangle className="h-3 w-3" /> Vence em {diff} dias
                    </span>
                  )}
                  {isExpired && (
                    <span className="inline-flex items-center gap-1 text-xs text-red-600 bg-red-100 dark:bg-red-900/40 dark:text-red-300 px-2 py-0.5 rounded-full">
                      Vencido
                    </span>
                  )}
                </CardTitle>
              )}
              <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1 flex-wrap">
                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {format(new Date(contract.start_date), 'dd/MM/yyyy')} - {format(new Date(contract.next_due_date), 'dd/MM/yyyy', { locale: ptBR })}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-muted">
                  {contract.renewal_period === '6months' ? '6 meses' : contract.renewal_period === '1year' ? '1 ano' : contract.custom_period_days + ' dias'}
                </span>
              </div>
            </div>
            <div className="flex gap-1 ml-2">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowEdit(!showEdit)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={handleDelete}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {contract.categories && contract.categories.length > 0 && (
            <div className="space-y-2 mb-3">
              {contract.categories.map((cat) => (
                <div key={cat.id} className="rounded-lg bg-muted/50 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm flex items-center gap-1">
                      <Package className="h-3 w-3 text-brand-blue" /> {cat.name}
                    </span>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setAddingProdFor(addingProdFor === cat.id ? null : cat.id)}>
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500" onClick={() => handleDeleteCategory(cat.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {cat.products && cat.products.length > 0 && (
                    <div className="space-y-1.5">
                      {cat.products.map((prod: ContractProduct) => (
                        <div key={prod.id} className="flex items-center justify-between text-sm pl-3 border-l-2 border-brand-green/30 py-1">
                          <div className="flex-1 min-w-0">
                            <span className="font-medium">{prod.name}</span>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5 flex-wrap">
                              <span>Pendente: {prod.quantity} un</span>
                              <span>Entregue: {prod.quantity_sold} un</span>
                              <span className="text-brand-green font-medium">
                                {(prod.quantity_sold > 0 && (prod.quantity + prod.quantity_sold) > 0) ? 'Rendimento: ' + ((prod.quantity_sold / (prod.quantity + prod.quantity_sold)) * 100).toFixed(1) + '%' : ''}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            {prod.invoice_url ? (
                              <a href={prod.invoice_url} target="_blank" rel="noopener noreferrer">
                                <Button variant="outline" size="sm" className="h-7 text-xs border-brand-blue text-brand-blue">
                                  <FileText className="h-3.5 w-3.5" /> Nota
                                </Button>
                              </a>
                            ) : (
                              <Button variant="outline" size="sm" className="h-7 text-xs border-dashed" onClick={() => { setUploadTarget(prod.id); fileInputRef.current?.click() }}>
                                {uploading === prod.id ? '...' : <><Upload className="h-3.5 w-3.5" /> Anexar</>}
                              </Button>
                            )}
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleEditProduct(prod)}>
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500" onClick={() => handleDeleteProduct(prod.id)}>
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {addingProdFor === cat.id && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-2 flex flex-wrap items-end gap-2">
                      <div className="flex-1 min-w-[120px]">
                        <Label className="text-[10px]">Produto</Label>
                        <Input value={prodName} onChange={(e) => setProdName(e.target.value)} placeholder="Nome" className="h-8 text-sm" />
                      </div>
                      <div className="w-16">
                        <Label className="text-[10px]">Pendente</Label>
                        <Input type="number" value={prodQty} onChange={(e) => setProdQty(e.target.value)} placeholder="0" className="h-8 text-sm" />
                      </div>
                      <div className="w-16">
                        <Label className="text-[10px]">Entregue</Label>
                        <Input type="number" value={prodSold} onChange={(e) => setProdSold(e.target.value)} placeholder="0" className="h-8 text-sm" />
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" className="h-8" onClick={() => handleAddProduct(cat.id)} disabled={!prodName.trim()}>
                          <Plus className="h-3 w-3" /> Add
                        </Button>
                        <Button size="sm" variant="outline" className="h-8" onClick={() => setAddingProdFor(null)}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </div>
              ))}
            </div>
          )}

          {addingCat ? (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="flex items-center gap-2 mb-2">
              <Input value={catName} onChange={(e) => setCatName(e.target.value)} placeholder="Nome da categoria..." className="h-8 text-sm flex-1" />
              <Button size="sm" className="h-8" onClick={handleAddCategory} disabled={!catName.trim()}>
                <Plus className="h-3 w-3" /> Adicionar
              </Button>
              <Button size="sm" variant="outline" className="h-8" onClick={() => { setAddingCat(false); setCatName('') }}>
                Cancelar
              </Button>
            </motion.div>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setAddingCat(true)}>
              <Plus className="h-3 w-3" /> Categoria
            </Button>
          )}

          <input ref={fileInputRef} type="file" accept=".pdf,image/*" className="hidden" onChange={(e) => { if (uploadTarget) handleFileUpload(e, uploadTarget) }} />

          {(isExpiring || isExpired) && contract.status === 'active' && (
            <div className="mt-3">
              <Button size="sm" variant="secondary" onClick={() => setShowRenew(true)}>
                Renovar Contrato
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editingProduct} onOpenChange={(v) => { if (!v) setEditingProduct(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Produto</DialogTitle>
            <DialogDescription>
              Ao alterar Entregue ou Pendente, o outro valor se ajusta automaticamente para manter o total.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Pendente</Label>
              <Input type="number" value={editProdQty} onChange={(e) => handleEditProdPendente(e.target.value)} />
            </div>
            <div>
              <Label>Entregue</Label>
              <Input type="number" value={editProdSold} onChange={(e) => handleEditProdEntregue(e.target.value)} />
            </div>
            <p className="text-xs text-muted-foreground">
              Total: {Number(editProdQty) + Number(editProdSold)} unidades
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingProduct(null)}>Cancelar</Button>
            <Button onClick={() => editingProduct && handleSaveProductEdit(editingProduct)}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showRenew} onOpenChange={setShowRenew}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Renovar Contrato</DialogTitle>
            <DialogDescription>Confirme a renovacao do contrato.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Periodicidade</Label>
            <select className="w-full rounded-md border px-3 py-2 text-sm bg-background" value={renewalPeriod} onChange={(e) => setRenewalPeriod(e.target.value as any)}>
              <option value="6months">6 meses</option>
              <option value="1year">1 ano</option>
              <option value="custom">Personalizado</option>
            </select>
            {renewalPeriod === 'custom' && (
              <div>
                <Label>Dias</Label>
                <Input type="number" value={customDays} onChange={(e) => setCustomDays(e.target.value)} />
              </div>
            )}
            <p className="text-sm text-muted-foreground pt-2">
              Novo vencimento:{' '}
              <strong>
                {format(
                  renewalPeriod === '6months' ? addMonths(new Date(), 6) :
                  renewalPeriod === '1year' ? addYears(new Date(), 1) :
                  new Date(Date.now() + (Number(customDays) || 30) * 86400000),
                  'dd/MM/yyyy'
                )}
              </strong>
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRenew(false)}>Cancelar</Button>
            <Button onClick={handleRenew}>Confirmar Renovacao</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}