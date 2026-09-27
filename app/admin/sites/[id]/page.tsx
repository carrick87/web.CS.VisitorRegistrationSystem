'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ROLE_LABELS, sortByCode } from '@/lib/utils'

interface UserSession {
  name: string
  role: string
}

interface SiteUser {
  id: string
  username: string
  name: string
  role: string
}

interface SiteWarehouse {
  id: string
  code: string
  name: string
  isActive: boolean
  activeVisitorCount: number
  tagCount: number
  tagsInUse: number
}

interface SiteDetail {
  id: string
  name: string
  code: string | null
  warehouses: SiteWarehouse[]
  users: SiteUser[]
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

function roleBadgeClass(role: string): string {
  if (role === 'SITE_ADMIN') return 'bg-blue-100 text-blue-700'
  if (role === 'STOREKEEPER') return 'bg-green-100 text-green-700'
  return 'bg-gray-100 text-gray-600'
}

function Breadcrumb({
  adminHref,
  siteName,
  siteHref,
}: {
  adminHref: string
  siteName: string
  siteHref: string
}) {
  return (
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
            href={siteHref}
            aria-current="page"
            className="inline-flex items-center min-h-[44px] font-medium text-amber-800 hover:text-amber-900"
          >
            {siteName}
          </Link>
        </li>
      </ol>
    </nav>
  )
}

export default function SiteDetailPage() {
  const router = useRouter()
  const params = useParams()
  const siteId = typeof params.id === 'string' ? params.id : ''

  const [user, setUser] = useState<UserSession | null>(null)
  const [site, setSite] = useState<SiteDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [forbidden, setForbidden] = useState(false)
  const [loadError, setLoadError] = useState('')

  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

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

        if (!siteId) {
          setNotFound(true)
          setLoading(false)
          return
        }

        const response = await fetch(`/api/admin/sites/${siteId}`)
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
          setLoadError(data.error || 'Could not load this site')
          return
        }
        setSite(data.site)
        setName(data.site?.name || '')
      } catch {
        setLoadError('Could not load this site')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [router, siteId])

  const adminHref = user?.role === 'SUPER_ADMIN' ? '/admin' : '/admin/site'

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!site) return
    setSaving(true)
    setSaveError('')
    try {
      const response = await fetch(`/api/admin/sites/${site.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'Failed to update site')
      setSite((current) => (current ? { ...current, name: data.site.name } : current))
      setName(data.site.name)
      setEditing(false)
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Failed to update site')
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

  if (notFound || forbidden || loadError || !site) {
    const title = notFound ? 'Site not found' : forbidden ? 'Access denied' : 'Something went wrong'
    const message = notFound
      ? 'This site does not exist, or the link is out of date.'
      : forbidden
        ? 'You can only view your own site.'
        : loadError || 'Could not load this site.'
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

  const warehouses = sortByCode(site.warehouses)
  const canEdit = user.role === 'SUPER_ADMIN'

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4">
          <Breadcrumb adminHref={adminHref} siteName={site.name} siteHref={`/admin/sites/${site.id}`} />
        </div>
      </div>

      <main className="container mx-auto px-4 py-6 max-w-3xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {site.code && (
              <span className="font-mono text-sm bg-amber-50 border border-amber-200 text-amber-800 px-3 py-1 rounded">
                {site.code}
              </span>
            )}
            <h1 className="text-2xl font-bold text-gray-800">{site.name}</h1>
          </div>
          {canEdit && (
            <button
              type="button"
              onClick={() => {
                setName(site.name)
                setSaveError('')
                setEditing(true)
              }}
              className="btn-primary min-h-[44px]"
            >
              Edit
            </button>
          )}
        </div>

        <section>
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Warehouses ({warehouses.length})
          </h2>
          {warehouses.length === 0 ? (
            <div className="card text-center py-8 text-gray-500">No warehouses at this site</div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {warehouses.map((warehouse) => (
                <Link
                  key={warehouse.id}
                  href={`/admin/warehouses/${warehouse.id}`}
                  className="card block hover:ring-2 hover:ring-amber-800/30 focus:outline-none focus:ring-2 focus:ring-amber-800"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm bg-amber-50 border border-amber-200 text-amber-800 px-2 py-0.5 rounded">
                      {warehouse.code}
                    </span>
                    <StatusBadge active={warehouse.isActive} />
                  </div>
                  <h3 className="font-semibold text-gray-800 mt-2">{warehouse.name}</h3>
                  <p className="mt-3 text-sm text-gray-600">
                    {warehouse.activeVisitorCount} checked in now
                  </p>
                  <p className="text-sm text-gray-600">
                    {warehouse.tagsInUse} of {warehouse.tagCount} tags in use
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-800 mb-4">Users ({site.users.length})</h2>
          {site.users.length === 0 ? (
            <div className="card text-center py-8 text-gray-500">
              No site admins or storekeepers
            </div>
          ) : (
            <div className="space-y-3">
              {site.users.map((member) => (
                <div key={member.id} className="card py-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold text-gray-800">{member.name}</p>
                      <p className="text-sm font-mono text-gray-500">{member.username}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${roleBadgeClass(member.role)}`}>
                      {ROLE_LABELS[member.role as keyof typeof ROLE_LABELS] || member.role}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {editing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-site-title"
            className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
          >
            <h2 id="edit-site-title" className="text-xl font-bold text-gray-800 mb-4">
              Edit site
            </h2>
            {saveError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                {saveError}
              </div>
            )}
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label htmlFor="site-code" className="label">
                  Site code
                </label>
                <input
                  id="site-code"
                  type="text"
                  value={site.code || ''}
                  readOnly
                  className="input-field bg-gray-50 text-gray-600 font-mono"
                />
              </div>
              <div>
                <label htmlFor="site-name" className="label">
                  Site name
                </label>
                <input
                  id="site-name"
                  type="text"
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="input-field"
                />
              </div>
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
    </div>
  )
}
