// Funções utilitárias para manipular e exibir dados de tarefas e horários.
import type { Profile } from '@/types' // Tipo de perfil de usuário usado nas buscas.

// Converte um horário "HH:MM" em minutos desde a meia-noite (ex.: "08:30" -> 510).
// Retorna null se a entrada for inválida ou vazia.
export function toMin(t: string | null | undefined): number | null {
  if (!t) return null
  const parts = t.split(':').map(Number) // Divide "HH:MM" em horas e minutos.
  if (parts.length < 2 || isNaN(parts[0]) || isNaN(parts[1])) return null
  return parts[0] * 60 + parts[1]
}

// Formata um horário para exibir apenas "HH:MM" (remove segundos, se houver).
export function fmtTime(t: string): string {
  return t.slice(0, 5)
}

// Retorna o nome (ou e-mail) de um usuário dado o seu id, buscando na lista de perfis.
// Retorna "—" se o id estiver vazio ou o usuário não for encontrado.
export function getUserName(id: string | null | undefined, users: Profile[]): string {
  if (!id) return '—'
  const u = users.find((u) => u.id === id)
  return u?.name ?? u?.email ?? '—'
}

// Converte uma data ISO "YYYY-MM-DD" para o formato brasileiro "DD/MM/YYYY".
// Não valida a entrada: assume o padrão "YYYY-MM-DD".
export function formatDate(d: string): string {
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

// Converte uma data/hora ISO completa para "DD/MM/YYYY HH:MM" (formato brasileiro).
// Retorna "—" se a data for inválida.
export function formatDateTime(d: string): string {
  const date = new Date(d)
  if (Number.isNaN(date.getTime())) return '—'
  const dd = date.getDate().toString().padStart(2, '0')
  const mm = (date.getMonth() + 1).toString().padStart(2, '0')
  const hh = date.getHours().toString().padStart(2, '0')
  const min = date.getMinutes().toString().padStart(2, '0')
  return `${dd}/${mm}/${date.getFullYear()} ${hh}:${min}`
}