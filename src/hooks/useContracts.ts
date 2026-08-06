import { useEffect } from 'react'
import { useContractStore } from '@/stores/contractStore'

export function useContracts() {
  const { contracts, loading, fetchContracts } = useContractStore()

  useEffect(() => {
    fetchContracts()
  }, [])

  return { contracts, loading }
}
