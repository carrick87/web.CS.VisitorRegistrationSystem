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

export const VEHICLE_TYPES = ['NONE', 'CAR', 'MOTORCYCLE', 'TRUCK', 'VAN'] as const
export type VehicleType = typeof VEHICLE_TYPES[number]

export const TRUCK_PLATE_REQUIRED_MESSAGE = 'License plate number is required for trucks'

export function isTruckVehicleType(vehicleType: unknown): boolean {
  return typeof vehicleType === 'string' && vehicleType.trim().toUpperCase() === 'TRUCK'
}

export function normalizePlate(carPlate: unknown): string | null {
  if (typeof carPlate !== 'string') return null
  const trimmed = carPlate.trim()
  return trimmed ? trimmed : null
}

export function normalizeVehicleType(vehicleType: unknown): string | null {
  if (typeof vehicleType !== 'string') return null
  const trimmed = vehicleType.trim().toUpperCase()
  return trimmed ? trimmed : null
}

export function truckPlateError(vehicleType: unknown, carPlate: unknown): string | null {
  if (!isTruckVehicleType(vehicleType)) return null
  if (!normalizePlate(carPlate)) return TRUCK_PLATE_REQUIRED_MESSAGE
  return null
}

export function sortByCode<T extends { code: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.code.localeCompare(b.code))
}

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
