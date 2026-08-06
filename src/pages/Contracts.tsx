import { useEffect } from 'react'
import { useContractStore } from '@/stores/contractStore'
import { ContractList } from '@/components/contracts/ContractList'
import { motion } from 'framer-motion'

export function Contracts() {
  const { fetchContracts } = useContractStore()

  useEffect(() => {
    fetchContracts()
  }, [fetchContracts])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold">Contratos</h1>
        <p className="text-muted-foreground">Gerencie contratos, categorias e produtos</p>
      </div>
      <ContractList />
    </motion.div>
  )
}
