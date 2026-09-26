import { v4 as uuidv4 } from 'uuid'

export function generatePin(): string {
  return Math.floor(1000 + Math.random() * 9000).toString()
}

export function generateBrowserToken(): string {
  return uuidv4()
}

function pad2(value: number): string {
  return value.toString().padStart(2, '0')
}

/** Malaysian date format: DD/MM/YYYY. Uses the viewer's local calendar date. */
export function formatDate(date: Date | string): string {
  const d = new Date(date)
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`
}

/** Malaysian date and 24-hour time: DD/MM/YYYY, HH:mm. */
export function formatDateTime(date: Date | string): string {
  const d = new Date(date)
  return `${formatDate(d)}, ${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

/**
 * Origin encoded in permanent tag QR codes.
 * Uses NEXT_PUBLIC_SITE_URL when set so labels printed from a preview
 * still point at production. Falls back to the current origin otherwise.
 */
export function getPublicSiteUrl(fallbackOrigin?: string): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (configured) {
    return configured.replace(/\/+$/, '')
  }
  const fallback = fallbackOrigin ?? (typeof window !== 'undefined' ? window.location.origin : '')
  return fallback.replace(/\/+$/, '')
}

export function getTagCheckInUrl(tagCode: string, fallbackOrigin?: string): string {
  return `${getPublicSiteUrl(fallbackOrigin)}/tag/${encodeURIComponent(tagCode)}`
}

const ENUM_LABELS: Record<string, string> = {
  EXTERNAL: 'External',
  STAFF: 'Staff',
  GENERAL: 'General',
  TRUCK: 'Truck',
  NONE: 'No vehicle',
  CAR: 'Car',
  MOTORCYCLE: 'Motorcycle',
  VAN: 'Van',
  ACTIVE: 'Active',
  COMPLETED: 'Checked out',
  FORCE_COMPLETED: 'Checked out by staff',
  STAFF_CHECKOUT: 'Checked out by staff',
}

/** Friendly words for stored enum codes (visitor type, purpose, vehicle, status). */
export function displayLabel(value: string | null | undefined): string {
  if (!value) return ''
  return ENUM_LABELS[value] ?? value
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

export const VEHICLE_TYPES = ['NONE', 'CAR', 'MOTORCYCLE', 'TRUCK', 'VAN'] as const
export type VehicleType = typeof VEHICLE_TYPES[number]

export const VISITOR_STATUS = ['ACTIVE', 'COMPLETED', 'FORCE_COMPLETED', 'STAFF_CHECKOUT'] as const
export type VisitorStatus = typeof VISITOR_STATUS[number]

export const USER_ROLES = ['SUPER_ADMIN', 'SITE_ADMIN', 'STOREKEEPER'] as const
export type UserRole = typeof USER_ROLES[number]

export const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: 'Super Admin',
  SITE_ADMIN: 'Site Admin',
  STOREKEEPER: 'Storekeeper',
}

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  SUPER_ADMIN: 'Full system access - manage sites, warehouses, and all users',
  SITE_ADMIN: 'Site-level access - manage warehouses and storekeepers within assigned site',
  STOREKEEPER: 'Warehouse-level access - manage visitors at assigned warehouses',
}
