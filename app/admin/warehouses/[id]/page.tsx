'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import QRCode from 'qrcode'
import { displayLabel, formatDateTime, getWarehouseCheckInUrl, ROLE_LABELS } from '@/lib/utils'

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

interface WarehouseDetail {
  id: string
  code: string
  name: string
  isActive: boolean
  site: { id: string; name: string; code: string | null }
  users: { user: Storekeeper }[]
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

  const [name, setName] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [saved, setSaved] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState('')

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

  const gateUrl = warehouse ? getWarehouseCheckInUrl(warehouse.code) : ''

  useEffect(() => {
    if (!gateUrl) {
      setQrDataUrl('')
      return
    }
    let cancelled = false
    QRCode.toDataURL(gateUrl, {
      width: 480,
      margin: 1,
      errorCorrectionLevel: 'H',
    })
      .then((dataUrl) => {
        if (!cancelled) setQrDataUrl(dataUrl)
      })
      .catch((error) => {
        console.error('Failed to generate QR:', error)
      })
    return () => {
      cancelled = true
    }
  }, [gateUrl])

  const backHref = user?.role === 'SUPER_ADMIN' ? '/admin' : '/admin/site'

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!warehouse) return
    setSaving(true)
    setSaveError('')
    setSaved(false)
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
      setSaved(true)
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Failed to update warehouse')
    } finally {
      setSaving(false)
    }
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
              href={backHref}
              className="btn-primary inline-flex items-center justify-center min-h-[44px] mt-6"
            >
              Back to admin
            </Link>
          </div>
        </main>
      </div>
    )
  }

  const storekeepers = warehouse.users
    .map((assignment) => assignment.user)
    .filter((member) => member.role === 'STOREKEEPER')
    .sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center justify-between gap-2 min-h-16 py-2">
            <Link
              href={backHref}
              className="inline-flex items-center min-h-[44px] font-bold text-gray-800 hover:text-amber-800"
            >
              ← Admin
            </Link>
            <span className="text-sm text-gray-500">Welcome, {user?.name}</span>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-6 max-w-3xl space-y-6">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-800">{warehouse.name}</h1>
            <StatusBadge active={warehouse.isActive} />
          </div>
          <p className="mt-1 text-sm font-mono text-gray-500">{warehouse.code}</p>
        </div>

        <form onSubmit={handleSave} className="card space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">Edit warehouse</h2>
          {saveError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {saveError}
            </div>
          )}
          {saved && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
              Warehouse saved
            </div>
          )}
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
              onChange={(event) => {
                setName(event.target.value)
                setSaved(false)
              }}
              className="input-field"
            />
          </div>
          <label className="flex items-center gap-3 min-h-[44px] cursor-pointer">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(event) => {
                setIsActive(event.target.checked)
                setSaved(false)
              }}
              className="h-5 w-5 rounded border-gray-300 text-amber-800 focus:ring-amber-500"
            />
            <span className="text-gray-800">{isActive ? 'Active' : 'Inactive'}</span>
          </label>
          <button type="submit" className="btn-primary min-h-[44px] w-full sm:w-auto" disabled={saving}>
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </form>

        <section className="card space-y-4">
          <div>
            <p className="text-sm text-gray-500">Site</p>
            <Link
              href={`/admin/sites/${warehouse.site.id}`}
              className="inline-flex items-center min-h-[44px] text-amber-800 hover:text-amber-900 font-medium"
            >
              {warehouse.site.name}
              {warehouse.site.code ? ` (${warehouse.site.code})` : ''}
            </Link>
          </div>
          <div>
            <p className="text-sm text-gray-500">Status</p>
            <div className="mt-1">
              <StatusBadge active={warehouse.isActive} />
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Check-in gate</p>
            <a
              href={gateUrl}
              className="inline-flex items-center min-h-[44px] text-amber-800 hover:text-amber-900 break-all font-mono text-sm"
            >
              {gateUrl}
            </a>
          </div>
          <div className="flex justify-center">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={`QR code for check-in gate ${warehouse.code}`}
                className="w-48 h-48 bg-white"
              />
            ) : (
              <div className="w-48 h-48 bg-gray-50 rounded-lg flex items-center justify-center text-sm text-gray-400">
                Preparing QR code
              </div>
            )}
          </div>
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

        <section className="card">
          <h2 className="text-lg font-semibold text-gray-800">Tags</h2>
          <Link
            href={`/admin/tags?warehouseId=${warehouse.id}`}
            className="inline-flex items-center min-h-[44px] text-amber-800 hover:text-amber-900 font-medium"
          >
            {warehouse._count.tags} {warehouse._count.tags === 1 ? 'tag' : 'tags'} →
          </Link>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Recent visitors ({warehouse.visitors.length})
          </h2>
          {warehouse.visitors.length === 0 ? (
            <div className="card text-center py-8 text-gray-500">No visitors yet</div>
          ) : (
            <div className="space-y-3">
              {warehouse.visitors.map((visitor) => (
                <div key={visitor.id} className="card py-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
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
          )}
          <p className="text-xs text-gray-400 mt-3">
            {warehouse._count.visitors} visitors in total
          </p>
        </section>
      </main>
    </div>
  )
}
