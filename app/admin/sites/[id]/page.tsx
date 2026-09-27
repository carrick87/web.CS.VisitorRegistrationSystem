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
  _count: { visitors: number; users: number }
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

  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [saved, setSaved] = useState(false)

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

  const backHref = user?.role === 'SUPER_ADMIN' ? '/admin' : '/admin/site'

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!site) return
    setSaving(true)
    setSaveError('')
    setSaved(false)
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
      setSaved(true)
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

  const warehouses = sortByCode(site.warehouses)
  const canEdit = user?.role === 'SUPER_ADMIN'

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
          <h1 className="text-2xl font-bold text-gray-800">{site.name}</h1>
          {site.code ? (
            <p className="mt-1 text-sm font-mono text-gray-500">{site.code}</p>
          ) : (
            <p className="mt-1 text-sm text-gray-400">No site code</p>
          )}
        </div>

        {canEdit && (
          <form onSubmit={handleSave} className="card space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">Edit site</h2>
            {saveError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {saveError}
              </div>
            )}
            {saved && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                Site name saved
              </div>
            )}
            <div>
              <label htmlFor="site-name" className="label">
                Site name
              </label>
              <input
                id="site-name"
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
            <button type="submit" className="btn-primary min-h-[44px] w-full sm:w-auto" disabled={saving}>
              {saving ? 'Saving...' : 'Save name'}
            </button>
          </form>
        )}

        <section>
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Warehouses ({warehouses.length})
          </h2>
          {warehouses.length === 0 ? (
            <div className="card text-center py-8 text-gray-500">No warehouses at this site</div>
          ) : (
            <div className="space-y-4">
              {warehouses.map((warehouse) => (
                <div key={warehouse.id} className="card">
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-gray-800">{warehouse.name}</h3>
                        <StatusBadge active={warehouse.isActive} />
                      </div>
                      <p className="text-sm font-mono text-gray-500 mt-1">{warehouse.code}</p>
                    </div>
                    <Link
                      href={`/admin/warehouses/${warehouse.id}`}
                      className="inline-flex items-center min-h-[44px] px-2 text-amber-800 hover:text-amber-900 text-sm font-medium"
                    >
                      View →
                    </Link>
                  </div>
                  <p className="mt-3 text-sm text-gray-500">
                    {warehouse._count.visitors} visitors
                  </p>
                </div>
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
    </div>
  )
}
