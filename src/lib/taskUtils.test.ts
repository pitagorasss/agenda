import { describe, it, expect } from 'vitest'
import { toMin, fmtTime, getUserName, formatDate, formatDateTime } from '@/lib/taskUtils'
import type { Profile } from '@/types'

describe('toMin', () => {
  it('converte HH:MM para minutos', () => {
    expect(toMin('09:30')).toBe(570)
    expect(toMin('00:05')).toBe(5)
  })
  it('ignora segundos se presentes', () => {
    expect(toMin('09:30:00')).toBe(570)
  })
  it('retorna null para entradas inválidas', () => {
    expect(toMin(null)).toBeNull()
    expect(toMin(undefined)).toBeNull()
    expect(toMin('')).toBeNull()
    expect(toMin('abc')).toBeNull()
    expect(toMin('9')).toBeNull()
  })
})

describe('fmtTime', () => {
  it('trunca para HH:MM', () => {
    expect(fmtTime('09:30:00')).toBe('09:30')
    expect(fmtTime('14:05')).toBe('14:05')
  })
})

describe('getUserName', () => {
  const users: Profile[] = [
    { id: '1', name: 'Ana', email: 'ana@x.com' },
    { id: '2', name: undefined, email: 'bob@x.com' },
  ]
  it('retorna o nome quando disponível', () => {
    expect(getUserName('1', users)).toBe('Ana')
  })
  it('cai para email quando não há nome', () => {
    expect(getUserName('2', users)).toBe('bob@x.com')
  })
  it('retorna placeholder para id desconhecido', () => {
    expect(getUserName('9', users)).toBe('—')
    expect(getUserName(null, users)).toBe('—')
  })
})

describe('formatDate', () => {
  it('converte ISO date para dd/mm/aaaa', () => {
    expect(formatDate('2026-08-14')).toBe('14/08/2026')
  })
})

describe('formatDateTime', () => {
  it('formata timestamp ISO com data e hora', () => {
    expect(formatDateTime('2026-08-14T09:05:00')).toMatch(/14\/08\/2026 09:05/)
  })
  it('retorna placeholder para data inválida', () => {
    expect(formatDateTime('não-é-data')).toBe('—')
  })
})