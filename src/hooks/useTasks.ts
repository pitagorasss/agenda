import { useEffect } from 'react'
import { useAgendaStore } from '@/stores/agendaStore'

export function useTasks() {
  const { categories, fetchCategories } = useAgendaStore()

  useEffect(() => {
    fetchCategories()
  }, [])

  return { categories }
}
