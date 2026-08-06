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
import { Pencil, Trash2, Plus, AlertTriangle, Calendar } from 'lucide-react'
import type { Contract, ContractProduct } from '@/types'
import { motion } from 'framer-motion'
import { ContractCategorySection } from './ContractCategorySection'
import { ContractRenewDialog } from './ContractRenewDialog'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

interface Props {
  contract: Contract
}

export function ContractCard({ contract }: Props) {
  const { updateContract, deleteContract, createCategory, deleteCategory, createProduct, updateProduct, deleteProduct, uploadInvoice, getSignedUrl, sendInvoiceEmail } = useContractStore()
  const user = useAuthStore((s) => s.user)
  const [showRenew, setShowRenew] = useState(false)
  const [name, setName] = useState(contract.name)
  const [invoiceEmail, setInvoiceEmail] = useState(contract.invoice_email || '')
  const [renewalPeriod, setRenewalPeriod] = useState(contract.renewal_period)
  const [customDays, setCustomDays] = useState(contract.custom_period_days?.toString() ?? '30')
  const [showEdit, setShowEdit] = useState(false)
  const [confirmDeleteContract, setConfirmDeleteContract] = useState(false)
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null)
  const [deleteCategoryId, setDeleteCategoryId] = useState<string | null>(null)

  const [catName, setCatName] = useState('')
  const [prodName, setProdName] = useState('')
  const [prodQty, setProdQty] = useState('')
  const [prodSold, setProdSold] = useState('')
  const [addingCat, setAddingCat] = useState(false)
  const [addingProdFor, setAddingProdFor] = useState<string | null>(null)
  const [editingProduct, setEditingProduct] = useState<ContractProduct | null>(null)
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
  }

  const handleDeleteContract = async () => {
    setConfirmDeleteContract(false)
    await deleteContract(contract.id)
  }

  const handleEditSave = async () => {
    await updateContract(contract.id, { name, invoice_email: invoiceEmail || null })
    setShowEdit(false)
  }

  const handleAddCategory = async () => {
    if (!catName.trim()) return
    await createCategory({ contract_id: contract.id, name: catName.trim() })
    setCatName('')
    setAddingCat(false)
  }

  const handleAddProduct = async (categoryId: string) => {
    if (!prodName.trim()) return
    await createProduct({ contract_category_id: categoryId, name: prodName.trim(), quantity: Number(prodQty) || 0, quantity_sold: Number(prodSold) || 0 })
    setProdName('')
    setProdQty('')
    setProdSold('')
    setAddingProdFor(null)
  }

  const handleEditProduct = (product: ContractProduct) => {
    setEditingProduct(product)
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

  const handleSaveProductEdit = async () => {
    if (!editingProduct) return
    await updateProduct(editingProduct.id, { quantity: Number(editProdQty) || 0, quantity_sold: Number(editProdSold) || 0 })
    setEditingProduct(null)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, productId: string) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setUploading(productId)
    const path = await uploadInvoice(file, user.id)
    if (path) {
      await updateProduct(productId, { invoice_url: path })
      const product = contract.categories?.flatMap((c) => c.products || []).find((p) => p.id === productId)
      if (product) {
        await sendInvoiceEmail(contract.id, product.name, path, file.name)
      }
    }
    setUploading(null)
    setUploadTarget(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleOpenInvoice = async (productId: string) => {
    const product = contract.categories?.flatMap((c) => c.products || []).find((p) => p.id === productId)
    if (!product?.invoice_url) return
    const url = await getSignedUrl(product.invoice_url)
    if (url) window.open(url, '_blank', 'noopener,noreferrer')
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
              <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Editar contrato" onClick={() => setShowEdit(!showEdit)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" aria-label="Excluir contrato" onClick={() => setConfirmDeleteContract(true)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {contract.categories && contract.categories.length > 0 && (
            <div className="space-y-2 mb-3">
              {contract.categories.map((cat) => (
                <ContractCategorySection
                  key={cat.id}
                  category={cat}
                  addingProduct={addingProdFor === cat.id}
                  prodName={prodName}
                  prodQty={prodQty}
                  prodSold={prodSold}
                  uploading={uploading}
                  onToggleAddProduct={() => setAddingProdFor(addingProdFor === cat.id ? null : cat.id)}
                  onChangeProdName={setProdName}
                  onChangeProdQty={setProdQty}
                  onChangeProdSold={setProdSold}
                  onAddProduct={handleAddProduct}
                  onCancelAddProduct={() => { setAddingProdFor(null); setProdName('') }}
                  onDeleteCategory={(id) => setDeleteCategoryId(id)}
                  onUpload={(productId) => { setUploadTarget(productId); fileInputRef.current?.click() }}
                  onOpenInvoice={handleOpenInvoice}
                  onEditProduct={handleEditProduct}
                  onDeleteProduct={(id) => setDeleteProductId(id)}
                />
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
            <Button onClick={handleSaveProductEdit}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ContractRenewDialog
        open={showRenew}
        renewalPeriod={renewalPeriod}
        customDays={customDays}
        onChangePeriod={setRenewalPeriod}
        onChangeCustomDays={setCustomDays}
        onConfirm={handleRenew}
        onCancel={() => setShowRenew(false)}
      />

      <ConfirmDialog
        open={confirmDeleteContract}
        title="Excluir este contrato?"
        description="Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        onConfirm={handleDeleteContract}
        onCancel={() => setConfirmDeleteContract(false)}
      />

      <ConfirmDialog
        open={!!deleteCategoryId}
        title="Excluir esta categoria?"
        description="Os produtos vinculados também serão excluídos."
        confirmLabel="Excluir"
        onConfirm={async () => {
          if (deleteCategoryId) await deleteCategory(deleteCategoryId)
          setDeleteCategoryId(null)
        }}
        onCancel={() => setDeleteCategoryId(null)}
      />

      <ConfirmDialog
        open={!!deleteProductId}
        title="Excluir este produto?"
        confirmLabel="Excluir"
        onConfirm={async () => {
          if (deleteProductId) await deleteProduct(deleteProductId)
          setDeleteProductId(null)
        }}
        onCancel={() => setDeleteProductId(null)}
      />
    </>
  )
}