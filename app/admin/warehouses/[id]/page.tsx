'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { displayLabel, formatDateTime, ROLE_LABELS, sortByCode } from '@/lib/utils'

interface UserSession {
  name: string
  role: string
}

interface Storekeeper {
  id: string
  username: string
  name: string
  role: string
}

interface RecentVisitor {
  id: string
  name: string
  visitorType: string
  company: string | null
  purpose: string
  status: string
  timeIn: string
  carPlate: string | null
}

interface WarehouseTag {
  id: string
  code: string
  displayNumber: string
  visitors: { timeIn: string }[]
}

interface WarehouseDetail {
  id: string
  code: string
  name: string
  isActive: boolean
  site: { id: string; name: string; code: string | null }
  users: { user: Storekeeper }[]
  tags: WarehouseTag[]
  visitors: RecentVisitor[]
  _count: { visitors: number; users: number; tags: number }
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`px-2 py-0.5 rounded text-xs font-medium ${
        active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
      }`}
    >
      {active ? 'Active' : 'Inactive'}
    </span>
  )
}

function formatStay(startIso: string, now: number): string {
  const elapsed = Math.max(0, now - new Date(startIso).getTime())
  const totalMinutes = Math.floor(elapsed / 60000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `${hours}h ${minutes}m`
}

function tagUseLabel(tag: WarehouseTag, now: number): string {
  const count = tag.visitors.length
  if (count === 0) return 'Free'
  const people = count === 1 ? '1 person' : `${count} people`
  const started = tag.visitors[0]?.timeIn
  const stay = started ? formatStay(started, now) : '0h 0m'
  return `In use · ${people} · ${stay}`
}

export default function WarehouseDetailPage() {
  const router = useRouter()
  const params = useParams()
  const warehouseId = typeof params.id === 'string' ? params.id : ''

  const [user, setUser] = useState<UserSession | null>(null)
  const [warehouse, setWarehouse] = useState<WarehouseDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [forbidden, setForbidden] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [now, setNow] = useState(() => Date.now())

  const [editing, setEditing] = useState(false)
  const [confirmOff, setConfirmOff] = useState(false)
  const [name, setName] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const load = async () => {
      try {
        const meResponse = await fetch('/api/auth/me')
        const me = await meResponse.json()
        if (!me.isLoggedIn) {
          router.push('/login')
          return
        }
        if (me.role !== 'SUPER_ADMIN' && me.role !== 'SITE_ADMIN') {
          router.push('/dashboard')
          return
        }
        setUser(me)

        if (!warehouseId) {
          setNotFound(true)
          setLoading(false)
          return
        }

        const response = await fetch(`/api/admin/warehouses/${warehouseId}`)
        const data = await response.json().catch(() => ({}))
        if (response.status === 404) {
          setNotFound(true)
          return
        }
        if (response.status === 403) {
          setForbidden(true)
          return
        }
        if (!response.ok) {
          setLoadError(data.error || 'Could not load this warehouse')
          return
        }
        setWarehouse(data.warehouse)
        setName(data.warehouse?.name || '')
        setIsActive(Boolean(data.warehouse?.isActive))
      } catch {
        setLoadError('Could not load this warehouse')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [router, warehouseId])

  const adminHref = user?.role === 'SUPER_ADMIN' ? '/admin' : '/admin/site'

  const saveWarehouse = async () => {
    if (!warehouse) return
    setSaving(true)
    setSaveError('')
    try {
      const response = await fetch(`/api/admin/warehouses/${warehouse.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, isActive }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'Failed to update warehouse')
      setWarehouse((current) =>
        current
          ? { ...current, name: data.warehouse.name, isActive: data.warehouse.isActive }
          : current
      )
      setName(data.warehouse.name)
      setIsActive(Boolean(data.warehouse.isActive))
      setConfirmOff(false)
      setEditing(false)
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Failed to update warehouse')
      setConfirmOff(false)
    } finally {
      setSaving(false)
    }
  }

  const handleSave = (event: React.FormEvent) => {
    event.preventDefault()
    if (!warehouse) return
    if (warehouse.isActive && !isActive) {
      setConfirmOff(true)
      return
    }
    saveWarehouse()
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    )
  }

  if (notFound || forbidden || loadError || !warehouse) {
    const title = notFound
      ? 'Warehouse not found'
      : forbidden
        ? 'Access denied'
        : 'Something went wrong'
    const message = notFound
      ? 'This warehouse does not exist, or the link is out of date.'
      : forbidden
        ? 'You can only view warehouses on your own site.'
        : loadError || 'Could not load this warehouse.'
    return (
      <div className="min-h-screen bg-gray-100">
        <main className="container mx-auto px-4 py-8 max-w-lg">
          <div className="card text-center">
            <h1 className="text-xl font-bold text-gray-800">{title}</h1>
            <p className="text-gray-500 mt-2">{message}</p>
            <Link
              href={adminHref}
              className="btn-primary inline-flex items-center justify-center min-h-[44px] mt-6"
            >
              Admin
            </Link>
          </div>
        </main>
      </div>
    )
  }

  const tags = sortByCode(warehouse.tags)
  const groupsOnSite = tags.filter((tag) => tag.visitors.length > 0).length
  const storekeepers = warehouse.users
    .map((assignment) => assignment.user)
    .filter((member) => member.role === 'STOREKEEPER')
    .sort((a, b) => a.name.localeCompare(b.name))
  const warehouseCrumb = `${warehouse.code} – ${warehouse.name}`

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4">
          <nav aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-x-2">
              <li>
                <Link
                  href={adminHref}
                  className="inline-flex items-center min-h-[44px] font-medium text-amber-800 hover:text-amber-900"
                >
                  Admin
                </Link>
              </li>
              <li aria-hidden="true" className="text-gray-400">
                ›
              </li>
              <li>
                <Link
                  href={`/admin/sites/${warehouse.site.id}`}
                  className="inline-flex items-center min-h-[44px] font-medium text-amber-800 hover:text-amber-900"
                >
                  {warehouse.site.name}
                </Link>
              </li>
              <li aria-hidden="true" className="text-gray-400">
                ›
              </li>
              <li>
                <Link
                  href={`/admin/warehouses/${warehouse.id}`}
                  aria-current="page"
                  className="inline-flex items-center min-h-[44px] font-medium text-amber-800 hover:text-amber-900"
                >
                  {warehouseCrumb}
                </Link>
              </li>
            </ol>
          </nav>
        </div>
      </div>

      <main className="container mx-auto px-4 py-6 max-w-3xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm bg-amber-50 border border-amber-200 text-amber-800 px-3 py-1 rounded">
              {warehouse.code}
            </span>
            <h1 className="text-2xl font-bold text-gray-800">{warehouse.name}</h1>
            <StatusBadge active={warehouse.isActive} />
          </div>
          <button
            type="button"
            onClick={() => {
              setName(warehouse.name)
              setIsActive(warehouse.isActive)
              setSaveError('')
              setConfirmOff(false)
              setEditing(true)
            }}
            className="btn-primary min-h-[44px]"
          >
            Edit
          </button>
        </div>

        <section>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-bold text-gray-800">Tags ({tags.length})</h2>
            {tags.length === 0 ? (
              <button type="button" className="btn-primary min-h-[44px] opacity-50" disabled>
                Print labels
              </button>
            ) : (
              <Link
                href={`/admin/tags?warehouseId=${warehouse.id}&print=1`}
                className="btn-primary inline-flex items-center justify-center min-h-[44px] text-center"
              >
                Print labels
              </Link>
            )}
          </div>
          {tags.length === 0 ? (
            <div className="card text-center py-8 text-gray-500">No tags for this warehouse</div>
          ) : (
            <div className="space-y-3">
              {tags.map((tag) => {
                const inUse = tag.visitors.length > 0
                return (
                  <div key={tag.id} className="card py-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-mono font-semibold text-gray-800">{tag.code}</p>
                      <p className={`text-sm font-medium ${inUse ? 'text-green-700' : 'text-gray-500'}`}>
                        {tagUseLabel(tag, now)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Storekeepers ({storekeepers.length})
          </h2>
          {storekeepers.length === 0 ? (
            <div className="card text-center py-8 text-gray-500">No storekeepers assigned</div>
          ) : (
            <div className="space-y-3">
              {storekeepers.map((member) => (
                <div key={member.id} className="card py-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold text-gray-800">{member.name}</p>
                      <p className="text-sm font-mono text-gray-500">{member.username}</p>
                    </div>
                    <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700">
                      {ROLE_LABELS.STOREKEEPER}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-bold text-gray-800">
              Recent visitors ({warehouse.visitors.length})
            </h2>
            <Link
              href={`/dashboard/history?warehouse=${encodeURIComponent(warehouse.code)}`}
              className="inline-flex items-center min-h-[44px] font-medium text-amber-800 hover:text-amber-900"
            >
              View all in History
            </Link>
          </div>
          {warehouse.visitors.length === 0 ? (
            <div className="card text-center py-8 text-gray-500">No visitors yet</div>
          ) : (
            <>
              <div className="space-y-3 md:hidden">
                {warehouse.visitors.map((visitor) => (
                  <div key={visitor.id} className="card py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-gray-800">{visitor.name}</p>
                        <p className="text-sm text-gray-500">
                          {displayLabel(visitor.visitorType)}
                          {visitor.company ? ` · ${visitor.company}` : ''}
                          {visitor.purpose ? ` · ${displayLabel(visitor.purpose)}` : ''}
                        </p>
                        {visitor.carPlate && (
                          <p className="text-sm font-mono text-gray-500 mt-1">{visitor.carPlate}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-700">{displayLabel(visitor.status)}</p>
                        <p className="text-sm text-gray-500">{formatDateTime(visitor.timeIn)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="hidden md:block card overflow-x-auto p-0">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Type
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Purpose
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Time in
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {warehouse.visitors.map((visitor) => (
                      <tr key={visitor.id}>
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {visitor.name}
                          {visitor.company && (
                            <span className="block text-sm font-normal text-gray-500">
                              {visitor.company}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {displayLabel(visitor.visitorType)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {displayLabel(visitor.purpose)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {displayLabel(visitor.status)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                          {formatDateTime(visitor.timeIn)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      </main>

      {editing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-warehouse-title"
            className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
          >
            <h2 id="edit-warehouse-title" className="text-xl font-bold text-gray-800 mb-4">
              Edit warehouse
            </h2>
            {saveError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                {saveError}
              </div>
            )}
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label htmlFor="warehouse-code" className="label">
                  Warehouse code
                </label>
                <input
                  id="warehouse-code"
                  type="text"
                  value={warehouse.code}
                  readOnly
                  className="input-field bg-gray-50 text-gray-600 font-mono"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Codes are unique company-wide and cannot be changed.
                </p>
              </div>
              <div>
                <label htmlFor="warehouse-name" className="label">
                  Warehouse name
                </label>
                <input
                  id="warehouse-name"
                  type="text"
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="input-field"
                />
              </div>
              <label className="flex items-center gap-3 min-h-[44px] cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(event) => setIsActive(event.target.checked)}
                  className="h-5 w-5 rounded border-gray-300 text-amber-800 focus:ring-amber-500"
                />
                <span className="text-gray-800">{isActive ? 'Active' : 'Inactive'}</span>
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="btn-secondary flex-1 min-h-[44px]"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex-1 min-h-[44px]" disabled={saving}>
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmOff && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-off-title"
            className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
          >
            <h2 id="confirm-off-title" className="text-xl font-bold text-gray-800 mb-3">
              Turn this warehouse off?
            </h2>
            <p className="text-gray-600">Tags will stop accepting check-ins.</p>
            {groupsOnSite > 0 && (
              <p className="text-gray-800 mt-3">
                {groupsOnSite === 1
                  ? '1 group is still on site.'
                  : `${groupsOnSite} groups are still on site.`}{' '}
                Check {groupsOnSite === 1 ? 'that group' : 'them'} out first.
              </p>
            )}
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setConfirmOff(false)}
                className="btn-secondary flex-1 min-h-[44px]"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveWarehouse}
                className="btn-primary flex-1 min-h-[44px]"
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Turn off'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
