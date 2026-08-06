import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
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
  sendInvoiceEmail: (contractId: string, productName: string, invoiceUrl: string) => Promise<void>
}

export const useContractStore = create<ContractState>((set) => ({
  contracts: [],
  loading: false,

  fetchContracts: async () => {
    set({ loading: true })
    const { data } = await supabase
      .from('contracts')
      .select('*, categories:contract_categories(*, products:contract_products(*))')
      .order('created_at', { ascending: false })
    if (data) set({ contracts: data })
    set({ loading: false })
  },

  createContract: async (data) => {
    const { data: result, error } = await supabase
      .from('contracts')
      .insert(data)
      .select('*, categories:contract_categories(*, products:contract_products(*))')
      .single()
    if (!error && result) {
      set((s) => ({ contracts: [result, ...s.contracts] }))
      return result
    }
    return null
  },

  updateContract: async (id, data) => {
    await supabase.from('contracts').update(data).eq('id', id)
    set((s) => ({
      contracts: s.contracts.map((c) => (c.id === id ? { ...c, ...data } : c)),
    }))
  },

  deleteContract: async (id) => {
    await supabase.from('contracts').delete().eq('id', id)
    set((s) => ({ contracts: s.contracts.filter((c) => c.id !== id) }))
  },

  createCategory: async (data) => {
    const { data: result, error } = await supabase
      .from('contract_categories')
      .insert(data)
      .select()
      .single()
    if (!error && result) {
      set((s) => ({
        contracts: s.contracts.map((c) =>
          c.id === result.contract_id
            ? { ...c, categories: [...(c.categories || []), result] }
            : c,
        ),
      }))
      return result
    }
    return null
  },

  updateCategory: async (id, data) => {
    await supabase.from('contract_categories').update(data).eq('id', id)
    set((s) => ({
      contracts: s.contracts.map((c) => ({
        ...c,
        categories: c.categories?.map((cat) => (cat.id === id ? { ...cat, ...data } : cat)),
      })),
    }))
  },

  deleteCategory: async (id) => {
    await supabase.from('contract_categories').delete().eq('id', id)
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
    if (!error && result) {
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
    }
    return null
  },

  updateProduct: async (id, data) => {
    await supabase.from('contract_products').update(data).eq('id', id)
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
    await supabase.from('contract_products').delete().eq('id', id)
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
    if (error) return null
    const { data: urlData } = supabase.storage.from('contracts').getPublicUrl(path)
    return urlData?.publicUrl ?? null
  },

  sendInvoiceEmail: async (contractId, productName, invoiceUrl) => {
    try {
      const contract = useContractStore.getState().contracts.find(c => c.id === contractId)
      if (!contract?.invoice_email) return

      const { supabase } = await import('@/lib/supabase')
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) return

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-invoice-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          invoiceUrl,
          contractName: contract.name,
          productName,
          invoiceEmail: contract.invoice_email,
          fileName: 'nota-fiscal.pdf',
        }),
      })

      if (!response.ok) {
        console.error('Erro ao enviar e-mail:', await response.text())
      }
    } catch (error) {
      console.error('Erro ao enviar e-mail da nota fiscal:', error)
    }
  },
}))
