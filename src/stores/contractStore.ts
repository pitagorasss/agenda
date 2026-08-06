import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import type { Contract, ContractCategory, ContractProduct } from '@/types'

interface ContractState {
  contracts: Contract[]
  loading: boolean
  fetchContracts: () => Promise<void>
  createContract: (data: Partial<Contract>) => Promise<Contract | null>
  updateContract: (id: string, data: Partial<Contract>) => Promise<void>
  deleteContract: (id: string) => Promise<void>
  createCategory: (data: Partial<ContractCategory>) => Promise<ContractCategory | null>
  updateCategory: (id: string, data: Partial<ContractCategory>) => Promise<void>
  deleteCategory: (id: string) => Promise<void>
  createProduct: (data: Partial<ContractProduct>) => Promise<ContractProduct | null>
  updateProduct: (id: string, data: Partial<ContractProduct>) => Promise<void>
  deleteProduct: (id: string) => Promise<void>
  uploadInvoice: (file: File, userId: string) => Promise<string | null>
  getSignedUrl: (path: string) => Promise<string | null>
  sendInvoiceEmail: (contractId: string, productName: string, invoicePath: string, fileName: string) => Promise<boolean>
}

export const useContractStore = create<ContractState>((set, get) => ({
  contracts: [],
  loading: false,

  fetchContracts: async () => {
    set({ loading: true })
    const { data, error } = await supabase
      .from('contracts')
      .select('*, categories:contract_categories(*, products:contract_products(*))')
      .order('created_at', { ascending: false })
    if (!error && data) set({ contracts: data })
    set({ loading: false })
  },

  createContract: async (data) => {
    const { data: result, error } = await supabase
      .from('contracts')
      .insert(data)
      .select('*, categories:contract_categories(*, products:contract_products(*))')
      .single()
    if (error) {
      toast.error(error.message)
      return null
    }
    set((s) => ({ contracts: [result, ...s.contracts] }))
    toast.success('Contrato criado')
    return result
  },

  updateContract: async (id, data) => {
    const { error } = await supabase.from('contracts').update(data).eq('id', id)
    if (error) {
      toast.error(error.message)
      return
    }
    set((s) => ({
      contracts: s.contracts.map((c) => (c.id === id ? { ...c, ...data } : c)),
    }))
  },

  deleteContract: async (id) => {
    const { error } = await supabase.from('contracts').delete().eq('id', id)
    if (error) {
      toast.error(error.message)
      return
    }
    set((s) => ({ contracts: s.contracts.filter((c) => c.id !== id) }))
    toast.success('Contrato excluído')
  },

  createCategory: async (data) => {
    const { data: result, error } = await supabase
      .from('contract_categories')
      .insert(data)
      .select()
      .single()
    if (error) {
      toast.error(error.message)
      return null
    }
    set((s) => ({
      contracts: s.contracts.map((c) =>
        c.id === result.contract_id
          ? { ...c, categories: [...(c.categories || []), result] }
          : c,
      ),
    }))
    return result
  },

  updateCategory: async (id, data) => {
    const { error } = await supabase.from('contract_categories').update(data).eq('id', id)
    if (error) {
      toast.error(error.message)
      return
    }
    set((s) => ({
      contracts: s.contracts.map((c) => ({
        ...c,
        categories: c.categories?.map((cat) => (cat.id === id ? { ...cat, ...data } : cat)),
      })),
    }))
  },

  deleteCategory: async (id) => {
    const { error } = await supabase.from('contract_categories').delete().eq('id', id)
    if (error) {
      toast.error(error.message)
      return
    }
    set((s) => ({
      contracts: s.contracts.map((c) => ({
        ...c,
        categories: c.categories?.filter((cat) => cat.id !== id),
      })),
    }))
  },

  createProduct: async (data) => {
    const { data: result, error } = await supabase
      .from('contract_products')
      .insert(data)
      .select()
      .single()
    if (error) {
      toast.error(error.message)
      return null
    }
    set((s) => ({
      contracts: s.contracts.map((c) => ({
        ...c,
        categories: c.categories?.map((cat) =>
          cat.id === result.contract_category_id
            ? { ...cat, products: [...(cat.products || []), result] }
            : cat,
        ),
      })),
    }))
    return result
  },

  updateProduct: async (id, data) => {
    const { error } = await supabase.from('contract_products').update(data).eq('id', id)
    if (error) {
      toast.error(error.message)
      return
    }
    set((s) => ({
      contracts: s.contracts.map((c) => ({
        ...c,
        categories: c.categories?.map((cat) => ({
          ...cat,
          products: cat.products?.map((p) => (p.id === id ? { ...p, ...data } : p)),
        })),
      })),
    }))
  },

  deleteProduct: async (id) => {
    const { error } = await supabase.from('contract_products').delete().eq('id', id)
    if (error) {
      toast.error(error.message)
      return
    }
    set((s) => ({
      contracts: s.contracts.map((c) => ({
        ...c,
        categories: c.categories?.map((cat) => ({
          ...cat,
          products: cat.products?.filter((p) => p.id !== id),
        })),
      })),
    }))
  },

  uploadInvoice: async (file, userId) => {
    const ext = file.name.split('.').pop()
    const path = `invoices/${userId}/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('contracts').upload(path, file)
    if (error) {
      toast.error(error.message)
      return null
    }
    return path
  },

  getSignedUrl: async (path) => {
    const { data, error } = await supabase.storage
      .from('contracts')
      .createSignedUrl(path, 60 * 60 * 24 * 7)
    if (error) {
      toast.error(error.message)
      return null
    }
    return data?.signedUrl ?? null
  },

  sendInvoiceEmail: async (contractId, productName, invoicePath, fileName) => {
    try {
      const contract = get().contracts.find((c) => c.id === contractId)
      if (!contract?.invoice_email) {
        toast.error('Contrato sem e-mail configurado para notas fiscais')
        return false
      }

      const signedUrl = await get().getSignedUrl(invoicePath)
      if (!signedUrl) return false

      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) return false

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-invoice-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          invoiceUrl: signedUrl,
          contractName: contract.name,
          productName,
          invoiceEmail: contract.invoice_email,
          fileName,
        }),
      })

      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        toast.error(body.error ?? 'Erro ao enviar e-mail')
        return false
      }
      toast.success('Nota fiscal enviada por e-mail')
      return true
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao enviar e-mail')
      return false
    }
  },
}))