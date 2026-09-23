import { v4 as uuidv4 } from 'uuid'

export function generatePin(): string {
  return Math.floor(1000 + Math.random() * 9000).toString()
}

export function generateBrowserToken(): string {
  return uuidv4()
}

export function formatDateTime(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

export function formatDate(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function formatTime(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

export const VISITOR_TYPES = ['EXTERNAL', 'STAFF'] as const
export type VisitorType = typeof VISITOR_TYPES[number]

export const PURPOSES = {
  EXTERNAL: ['GENERAL', 'TRUCK'],
  STAFF: ['GENERAL'],
} as const

export const VISITOR_STATUS = ['ACTIVE', 'COMPLETED', 'FORCE_COMPLETED'] as const
export type VisitorStatus = typeof VISITOR_STATUS[number]
