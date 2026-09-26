import { getSession, ROLES, UserRole, SessionData } from './session'
import { prisma } from './prisma'

export interface AuthResult {
  authorized: boolean
  session: SessionData | null
  error?: string
  status?: number
}

export async function requireAuth(): Promise<AuthResult> {
  const session = await getSession()
  if (!session.isLoggedIn || !session.userId) {
    return { authorized: false, session: null, error: 'Unauthorized', status: 401 }
  }
  return { authorized: true, session }
}

export async function requireRole(allowedRoles: UserRole[]): Promise<AuthResult> {
  const authResult = await requireAuth()
  if (!authResult.authorized || !authResult.session) {
    return authResult
  }

  const userRole = authResult.session.role as UserRole
  if (!allowedRoles.includes(userRole)) {
    return { 
      authorized: false, 
      session: authResult.session, 
      error: 'Forbidden - insufficient permissions', 
      status: 403 
    }
  }

  return authResult
}

export async function requireSuperAdmin(): Promise<AuthResult> {
  return requireRole([ROLES.SUPER_ADMIN])
}

export async function requireSiteAdmin(): Promise<AuthResult> {
  return requireRole([ROLES.SUPER_ADMIN, ROLES.SITE_ADMIN])
}

export async function requireStaff(): Promise<AuthResult> {
  return requireRole([ROLES.SUPER_ADMIN, ROLES.SITE_ADMIN, ROLES.STOREKEEPER])
}

export function isSuperAdmin(session: SessionData): boolean {
  return session.role === ROLES.SUPER_ADMIN
}

export function isSiteAdmin(session: SessionData): boolean {
  return session.role === ROLES.SITE_ADMIN
}

export function isStorekeeper(session: SessionData): boolean {
  return session.role === ROLES.STOREKEEPER
}

export async function canAccessSite(session: SessionData, siteId: string): Promise<boolean> {
  if (isSuperAdmin(session)) return true
  if (isSiteAdmin(session) && session.siteId === siteId) return true
  
  if (isStorekeeper(session) && session.warehouseIds && session.warehouseIds.length > 0) {
    const warehouse = await prisma.warehouse.findFirst({
      where: {
        id: { in: session.warehouseIds },
        siteId: siteId,
      },
    })
    return !!warehouse
  }
  
  return false
}

export async function canAccessWarehouse(session: SessionData, warehouseId: string): Promise<boolean> {
  if (isSuperAdmin(session)) return true
  
  if (isSiteAdmin(session) && session.siteId) {
    const warehouse = await prisma.warehouse.findFirst({
      where: { id: warehouseId, siteId: session.siteId },
    })
    return !!warehouse
  }
  
  if (isStorekeeper(session) && session.warehouseIds) {
    return session.warehouseIds.includes(warehouseId)
  }
  
  return false
}

export async function getAccessibleWarehouseIds(session: SessionData): Promise<string[]> {
  if (isSuperAdmin(session)) {
    const warehouses = await prisma.warehouse.findMany({
      where: { isActive: true },
      select: { id: true },
    })
    return warehouses.map(w => w.id)
  }
  
  if (isSiteAdmin(session) && session.siteId) {
    const warehouses = await prisma.warehouse.findMany({
      where: { siteId: session.siteId, isActive: true },
      select: { id: true },
    })
    return warehouses.map(w => w.id)
  }
  
  if (isStorekeeper(session) && session.warehouseIds) {
    return session.warehouseIds
  }
  
  return []
}

export interface ManagedWarehouse {
  id: string
  code: string
  name: string
  siteId: string
  siteName: string
  isActive: boolean
}

/**
 * Warehouses the user may manage or filter by.
 * Super admins see every active warehouse, site admins see their site,
 * and storekeepers see their assignments (read fresh from the database).
 */
export async function getManagedWarehouses(user: {
  id: string
  role: string
  siteId?: string | null
}): Promise<ManagedWarehouse[]> {
  const includeSite = { site: { select: { name: true } } } as const

  if (user.role === ROLES.SUPER_ADMIN) {
    const warehouses = await prisma.warehouse.findMany({
      where: { isActive: true },
      include: includeSite,
      orderBy: { code: 'asc' },
    })
    return warehouses.map((warehouse) => ({
      id: warehouse.id,
      code: warehouse.code,
      name: warehouse.name,
      siteId: warehouse.siteId,
      siteName: warehouse.site.name,
      isActive: warehouse.isActive,
    }))
  }

  if (user.role === ROLES.SITE_ADMIN && user.siteId) {
    const warehouses = await prisma.warehouse.findMany({
      where: { siteId: user.siteId, isActive: true },
      include: includeSite,
      orderBy: { code: 'asc' },
    })
    return warehouses.map((warehouse) => ({
      id: warehouse.id,
      code: warehouse.code,
      name: warehouse.name,
      siteId: warehouse.siteId,
      siteName: warehouse.site.name,
      isActive: warehouse.isActive,
    }))
  }

  if (user.role === ROLES.STOREKEEPER) {
    const assignments = await prisma.userWarehouse.findMany({
      where: { userId: user.id },
      include: { warehouse: { include: includeSite } },
    })
    return assignments
      .map((assignment) => assignment.warehouse)
      .sort((a, b) => a.code.localeCompare(b.code))
      .map((warehouse) => ({
        id: warehouse.id,
        code: warehouse.code,
        name: warehouse.name,
        siteId: warehouse.siteId,
        siteName: warehouse.site.name,
        isActive: warehouse.isActive,
      }))
  }

  return []
}

export async function getAccessibleSiteIds(session: SessionData): Promise<string[]> {
  if (isSuperAdmin(session)) {
    const sites = await prisma.site.findMany({ select: { id: true } })
    return sites.map(s => s.id)
  }
  
  if (isSiteAdmin(session) && session.siteId) {
    return [session.siteId]
  }
  
  if (isStorekeeper(session) && session.warehouseIds && session.warehouseIds.length > 0) {
    const warehouses = await prisma.warehouse.findMany({
      where: { id: { in: session.warehouseIds } },
      select: { siteId: true },
      distinct: ['siteId'],
    })
    return warehouses.map(w => w.siteId)
  }
  
  return []
}
